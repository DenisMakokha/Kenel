import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { retentionPolicies } from './retention-policies';

interface RetentionPlanItem {
  entity: string;
  strategy: 'anonymize' | 'delete' | 'none';
  afterYears: number;
  cutoffDate: Date;
  estimatedCount: number;
}

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getCutoffDate(asOf: Date, afterYears: number): Date {
    const d = new Date(asOf);
    d.setFullYear(d.getFullYear() - afterYears);
    return d;
  }

  async getPlannedActions(asOf: Date = new Date()): Promise<RetentionPlanItem[]> {
    const actions: RetentionPlanItem[] = [];

    const clientsPolicy = retentionPolicies.clients;
    if (clientsPolicy) {
      const cutoff = this.getCutoffDate(asOf, clientsPolicy.afterYears);
      const estimatedCount = await this.prisma.client.count({
        where: {
          createdAt: { lt: cutoff },
        },
      });

      actions.push({
        entity: 'clients',
        strategy: clientsPolicy.strategy,
        afterYears: clientsPolicy.afterYears,
        cutoffDate: cutoff,
        estimatedCount,
      });
    }

    const auditPolicy = retentionPolicies.audit_logs;
    if (auditPolicy) {
      const cutoff = this.getCutoffDate(asOf, auditPolicy.afterYears);
      const estimatedCount = await this.prisma.auditLog.count({
        where: {
          createdAt: { lt: cutoff },
        },
      });

      actions.push({
        entity: 'audit_logs',
        strategy: auditPolicy.strategy,
        afterYears: auditPolicy.afterYears,
        cutoffDate: cutoff,
        estimatedCount,
      });
    }

    return actions;
  }

  async runDryRun(asOf: Date = new Date()): Promise<void> {
    const actions = await this.getPlannedActions(asOf);

    if (!actions.length) {
      this.logger.log('[RetentionDryRun] No retention policies configured.');
      return;
    }

    for (const action of actions) {
      this.logger.log(
        `[RetentionDryRun] entity=${action.entity} strategy=${action.strategy} afterYears=${action.afterYears} cutoff=${action.cutoffDate.toISOString()} estimatedCount=${action.estimatedCount}`,
      );
    }
  }

  async runRetention(asOf: Date = new Date()): Promise<void> {
    this.logger.warn(
      'Data retention is not enabled in v1. runRetention currently performs a dry-run only. Configure a proper job and strategies before enabling destructive behaviour.',
    );

    await this.runDryRun(asOf);
  }
}
