import { BadRequestException, Injectable } from '@nestjs/common';
import { LoanStatus, Prisma, RepaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryPortfolioSummaryDto, PortfolioGroupBy } from './dto/portfolio-summary.dto';
import { QueryAgingDto, QueryLoansInBucketDto } from './dto/aging.dto';

interface LoanWithRelations {
  id: string;
  loanNumber: string;
  clientId: string;
  principalAmount: Prisma.Decimal;
  outstandingPrincipal: Prisma.Decimal;
  outstandingInterest: Prisma.Decimal;
  outstandingFees: Prisma.Decimal;
  outstandingPenalties: Prisma.Decimal;
  status: LoanStatus;
  disbursedAt: Date | null;
  lastPaymentDate: Date | null;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    clientCode: string;
  } | null;
  application: {
    id: string;
    productVersion: {
      id: string;
      loanProductId: string;
      loanProduct: {
        id: string;
        name: string;
        code: string;
        currencyCode: string;
      };
    } | null;
  };
  schedules: {
    id: string;
    installmentNumber: number;
    dueDate: Date;
    principalDue: Prisma.Decimal;
    interestDue: Prisma.Decimal;
    feesDue: Prisma.Decimal;
    totalDue: Prisma.Decimal;
    principalPaid: Prisma.Decimal;
    interestPaid: Prisma.Decimal;
    feesPaid: Prisma.Decimal;
    penaltiesPaid: Prisma.Decimal;
    totalPaid: Prisma.Decimal;
  }[];
  repayments: {
    id: string;
    amount: Prisma.Decimal;
    transactionDate: Date;
    createdAt: Date;
  }[];
}

interface LoanDpdInfo {
  daysPastDue: number;
  bucketLabel: string;
  overduePrincipal: number;
  overdueInterest: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseAsOfDate(input?: string): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!input) {
      return today;
    }

    const d = new Date(input);
    if (Number.isNaN(d.getTime())) {
      return today;
    }

    d.setHours(0, 0, 0, 0);

    // Do not allow reports for future dates; clamp to today
    if (d.getTime() > today.getTime()) {
      return today;
    }

    return d;
  }

  private getBucketLabel(daysPastDue: number): string {
    if (daysPastDue <= 0) return '0';
    if (daysPastDue <= 30) return '1-30';
    if (daysPastDue <= 60) return '31-60';
    if (daysPastDue <= 90) return '61-90';
    return '90+';
  }

  private computeLoanDpd(loan: LoanWithRelations, asOfDate: Date): LoanDpdInfo {
    let maxDpd = 0;
    let overduePrincipal = 0;
    let overdueInterest = 0;
    const epsilon = 0.01;

    for (const sched of loan.schedules) {
      if (sched.dueDate > asOfDate) continue;

      const principalDue = (sched.principalDue as any).toNumber?.() ?? Number(sched.principalDue);
      const interestDue = (sched.interestDue as any).toNumber?.() ?? Number(sched.interestDue);
      const totalDue = (sched.totalDue as any).toNumber?.() ?? Number(sched.totalDue);

      const principalPaid = (sched.principalPaid as any).toNumber?.() ?? Number(sched.principalPaid);
      const interestPaid = (sched.interestPaid as any).toNumber?.() ?? Number(sched.interestPaid);
      const feesPaid = (sched.feesPaid as any).toNumber?.() ?? Number(sched.feesPaid);
      const penaltiesPaid = (sched.penaltiesPaid as any).toNumber?.() ?? Number(sched.penaltiesPaid);
      const totalPaid = (sched.totalPaid as any).toNumber?.() ?? Number(sched.totalPaid);

      const outstandingTotal = totalDue - totalPaid;
      if (outstandingTotal <= epsilon) {
        continue;
      }

      const diffMs = asOfDate.getTime() - sched.dueDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        continue;
      }

      if (diffDays > maxDpd) {
        maxDpd = diffDays;
      }

      const principalOutstanding = principalDue - principalPaid;
      const interestOutstanding = interestDue - interestPaid;

      if (principalOutstanding > epsilon) {
        overduePrincipal += principalOutstanding;
      }
      if (interestOutstanding > epsilon) {
        overdueInterest += interestOutstanding;
      }
    }

    return {
      daysPastDue: maxDpd,
      bucketLabel: this.getBucketLabel(maxDpd),
      overduePrincipal,
      overdueInterest,
    };
  }

  private computeOutstandingAsOf(loan: LoanWithRelations, asOfDate: Date) {
    // If the as-of date is before disbursement, treat balances as zero
    if (loan.disbursedAt && asOfDate < loan.disbursedAt) {
      return {
        principalOutstanding: 0,
        interestOutstanding: 0,
        feesOutstanding: 0,
        penaltiesOutstanding: 0,
        scheduleState: {},
        daysPastDue: 0,
        bucketLabel: this.getBucketLabel(0),
        overduePrincipal: 0,
        overdueInterest: 0,
      };
    }

    const rules: any = (loan.application as any)?.productVersion?.rules ?? null;
    const allocationOrder: Array<'penalties' | 'fees' | 'interest' | 'principal'> =
      rules?.allocation?.order ?? ['penalties', 'fees', 'interest', 'principal'];

    const schedules = [...loan.schedules].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    );

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
        principalDue: number;
        interestDue: number;
        feesDue: number;
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
        principalDue,
        interestDue,
        feesDue,
      };
    }

    const epsilon = 0.01;
    const repayments = loan.repayments || [];

    for (const repayment of repayments) {
      if (repayment.transactionDate > asOfDate) {
        break;
      }

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
        }
      }
    }

    // Derive DPD metrics from the as-of schedule state
    let maxDpd = 0;
    let overduePrincipal = 0;
    let overdueInterest = 0;

    for (const sched of schedules) {
      if (sched.dueDate > asOfDate) continue;

      const state = scheduleState[sched.id];
      if (!state) continue;

      const principalOutstandingSched = state.principalDue - state.principalPaid;
      const interestOutstandingSched = state.interestDue - state.interestPaid;
      const feesOutstandingSched = state.feesDue - state.feesPaid;

      const totalOutstandingSched =
        principalOutstandingSched + interestOutstandingSched + feesOutstandingSched;
      if (totalOutstandingSched <= epsilon) continue;

      const diffMs = asOfDate.getTime() - sched.dueDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) continue;

      if (diffDays > maxDpd) {
        maxDpd = diffDays;
      }

      if (principalOutstandingSched > epsilon) {
        overduePrincipal += principalOutstandingSched;
      }
      if (interestOutstandingSched > epsilon) {
        overdueInterest += interestOutstandingSched;
      }
    }

    const bucketLabel = this.getBucketLabel(maxDpd);

    return {
      principalOutstanding,
      interestOutstanding,
      feesOutstanding,
      penaltiesOutstanding,
      scheduleState,
      daysPastDue: maxDpd,
      bucketLabel,
      overduePrincipal,
      overdueInterest,
    };
  }

  async getPortfolioSummary(query: QueryPortfolioSummaryDto) {
    const asOfDate = this.parseAsOfDate(query.asOfDate);
    const groupBy = query.groupBy || PortfolioGroupBy.NONE;

    if (groupBy === PortfolioGroupBy.BRANCH || groupBy === PortfolioGroupBy.OFFICER) {
      throw new BadRequestException('Portfolio summary grouping by branch/officer is not available yet.');
    }

    const loans = await this.prisma.loan.findMany({
      where: {
        // For now include all non-draft application loans
        status: {
          in: [
            LoanStatus.PENDING_DISBURSEMENT,
            LoanStatus.ACTIVE,
            LoanStatus.CLOSED,
            LoanStatus.WRITTEN_OFF,
          ],
        },
      },
      include: {
        client: true,
        application: {
          include: {
            productVersion: {
              include: {
                loanProduct: true,
              },
            },
          },
        },
        schedules: true,
        repayments: {
          where: { status: RepaymentStatus.APPROVED },
          orderBy: [
            { transactionDate: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    const groups = new Map<string, any>();

    let totalOutstandingPrincipalAll = 0;
    let par30Amount = 0;
    let par90Amount = 0;

    for (const loan of loans as any as LoanWithRelations[]) {
      const balances = this.computeOutstandingAsOf(loan, asOfDate);
      const outstandingPrincipal = balances.principalOutstanding;
      const outstandingInterest = balances.interestOutstanding;
      const outstandingFees = balances.feesOutstanding;
      const outstandingPenalties = balances.penaltiesOutstanding;
      const principalAmount = (loan.principalAmount as any).toNumber?.() ?? Number(loan.principalAmount);

      totalOutstandingPrincipalAll += outstandingPrincipal;

      if (balances.daysPastDue > 30) {
        par30Amount += outstandingPrincipal;
      }
      if (balances.daysPastDue > 90) {
        par90Amount += outstandingPrincipal;
      }

      let productId: string | null = null;
      let productName: string | null = null;

      if (loan.application?.productVersion?.loanProduct) {
        const lp = loan.application.productVersion.loanProduct;
        productId = lp.id;
        productName = lp.name;
      }

      if (query.productId && productId !== query.productId) {
        continue;
      }

      let groupKey = 'global';
      const keyPayload: any = {};

      if (groupBy === PortfolioGroupBy.PRODUCT) {
        keyPayload.productId = productId;
        groupKey = JSON.stringify(keyPayload);
      }

      let agg = groups.get(groupKey);
      if (!agg) {
        agg = {
          asOfDate,
          productId: keyPayload.productId ?? null,
          productName,
          branchId: keyPayload.branchId ?? null,
          officerId: keyPayload.officerId ?? null,
          totalLoans: 0,
          totalPrincipalDisbursed: 0,
          totalPrincipalOutstanding: 0,
          totalInterestOutstanding: 0,
          totalFeesOutstanding: 0,
          totalPenaltiesOutstanding: 0,
          totalOverduePrincipal: 0,
          totalOverdueInterest: 0,
          totalClosedLoans: 0,
          totalWrittenOffLoans: 0,
        };
        groups.set(groupKey, agg);
      }

      agg.totalLoans += 1;

      if (loan.disbursedAt && loan.disbursedAt <= asOfDate) {
        agg.totalPrincipalDisbursed += principalAmount;
      }

      agg.totalPrincipalOutstanding += outstandingPrincipal;
      agg.totalInterestOutstanding += outstandingInterest;
      agg.totalFeesOutstanding += outstandingFees;
      agg.totalPenaltiesOutstanding += outstandingPenalties;

      agg.totalOverduePrincipal += balances.overduePrincipal;
      agg.totalOverdueInterest += balances.overdueInterest;

      if (loan.status === LoanStatus.CLOSED) {
        agg.totalClosedLoans += 1;
      }
      if (loan.status === LoanStatus.WRITTEN_OFF) {
        agg.totalWrittenOffLoans += 1;
      }
    }

    const rows = Array.from(groups.values()).map((g) => ({
      asOfDate: g.asOfDate.toISOString().split('T')[0],
      productId: g.productId,
      productName: g.productName,
      branchId: g.branchId,
      officerId: g.officerId,
      totalLoans: g.totalLoans,
      totalPrincipalDisbursed: g.totalPrincipalDisbursed.toFixed(2),
      totalPrincipalOutstanding: g.totalPrincipalOutstanding.toFixed(2),
      totalInterestOutstanding: g.totalInterestOutstanding.toFixed(2),
      totalFeesOutstanding: g.totalFeesOutstanding.toFixed(2),
      totalPenaltiesOutstanding: g.totalPenaltiesOutstanding.toFixed(2),
      totalOverduePrincipal: g.totalOverduePrincipal.toFixed(2),
      totalOverdueInterest: g.totalOverdueInterest.toFixed(2),
      totalClosedLoans: g.totalClosedLoans,
      totalWrittenOffLoans: g.totalWrittenOffLoans,
    }));

    const par30Ratio = totalOutstandingPrincipalAll
      ? par30Amount / totalOutstandingPrincipalAll
      : 0;
    const par90Ratio = totalOutstandingPrincipalAll
      ? par90Amount / totalOutstandingPrincipalAll
      : 0;

    return {
      rows,
      kpis: {
        totalOutstandingPrincipal: totalOutstandingPrincipalAll.toFixed(2),
        par30Amount: par30Amount.toFixed(2),
        par30Ratio,
        par90Amount: par90Amount.toFixed(2),
        par90Ratio,
      },
    };
  }

  async getAgingSummary(query: QueryAgingDto) {
    const asOfDate = this.parseAsOfDate(query.asOfDate);

    const loans = await this.prisma.loan.findMany({
      where: {
        status: {
          in: [
            LoanStatus.PENDING_DISBURSEMENT,
            LoanStatus.ACTIVE,
            LoanStatus.CLOSED,
            LoanStatus.WRITTEN_OFF,
          ],
        },
      },
      include: {
        application: {
          include: {
            productVersion: {
              include: {
                loanProduct: true,
              },
            },
          },
        },
        schedules: true,
        repayments: {
          where: { status: RepaymentStatus.APPROVED },
          orderBy: [
            { transactionDate: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    const buckets = new Map<
      string,
      {
        bucketLabel: string;
        dpdMin: number;
        dpdMax: number | null;
        loansInBucket: number;
        principalOutstanding: number;
      }
    >();

    let totalOutstanding = 0;
    let par30Amount = 0;
    let par90Amount = 0;

    for (const loan of loans as any as LoanWithRelations[]) {
      const balances = this.computeOutstandingAsOf(loan, asOfDate);
      const outstandingPrincipal = balances.principalOutstanding;
      totalOutstanding += outstandingPrincipal;

      const dpdInfo = this.computeLoanDpd(loan, asOfDate);
      const bucketLabel = dpdInfo.bucketLabel;

      if (query.productId) {
        const lp = loan.application?.productVersion?.loanProduct;
        if (!lp || lp.id !== query.productId) {
          continue;
        }
      }

      if (dpdInfo.daysPastDue > 30) {
        par30Amount += outstandingPrincipal;
      }
      if (dpdInfo.daysPastDue > 90) {
        par90Amount += outstandingPrincipal;
      }

      let dpdMin = 0;
      let dpdMax: number | null = null;
      if (bucketLabel === '0') {
        dpdMin = 0;
        dpdMax = 0;
      } else if (bucketLabel === '1-30') {
        dpdMin = 1;
        dpdMax = 30;
      } else if (bucketLabel === '31-60') {
        dpdMin = 31;
        dpdMax = 60;
      } else if (bucketLabel === '61-90') {
        dpdMin = 61;
        dpdMax = 90;
      } else {
        dpdMin = 91;
        dpdMax = null;
      }

      let agg = buckets.get(bucketLabel);
      if (!agg) {
        agg = {
          bucketLabel,
          dpdMin,
          dpdMax,
          loansInBucket: 0,
          principalOutstanding: 0,
        };
        buckets.set(bucketLabel, agg);
      }

      agg.loansInBucket += 1;
      agg.principalOutstanding += outstandingPrincipal;
    }

    const bucketRows = Array.from(buckets.values()).sort((a, b) => a.dpdMin - b.dpdMin);

    const rows = bucketRows.map((b) => ({
      bucketLabel: b.bucketLabel,
      dpdMin: b.dpdMin,
      dpdMax: b.dpdMax,
      loansInBucket: b.loansInBucket,
      principalOutstanding: b.principalOutstanding.toFixed(2),
      principalSharePct:
        totalOutstanding > 0 ? Number((b.principalOutstanding / totalOutstanding).toFixed(4)) : 0,
    }));

    const par30Ratio = totalOutstanding ? par30Amount / totalOutstanding : 0;
    const par90Ratio = totalOutstanding ? par90Amount / totalOutstanding : 0;

    return {
      buckets: rows,
      par: {
        par30Amount: par30Amount.toFixed(2),
        par30Ratio,
        par90Amount: par90Amount.toFixed(2),
        par90Ratio,
      },
    };
  }

  async getLoansInBucket(query: QueryLoansInBucketDto) {
    const asOfDate = this.parseAsOfDate(query.asOfDate);
    const bucket = query.bucket;
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    const loans = await this.prisma.loan.findMany({
      where: {
        status: {
          in: [
            LoanStatus.PENDING_DISBURSEMENT,
            LoanStatus.ACTIVE,
            LoanStatus.CLOSED,
            LoanStatus.WRITTEN_OFF,
          ],
        },
      },
      include: {
        client: true,
        application: {
          include: {
            productVersion: {
              include: {
                loanProduct: true,
              },
            },
          },
        },
        schedules: true,
        repayments: {
          where: { status: RepaymentStatus.APPROVED },
          orderBy: [
            { transactionDate: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    const matching: Array<{
      loan: LoanWithRelations;
      dpdInfo: LoanDpdInfo;
    }> = [];

    for (const loan of loans as any as LoanWithRelations[]) {
      const dpdInfo = this.computeLoanDpd(loan, asOfDate);
      if (dpdInfo.bucketLabel !== bucket) continue;

      if (query.productId) {
        const lp = loan.application?.productVersion?.loanProduct;
        if (!lp || lp.id !== query.productId) {
          continue;
        }
      }

      matching.push({ loan, dpdInfo });
    }

    const total = matching.length;
    const slice = matching.slice(offset, offset + limit);

    const data = slice.map(({ loan, dpdInfo }) => {
      const balances = this.computeOutstandingAsOf(loan, asOfDate);
      const outstandingPrincipal = balances.principalOutstanding;

      const clientName = loan.client
        ? `${loan.client.firstName || ''} ${loan.client.lastName || ''}`.trim() || loan.client.clientCode
        : loan.clientId;

      const productName = loan.application?.productVersion?.loanProduct?.name ?? 'N/A';

      return {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        clientName,
        productName,
        daysPastDue: dpdInfo.daysPastDue,
        bucketLabel: dpdInfo.bucketLabel,
        principalOutstanding: outstandingPrincipal.toFixed(2),
        lastPaymentDate: loan.lastPaymentDate ? loan.lastPaymentDate.toISOString() : null,
        status: loan.status,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
