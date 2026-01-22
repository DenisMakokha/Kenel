import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, LoanStatus, Prisma, RepaymentChannel, RepaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoanStatusSyncService } from '../loans/loan-status-sync.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { QueryRepaymentsDto } from './dto/query-repayments.dto';
import { QueryAllRepaymentsDto } from './dto/query-all-repayments.dto';
import { LoanProductRules } from '../loan-products/interfaces/loan-product-rules.interface';

@Injectable()
export class RepaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loanStatusSyncService: LoanStatusSyncService,
  ) {}

  private async generateReceiptNumber(): Promise<string> {
    const count = await this.prisma.repayment.count();
    const base = `RCPT-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const existing = await this.prisma.repayment.findUnique({ where: { receiptNumber: base } });
    if (!existing) return base;

    return `${base}-${Date.now()}`;
  }

  async listForLoan(loanId: string, query: QueryRepaymentsDto) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RepaymentWhereInput = {
      loanId,
    };
    if (status) where.status = status;

    const [repayments, total] = await Promise.all([
      this.prisma.repayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
        include: {
          allocation: true,
        },
      }),
      this.prisma.repayment.count({ where }),
    ]);

    return {
      data: repayments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listAll(query: QueryAllRepaymentsDto) {
    const {
      search,
      loanId,
      clientId,
      channel,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.RepaymentWhereInput = {};
    if (loanId) where.loanId = loanId;
    if (channel) where.channel = channel;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      const gte = dateFrom ? new Date(dateFrom) : undefined;
      const lte = dateTo ? new Date(`${dateTo}T23:59:59.999Z`) : undefined;
      where.transactionDate = {
        ...(gte ? { gte } : {}),
        ...(lte ? { lte } : {}),
      };
    }

    if (clientId) {
      where.loan = { clientId };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { receiptNumber: { contains: q, mode: 'insensitive' } },
        { reference: { contains: q, mode: 'insensitive' } },
        {
          loan: {
            loanNumber: { contains: q, mode: 'insensitive' },
          },
        },
        {
          loan: {
            client: {
              OR: [
                { clientCode: { contains: q, mode: 'insensitive' } },
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { phonePrimary: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const [repayments, total] = await Promise.all([
      this.prisma.repayment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { transactionDate: 'desc' },
        include: {
          allocation: true,
          loan: {
            select: {
              id: true,
              loanNumber: true,
              clientId: true,
              client: {
                select: {
                  id: true,
                  clientCode: true,
                  firstName: true,
                  lastName: true,
                  phonePrimary: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.repayment.count({ where }),
    ]);

    return {
      data: repayments,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async postRepayment(loanId: string, userId: string, dto: CreateRepaymentDto) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        schedules: true,
        application: {
          include: {
            productVersion: true,
          },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (![LoanStatus.ACTIVE, LoanStatus.DUE, LoanStatus.IN_ARREARS].includes(loan.status)) {
      throw new BadRequestException('Repayments can only be posted on ACTIVE/DUE/IN_ARREARS loans');
    }

    if (!loan.disbursedAt) {
      throw new BadRequestException('Loan has not been disbursed yet');
    }

    const valueDate = new Date(dto.valueDate);
    if (Number.isNaN(valueDate.getTime())) {
      throw new BadRequestException('Invalid value date');
    }

    const today = new Date();
    if (valueDate > today) {
      throw new BadRequestException('Value date cannot be in the future');
    }

    const disbursedAt = loan.disbursedAt;
    const disbursedDayStart = new Date(
      disbursedAt.getFullYear(),
      disbursedAt.getMonth(),
      disbursedAt.getDate(),
    );
    if (valueDate < disbursedDayStart) {
      throw new BadRequestException('Value date cannot be before disbursement date');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const outstandingPrincipal =
      (loan.outstandingPrincipal as any).toNumber?.() ?? Number(loan.outstandingPrincipal);
    const outstandingInterest =
      (loan.outstandingInterest as any).toNumber?.() ?? Number(loan.outstandingInterest);
    const outstandingFees =
      (loan.outstandingFees as any).toNumber?.() ?? Number(loan.outstandingFees);
    const outstandingPenalties =
      (loan.outstandingPenalties as any).toNumber?.() ?? Number(loan.outstandingPenalties);

    const outstandingTotal =
      outstandingPrincipal + outstandingInterest + outstandingFees + outstandingPenalties;

    if (outstandingTotal <= 0) {
      throw new BadRequestException('Loan is already fully repaid');
    }

    const amount = dto.amount;
    const epsilon = 0.01;
    if (amount - outstandingTotal > epsilon) {
      const excess = amount - outstandingTotal;
      throw new BadRequestException(
        `Amount exceeds outstanding balance by ${excess.toFixed(2)}. Please reduce the amount.`,
      );
    }

    const productVersion = loan.application?.productVersion;
    const rules = (productVersion?.rules ?? null) as unknown as LoanProductRules | null;
    const allocationOrder = rules?.allocation?.order ?? ['penalties', 'fees', 'interest', 'principal'];

    const schedules = [...loan.schedules].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    );

    let remaining = amount;

    const bucketTotals = {
      principal: 0,
      interest: 0,
      fees: 0,
      penalties: 0,
    } as Record<'principal' | 'interest' | 'fees' | 'penalties', number>;

    const scheduleDeltas: Record<
      string,
      { principal: number; interest: number; fees: number; penalties: number }
    > = {};

    for (const sched of schedules) {
      if (remaining <= epsilon) break;

      let principalDue = (sched.principalDue as any).toNumber?.() ?? Number(sched.principalDue);
      let interestDue = (sched.interestDue as any).toNumber?.() ?? Number(sched.interestDue);
      let feesDue = (sched.feesDue as any).toNumber?.() ?? Number(sched.feesDue);

      let principalPaid = (sched.principalPaid as any).toNumber?.() ?? Number(sched.principalPaid);
      let interestPaid = (sched.interestPaid as any).toNumber?.() ?? Number(sched.interestPaid);
      let feesPaid = (sched.feesPaid as any).toNumber?.() ?? Number(sched.feesPaid);
      let penaltiesPaid = (sched.penaltiesPaid as any).toNumber?.() ?? Number(sched.penaltiesPaid);

      let principalOutstanding = principalDue - principalPaid;
      let interestOutstanding = interestDue - interestPaid;
      let feesOutstanding = feesDue - feesPaid;
      // Penalties are not part of the original schedule amounts; they would be modelled separately
      let penaltiesOutstanding = 0;

      if (!scheduleDeltas[sched.id]) {
        scheduleDeltas[sched.id] = { principal: 0, interest: 0, fees: 0, penalties: 0 };
      }

      for (const bucket of allocationOrder) {
        if (remaining <= epsilon) break;

        let bucketOutstanding = 0;
        if (bucket === 'principal') bucketOutstanding = principalOutstanding;
        if (bucket === 'interest') bucketOutstanding = interestOutstanding;
        if (bucket === 'fees') bucketOutstanding = feesOutstanding;
        if (bucket === 'penalties') bucketOutstanding = penaltiesOutstanding;

        if (bucketOutstanding <= 0) continue;

        const toPay = Math.min(bucketOutstanding, remaining);
        if (toPay <= 0) continue;

        remaining -= toPay;
        bucketTotals[bucket] += toPay;
        scheduleDeltas[sched.id][bucket] += toPay;

        if (bucket === 'principal') principalOutstanding -= toPay;
        if (bucket === 'interest') interestOutstanding -= toPay;
        if (bucket === 'fees') feesOutstanding -= toPay;
        if (bucket === 'penalties') penaltiesOutstanding -= toPay;
      }
    }

    if (remaining > epsilon) {
      throw new BadRequestException('Could not allocate full amount across schedule; please retry');
    }

    const receiptNumber = await this.generateReceiptNumber();

    const newOutstandingPrincipal = outstandingPrincipal - bucketTotals.principal;
    const newOutstandingInterest = outstandingInterest - bucketTotals.interest;
    const newOutstandingFees = outstandingFees - bucketTotals.fees;
    const newOutstandingPenalties = outstandingPenalties - bucketTotals.penalties;

    const newOutstandingTotal =
      newOutstandingPrincipal + newOutstandingInterest + newOutstandingFees + newOutstandingPenalties;

    const closeLoan = newOutstandingTotal <= epsilon;

    const previousTotalRepaid =
      (loan as any).totalRepaid?.toNumber?.() ?? Number((loan as any).totalRepaid ?? 0);

    const lastPaymentDate = loan.lastPaymentDate
      ? new Date(Math.max(loan.lastPaymentDate.getTime(), valueDate.getTime()))
      : valueDate;

    const result = await this.prisma.$transaction(async (tx) => {
      const repayment = await tx.repayment.create({
        data: {
          loanId: loan.id,
          receiptNumber,
          amount: new Prisma.Decimal(amount),
          channel: dto.channel as RepaymentChannel,
          reference: dto.reference,
          transactionDate: valueDate,
          status: RepaymentStatus.APPROVED,
          postedBy: userId,
          postedAt: new Date(),
          approvedBy: userId,
          approvedAt: new Date(),
          notes: dto.notes,
        },
      });

      await tx.repaymentAllocation.create({
        data: {
          repaymentId: repayment.id,
          principalAmount: new Prisma.Decimal(bucketTotals.principal),
          interestAmount: new Prisma.Decimal(bucketTotals.interest),
          feesAmount: new Prisma.Decimal(bucketTotals.fees),
          penaltiesAmount: new Prisma.Decimal(bucketTotals.penalties),
          totalAllocated: new Prisma.Decimal(amount),
        },
      });

      for (const sched of schedules) {
        const delta = scheduleDeltas[sched.id];
        if (!delta) continue;

        const principalPaid =
          (sched.principalPaid as any).toNumber?.() ?? Number(sched.principalPaid);
        const interestPaid =
          (sched.interestPaid as any).toNumber?.() ?? Number(sched.interestPaid);
        const feesPaid = (sched.feesPaid as any).toNumber?.() ?? Number(sched.feesPaid);
        const penaltiesPaid =
          (sched.penaltiesPaid as any).toNumber?.() ?? Number(sched.penaltiesPaid);
        const totalPaid = (sched.totalPaid as any).toNumber?.() ?? Number(sched.totalPaid);

        const newPrincipalPaid = principalPaid + delta.principal;
        const newInterestPaid = interestPaid + delta.interest;
        const newFeesPaid = feesPaid + delta.fees;
        const newPenaltiesPaid = penaltiesPaid + delta.penalties;
        const newTotalPaid = totalPaid + delta.principal + delta.interest + delta.fees + delta.penalties;

        const principalDue =
          (sched.principalDue as any).toNumber?.() ?? Number(sched.principalDue);
        const interestDue =
          (sched.interestDue as any).toNumber?.() ?? Number(sched.interestDue);
        const feesDue = (sched.feesDue as any).toNumber?.() ?? Number(sched.feesDue);

        const isPaid =
          newPrincipalPaid >= principalDue - epsilon &&
          newInterestPaid >= interestDue - epsilon &&
          newFeesPaid >= feesDue - epsilon;

        await tx.loanSchedule.update({
          where: { id: sched.id },
          data: {
            principalPaid: new Prisma.Decimal(newPrincipalPaid),
            interestPaid: new Prisma.Decimal(newInterestPaid),
            feesPaid: new Prisma.Decimal(newFeesPaid),
            penaltiesPaid: new Prisma.Decimal(newPenaltiesPaid),
            totalPaid: new Prisma.Decimal(newTotalPaid),
            isPaid,
            paidAt: isPaid && !sched.paidAt ? valueDate : sched.paidAt,
          },
        });
      }

      await tx.loan.update({
        where: { id: loan.id },
        data: {
          outstandingPrincipal: new Prisma.Decimal(Math.max(newOutstandingPrincipal, 0)),
          outstandingInterest: new Prisma.Decimal(Math.max(newOutstandingInterest, 0)),
          outstandingFees: new Prisma.Decimal(Math.max(newOutstandingFees, 0)),
          outstandingPenalties: new Prisma.Decimal(Math.max(newOutstandingPenalties, 0)),
          totalRepaid: new Prisma.Decimal(previousTotalRepaid + amount),
          lastPaymentDate: lastPaymentDate,
          status: closeLoan ? LoanStatus.CLOSED : loan.status,
          closedAt: closeLoan && !loan.closedAt ? valueDate : loan.closedAt,
        },
      });

      return repayment;
    });

    // Ensure derived status is recalculated (e.g. IN_ARREARS -> ACTIVE)
    try {
      await this.loanStatusSyncService.recalculateLoan(loanId);
    } catch {
      // ignore
    }

    return result;
  }

  async getRepaymentForReceipt(loanId: string, repaymentId: string) {
    const repayment = await this.prisma.repayment.findUnique({
      where: { id: repaymentId },
      include: {
        allocation: true,
        loan: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!repayment || repayment.loanId !== loanId) {
      throw new NotFoundException('Repayment not found for this loan');
    }

    return repayment;
  }

  async getRepaymentForReceiptById(repaymentId: string) {
    const repayment = await this.prisma.repayment.findUnique({
      where: { id: repaymentId },
      include: {
        allocation: true,
        loan: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!repayment) {
      throw new NotFoundException('Repayment not found');
    }

    return repayment;
  }

  async reverseRepayment(loanId: string, repaymentId: string, userId: string, reason: string) {
    const repayment = await this.prisma.repayment.findUnique({
      where: { id: repaymentId },
    });

    if (!repayment || repayment.loanId !== loanId) {
      throw new NotFoundException('Repayment not found for this loan');
    }

    if (repayment.status !== RepaymentStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED repayments can be reversed');
    }

    const reversedAt = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.repayment.update({
        where: { id: repaymentId },
        data: {
          status: RepaymentStatus.REVERSED,
          reversedBy: userId,
          reversedAt,
          reversalReason: reason,
        },
      });

      await tx.auditLog.create({
        data: {
          entity: 'repayments',
          entityId: repayment.id,
          action: AuditAction.UPDATE,
          performedBy: userId,
          oldValue: repayment as any,
          newValue: {
            status: updated.status,
            reversedBy: updated.reversedBy,
            reversedAt: updated.reversedAt,
            reversalReason: updated.reversalReason,
          } as any,
          ipAddress: null,
          userAgent: null,
        },
      });

      await this.recalculateLoanState(loanId, tx);

      return tx.repayment.findUnique({
        where: { id: repaymentId },
        include: { allocation: true },
      });
    });

    try {
      await this.loanStatusSyncService.recalculateLoan(loanId);
    } catch {
      // ignore
    }

    return result;
  }

  private async recalculateLoanState(loanId: string, tx: Prisma.TransactionClient) {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: {
        schedules: true,
        repayments: {
          where: { status: RepaymentStatus.APPROVED },
          orderBy: [
            { transactionDate: 'asc' },
            { createdAt: 'asc' },
          ],
        },
        application: {
          include: {
            productVersion: true,
          },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    const rules = (loan.application?.productVersion?.rules ?? null) as unknown as
      | LoanProductRules
      | null;
    const allocationOrder = rules?.allocation?.order ?? ['penalties', 'fees', 'interest', 'principal'];

    const schedules = [...loan.schedules].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    );

    const epsilon = 0.01;

    let principalOutstanding = 0;
    let interestOutstanding = 0;
    let feesOutstanding = 0;
    let penaltiesOutstanding = 0;

    const scheduleState: Record<
      string,
      {
        principalPaid: number;
        interestPaid: number;
        feesPaid: number;
        penaltiesPaid: number;
        totalPaid: number;
        isPaid: boolean;
        paidAt: Date | null;
      }
    > = {};

    for (const sched of schedules) {
      const principalDue = (sched.principalDue as any).toNumber?.() ?? Number(sched.principalDue);
      const interestDue = (sched.interestDue as any).toNumber?.() ?? Number(sched.interestDue);
      const feesDue = (sched.feesDue as any).toNumber?.() ?? Number(sched.feesDue);

      principalOutstanding += principalDue;
      interestOutstanding += interestDue;
      feesOutstanding += feesDue;

      scheduleState[sched.id] = {
        principalPaid: 0,
        interestPaid: 0,
        feesPaid: 0,
        penaltiesPaid: 0,
        totalPaid: 0,
        isPaid: false,
        paidAt: null,
      };
    }

    let totalRepaid = 0;
    let lastPaymentDate: Date | null = null;

    for (const repayment of loan.repayments) {
      const amountDecimal: any = repayment.amount;
      const amount =
        typeof amountDecimal === 'number'
          ? amountDecimal
          : amountDecimal.toNumber?.() ?? Number(amountDecimal);

      let remaining = amount;

      for (const sched of schedules) {
        if (remaining <= epsilon) break;

        const state = scheduleState[sched.id];

        const principalDue = (sched.principalDue as any).toNumber?.() ?? Number(sched.principalDue);
        const interestDue = (sched.interestDue as any).toNumber?.() ?? Number(sched.interestDue);
        const feesDue = (sched.feesDue as any).toNumber?.() ?? Number(sched.feesDue);

        let principalOutstandingSched = principalDue - state.principalPaid;
        let interestOutstandingSched = interestDue - state.interestPaid;
        let feesOutstandingSched = feesDue - state.feesPaid;
        let penaltiesOutstandingSched = 0;

        for (const bucket of allocationOrder) {
          if (remaining <= epsilon) break;

          let bucketOutstanding = 0;
          if (bucket === 'principal') bucketOutstanding = principalOutstandingSched;
          if (bucket === 'interest') bucketOutstanding = interestOutstandingSched;
          if (bucket === 'fees') bucketOutstanding = feesOutstandingSched;
          if (bucket === 'penalties') bucketOutstanding = penaltiesOutstandingSched;

          if (bucketOutstanding <= 0) continue;

          const toPay = Math.min(bucketOutstanding, remaining);
          if (toPay <= 0) continue;

          remaining -= toPay;

          if (bucket === 'principal') {
            principalOutstandingSched -= toPay;
            principalOutstanding -= toPay;
            state.principalPaid += toPay;
          }
          if (bucket === 'interest') {
            interestOutstandingSched -= toPay;
            interestOutstanding -= toPay;
            state.interestPaid += toPay;
          }
          if (bucket === 'fees') {
            feesOutstandingSched -= toPay;
            feesOutstanding -= toPay;
            state.feesPaid += toPay;
          }
          if (bucket === 'penalties') {
            penaltiesOutstandingSched -= toPay;
            penaltiesOutstanding -= toPay;
            state.penaltiesPaid += toPay;
          }

          state.totalPaid += toPay;
        }

        const isPaid =
          state.principalPaid >= principalDue - epsilon &&
          state.interestPaid >= interestDue - epsilon &&
          state.feesPaid >= feesDue - epsilon;

        state.isPaid = isPaid;
        if (isPaid && !state.paidAt) {
          state.paidAt = repayment.transactionDate;
        }
      }

      totalRepaid += amount;
      if (!lastPaymentDate || repayment.transactionDate > lastPaymentDate) {
        lastPaymentDate = repayment.transactionDate;
      }
    }

    const outstandingTotal =
      principalOutstanding + interestOutstanding + feesOutstanding + penaltiesOutstanding;
    const closeLoan = outstandingTotal <= epsilon;

    for (const sched of schedules) {
      const state = scheduleState[sched.id];

      await tx.loanSchedule.update({
        where: { id: sched.id },
        data: {
          principalPaid: new Prisma.Decimal(state.principalPaid),
          interestPaid: new Prisma.Decimal(state.interestPaid),
          feesPaid: new Prisma.Decimal(state.feesPaid),
          penaltiesPaid: new Prisma.Decimal(state.penaltiesPaid),
          totalPaid: new Prisma.Decimal(state.totalPaid),
          isPaid: state.isPaid,
          paidAt: state.paidAt,
        },
      });
    }

    await tx.loan.update({
      where: { id: loan.id },
      data: {
        outstandingPrincipal: new Prisma.Decimal(Math.max(principalOutstanding, 0)),
        outstandingInterest: new Prisma.Decimal(Math.max(interestOutstanding, 0)),
        outstandingFees: new Prisma.Decimal(Math.max(feesOutstanding, 0)),
        outstandingPenalties: new Prisma.Decimal(Math.max(penaltiesOutstanding, 0)),
        totalRepaid: new Prisma.Decimal(Math.max(totalRepaid, 0)),
        lastPaymentDate: lastPaymentDate,
        status: closeLoan ? LoanStatus.CLOSED : LoanStatus.ACTIVE,
        closedAt: closeLoan ? (loan.closedAt ?? lastPaymentDate) : null,
      },
    });
  }
}
