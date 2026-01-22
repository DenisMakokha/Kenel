import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { LoanStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoanStatusSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LoanStatusSyncService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Keep lightweight: update every 5 minutes
    this.timer = setInterval(() => {
      this.runOnce().catch((err) => {
        this.logger.error('Loan status sync failed', err?.stack || err);
      });
    }, 5 * 60 * 1000);

    // Kick off shortly after boot
    setTimeout(() => {
      this.runOnce().catch((err) => {
        this.logger.error('Initial loan status sync failed', err?.stack || err);
      });
    }, 10 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runOnce() {
    const loans = await this.prisma.loan.findMany({
      where: {
        status: { in: [LoanStatus.ACTIVE, LoanStatus.DUE, LoanStatus.IN_ARREARS] },
      },
      select: {
        id: true,
        status: true,
      },
      take: 5000,
    });

    for (const loan of loans) {
      await this.recalculateLoan(loan.id);
    }
  }

  async recalculateLoan(loanId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    await this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        include: { schedules: true },
      });

      if (!loan) {
        return;
      }

      if (
        loan.status === LoanStatus.PENDING_DISBURSEMENT ||
        loan.status === LoanStatus.CLOSED ||
        loan.status === LoanStatus.WRITTEN_OFF ||
        loan.status === LoanStatus.RESTRUCTURED
      ) {
        return;
      }

      const epsilon = 0.01;

      let hasOverdue = false;
      let hasDueToday = false;

      for (const sched of loan.schedules) {
        const totalDue = (sched.totalDue as any).toNumber?.() ?? Number(sched.totalDue);
        const totalPaid = (sched.totalPaid as any).toNumber?.() ?? Number(sched.totalPaid);
        const remaining = totalDue - totalPaid;

        const dueStart = new Date(
          sched.dueDate.getFullYear(),
          sched.dueDate.getMonth(),
          sched.dueDate.getDate(),
        );

        const isOutstanding = !sched.isPaid && remaining > epsilon;

        let isOverdue = false;
        let daysPastDue = 0;

        if (isOutstanding && dueStart.getTime() < todayStart.getTime()) {
          isOverdue = true;
          const diffMs = todayStart.getTime() - dueStart.getTime();
          daysPastDue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          hasOverdue = true;
        }

        if (isOutstanding && dueStart.getTime() === todayStart.getTime()) {
          hasDueToday = true;
        }

        await tx.loanSchedule.update({
          where: { id: sched.id },
          data: {
            isOverdue,
            daysPastDue,
          },
        });
      }

      const nextStatus = hasOverdue
        ? LoanStatus.IN_ARREARS
        : hasDueToday
          ? LoanStatus.DUE
          : LoanStatus.ACTIVE;

      if (loan.status !== nextStatus) {
        await tx.loan.update({
          where: { id: loanId },
          data: { status: nextStatus },
        });
      }
    });
  }
}
