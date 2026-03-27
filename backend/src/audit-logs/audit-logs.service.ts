import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(query: QueryAuditLogsDto) {
    const { entity, entityId, loanId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    let where: Prisma.AuditLogWhereInput = {};

    if (entity) {
      where.entity = entity;
    }

    if (entityId) {
      // If entity is loan_applications, resolve application number to UUID
      if (entity === 'loan_applications') {
        console.log(`[AuditLogs] Resolving application: ${entityId}`);
        
        const application = await this.prisma.loanApplication.findFirst({
          where: {
            OR: [
              { id: entityId },
              { applicationNumber: entityId },
            ],
          },
          select: { id: true },
        });
        
        console.log(`[AuditLogs] Found application:`, application);
        
        if (application) {
          where.entityId = application.id;
          console.log(`[AuditLogs] Using resolved UUID: ${application.id}`);
        } else {
          console.log(`[AuditLogs] Application not found: ${entityId}`);
          // If application not found, return empty result
          return {
            data: [],
            meta: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          };
        }
      } else {
        where.entityId = entityId;
      }
    }

    // If loanId is provided without a specific entityId, fetch repayment logs for that loan
    if (loanId && !entityId) {
      const repayments = await this.prisma.repayment.findMany({
        where: { loanId },
        select: { id: true },
      });

      if (repayments.length === 0) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }

      const repaymentIds = repayments.map((r) => r.id);
      where = {
        entity: 'repayments',
        entityId: { in: repaymentIds },
      };
    }

    console.log(`[AuditLogs] Executing query with where clause:`, JSON.stringify(where, null, 2));
    
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
