import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { Prisma, LoanStatus, InterestMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoanProductsService } from '../loan-products/loan-products.service';
import { LoanProductRules } from '../loan-products/interfaces/loan-product-rules.interface';
import { LoanStatusSyncService } from './loan-status-sync.service';
import { PortalNotificationsService } from '../portal/portal-notifications.service';

interface QueryLoansDto {
  status?: LoanStatus;
  clientId?: string;
  applicationId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class LoansService {
  private static readonly OPEN_STATUSES = new Set<LoanStatus>([
    LoanStatus.ACTIVE,
    LoanStatus.DUE,
    LoanStatus.IN_ARREARS,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loanProductsService: LoanProductsService,
    private readonly loanStatusSyncService: LoanStatusSyncService,
    @Inject(forwardRef(() => PortalNotificationsService))
    private readonly notificationsService: PortalNotificationsService,
  ) {}

  private computeOverdue(dueDate: Date, isPaid: boolean) {
    if (isPaid) {
      return { isOverdue: false, daysPastDue: 0 };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    if (dueStart.getTime() >= todayStart.getTime()) {
      return { isOverdue: false, daysPastDue: 0 };
    }

    const diffMs = todayStart.getTime() - dueStart.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return { isOverdue: true, daysPastDue: days };
  }

  private async generateLoanNumber(): Promise<string> {
    const count = await this.prisma.loan.count();
    const base = `LN-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const existing = await this.prisma.loan.findUnique({ where: { loanNumber: base } });
    if (!existing) return base;

    return `${base}-${Date.now()}`;
  }

  async findAll(query: QueryLoansDto) {
    const { status, clientId, applicationId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LoanWhereInput = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (applicationId) {
      // Resolve application number to UUID if needed
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId);
      
      if (isUuid) {
        where.applicationId = applicationId;
      } else {
        // Resolve application number to UUID
        const application = await this.prisma.loanApplication.findFirst({
          where: { applicationNumber: applicationId },
          select: { id: true },
        });
        
        if (application) {
          where.applicationId = application.id;
        } else {
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
      }
    }

    if (status && LoansService.OPEN_STATUSES.has(status)) {
      where.AND = [
        {
          OR: [
            { outstandingPrincipal: { gt: 0.01 } },
            { outstandingInterest: { gt: 0.01 } },
            { outstandingFees: { gt: 0.01 } },
            { outstandingPenalties: { gt: 0.01 } },
          ],
        },
      ];
    }
    
    if (search) {
      where.OR = [
        { loanNumber: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
        { client: { phonePrimary: { contains: search, mode: 'insensitive' } } },
        { client: { clientCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [loans, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              clientCode: true,
              firstName: true,
              lastName: true,
              phonePrimary: true,
            },
          },
          application: {
            select: {
              id: true,
              applicationNumber: true,
              status: true,
              mpesaDisbursementNumber: true,
            },
          },
          schedules: true,
          repayments: {
            orderBy: { transactionDate: 'asc' },
          },
        },
      }),
      this.prisma.loan.count({ where }),
    ]);

    const decorated = loans.map((loan: any) => {
      const schedules = (loan.schedules || []).map((s: any) => {
        const computed = this.computeOverdue(s.dueDate, Boolean(s.isPaid));
        return {
          ...s,
          isOverdue: computed.isOverdue,
          daysPastDue: computed.daysPastDue,
        };
      });

      return { ...loan, schedules };
    });

    return {
      data: decorated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        client: true,
        application: true,
        schedules: true,
        repayments: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    const schedules = (loan as any).schedules.map((s: any) => {
      const computed = this.computeOverdue(s.dueDate, Boolean(s.isPaid));
      return {
        ...s,
        isOverdue: computed.isOverdue,
        daysPastDue: computed.daysPastDue,
      };
    });

    return { ...(loan as any), schedules };
  }

  async createFromApplication(applicationId: string, userId: string) {
    try {
      // Resolve application number to UUID if needed
      let resolvedApplicationId = applicationId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId);
      
      if (!isUuid) {
        const application = await this.prisma.loanApplication.findFirst({
          where: { applicationNumber: applicationId },
          select: { id: true },
        });
        
        if (!application) {
          throw new NotFoundException('Loan application not found');
        }
        resolvedApplicationId = application.id;
      }

      const application = await this.prisma.loanApplication.findUnique({
        where: { id: resolvedApplicationId },
        include: {
          client: true,
          productVersion: {
            include: { loanProduct: true },
          },
          loan: true,
        },
      });

      if (!application) {
        throw new NotFoundException('Loan application not found');
      }

      if (application.status !== 'APPROVED') {
        throw new BadRequestException('Only APPROVED applications can be converted to loans');
      }

      if (application.loan) {
        throw new BadRequestException('A loan already exists for this application');
      }

      if (
        !application.approvedPrincipal ||
        !application.approvedTermMonths ||
        !application.approvedInterestRate
      ) {
        throw new BadRequestException('Approved terms are missing on the application');
      }

      const productVersion = application.productVersion;
      if (!productVersion || !productVersion.loanProduct) {
        throw new BadRequestException('Linked product version or product not found');
      }

      const rules = productVersion.rules as unknown as LoanProductRules;

      const principal =
        (application.approvedPrincipal as any).toNumber?.() ?? Number(application.approvedPrincipal);
      const termMonths = application.approvedTermMonths;
      const interestRateApproved =
        (application.approvedInterestRate as any).toNumber?.() ??
        Number(application.approvedInterestRate);

      if (principal < rules.terms.min_principal || principal > rules.terms.max_principal) {
        throw new BadRequestException('Approved principal is outside allowed product limits');
      }
      if (termMonths < rules.terms.min_term_months || termMonths > rules.terms.max_term_months) {
        throw new BadRequestException('Approved term is outside allowed product limits');
      }

      const startDate = new Date().toISOString().split('T')[0];

      const schedule = await this.loanProductsService.previewSchedule(
        productVersion.loanProductId,
        productVersion.id,
        {
          principal,
          term_months: termMonths,
          start_date: startDate,
        },
      );

      const totalInterest = schedule.totals.interest;
      const totalFees = schedule.totals.fees;
      const totalPayable = schedule.totals.total_payable;

      const loanNumber = await this.generateLoanNumber();

      const interestMethod: InterestMethod =
        rules.interest.calculation_method === 'FLAT'
          ? InterestMethod.FLAT_RATE
          : InterestMethod.DECLINING_BALANCE;

      const penaltyRate = rules.penalties?.late_payment?.value ?? 0;

      const firstDueDateStr = schedule.installments[0]?.due_date;
      const maturityDateStr = schedule.installments[schedule.installments.length - 1]?.due_date;

      const firstDueDate = firstDueDateStr ? new Date(firstDueDateStr) : null;
      const maturityDate = maturityDateStr ? new Date(maturityDateStr) : null;

      return await this.prisma.$transaction(async (tx) => {
        const loan = await tx.loan.create({
          data: {
            loanNumber,
            clientId: application.clientId,
            applicationId: application.id,
            principalAmount: new Prisma.Decimal(principal),
            interestRate: new Prisma.Decimal(interestRateApproved),
            interestMethod,
            penaltyRate: new Prisma.Decimal(penaltyRate),
            termMonths,
            totalInterest: new Prisma.Decimal(totalInterest),
            totalAmount: new Prisma.Decimal(totalPayable),
            outstandingPrincipal: new Prisma.Decimal(principal),
            outstandingInterest: new Prisma.Decimal(totalInterest),
            outstandingFees: new Prisma.Decimal(totalFees),
            outstandingPenalties: new Prisma.Decimal(0),
            status: LoanStatus.PENDING_DISBURSEMENT,
            disbursedAt: null,
            firstDueDate: firstDueDate,
            maturityDate: maturityDate,
          },
        });

        await tx.loanSchedule.createMany({
          data: schedule.installments.map((inst: any) => ({
            loanId: loan.id,
            installmentNumber: inst.number,
            dueDate: new Date(inst.due_date),
            principalDue: new Prisma.Decimal(inst.principal),
            interestDue: new Prisma.Decimal(inst.interest),
            feesDue: new Prisma.Decimal(inst.fees),
            totalDue: new Prisma.Decimal(inst.total_due),
            principalPaid: new Prisma.Decimal(0),
            interestPaid: new Prisma.Decimal(0),
            feesPaid: new Prisma.Decimal(0),
            penaltiesPaid: new Prisma.Decimal(0),
            totalPaid: new Prisma.Decimal(0),
            balance: new Prisma.Decimal(inst.balance_after),
            isPaid: false,
            isOverdue: false,
            daysPastDue: 0,
          })),
        });

        return loan;
      });
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }

      throw new BadRequestException(err?.message || 'Failed to create loan');
    }
  }

  async disburse(id: string, userId: string) {
    const loan = await this.prisma.loan.findUnique({ 
      where: { id },
      include: { client: true },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== LoanStatus.PENDING_DISBURSEMENT) {
      throw new BadRequestException('Only PENDING_DISBURSEMENT loans can be disbursed');
    }

    // Get the disbursing user's name
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const disbursedByName = user ? `${user.firstName} ${user.lastName}` : 'Finance Officer';

    const updated = await this.prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.ACTIVE,
        disbursedAt: new Date(),
      },
    });

    // Log the disbursement event in audit log
    await this.prisma.auditLog.create({
      data: {
        entity: 'loans',
        entityId: id,
        action: 'DISBURSE',
        performedBy: userId,
        oldValue: { status: LoanStatus.PENDING_DISBURSEMENT },
        newValue: {
          status: LoanStatus.ACTIVE,
          amount: Number(loan.principalAmount),
          disbursedBy: disbursedByName,
          disbursedAt: new Date().toISOString(),
        },
      },
    });

    // Send notifications to client
    try {
      await this.notificationsService.notifyLoanDisbursed(
        loan.clientId,
        loan.loanNumber,
        Number(loan.principalAmount),
        disbursedByName,
      );
    } catch (err) {
      console.error('Failed to send disbursement notification:', err);
    }

    // Immediately reconcile derived status (ACTIVE/DUE/IN_ARREARS) based on schedules.
    try {
      await this.loanStatusSyncService.recalculateLoan(id);
    } catch {
      // ignore - disbursement succeeded
    }

    return this.prisma.loan.findUnique({ where: { id } });
  }

  async getStats() {
    const [total, activeCount, closedCount, writtenOffCount, aggregates, writtenOffAggregates] = await Promise.all([
      this.prisma.loan.count(),
      this.prisma.loan.count({
        where: { status: { in: [LoanStatus.ACTIVE, LoanStatus.DUE, LoanStatus.IN_ARREARS] } },
      }),
      this.prisma.loan.count({
        where: { status: LoanStatus.CLOSED },
      }),
      this.prisma.loan.count({
        where: { status: LoanStatus.WRITTEN_OFF },
      }),
      this.prisma.loan.aggregate({
        _sum: {
          principalAmount: true,
          outstandingPrincipal: true,
        },
        where: {
          status: {
            in: [
              LoanStatus.ACTIVE,
              LoanStatus.DUE,
              LoanStatus.IN_ARREARS,
              LoanStatus.CLOSED,
              LoanStatus.WRITTEN_OFF,
              LoanStatus.RESTRUCTURED,
            ],
          },
        },
      }),
      this.prisma.loan.aggregate({
        _sum: {
          principalAmount: true,
          outstandingPrincipal: true,
        },
        where: { status: LoanStatus.WRITTEN_OFF },
      }),
    ]);

    const totalDisbursed = Number(aggregates._sum.principalAmount ?? 0);
    const totalOutstanding = Number(aggregates._sum.outstandingPrincipal ?? 0);
    const writtenOffAmount = Number(writtenOffAggregates._sum.principalAmount ?? 0);
    const averageLoanSize = total > 0 ? totalDisbursed / total : 0;

    return {
      total,
      active: activeCount,
      closed: closedCount,
      writtenOff: writtenOffCount,
      totalDisbursed,
      totalOutstanding,
      writtenOffAmount,
      averageLoanSize,
    };
  }
}
