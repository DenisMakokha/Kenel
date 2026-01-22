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
      where.entityId = entityId;
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
