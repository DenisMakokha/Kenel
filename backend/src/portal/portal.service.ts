import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  private maskIdNumber(idNumber: string | null | undefined): string | null {
    if (!idNumber) return null;
    if (idNumber.length <= 4) return '*'.repeat(idNumber.length);
    return `${'*'.repeat(idNumber.length - 4)}${idNumber.slice(-4)}`;
  }

  private maskPhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    if (phone.length <= 3) return '*'.repeat(phone.length);
    return `${phone.slice(0, 3)}****${phone.slice(-2)}`;
  }

  async getMe(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        nextOfKin: {
          orderBy: { createdAt: 'desc' },
        },
        referees: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return {
      id: client.id,
      clientCode: client.clientCode,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phonePrimary: client.phonePrimary,
      residentialAddress: client.residentialAddress,
      kycStatus: client.kycStatus,
      maskedIdNumber: this.maskIdNumber(client.idNumber),
      maskedPhone: this.maskPhone(client.phonePrimary),
      nextOfKin: client.nextOfKin,
      referees: client.referees,
    };
  }

  async addNextOfKin(
    clientId: string,
    dto: {
      fullName: string;
      relation: string;
      phone: string;
      email?: string;
      address?: string;
      isPrimary?: boolean;
    },
  ) {
    await this.getMe(clientId);

    const nok = await this.prisma.clientNextOfKin.create({
      data: {
        clientId,
        fullName: dto.fullName,
        relation: dto.relation,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        isPrimary: dto.isPrimary ?? true,
      },
    });

    return nok;
  }

  async updateNextOfKin(
    clientId: string,
    nokId: string,
    dto: {
      fullName?: string;
      relation?: string;
      phone?: string;
      email?: string;
      address?: string;
      isPrimary?: boolean;
    },
  ) {
    const nok = await this.prisma.clientNextOfKin.findFirst({
      where: { id: nokId, clientId },
    });

    if (!nok) {
      throw new NotFoundException('Next of kin not found');
    }

    const updated = await this.prisma.clientNextOfKin.update({
      where: { id: nokId },
      data: dto,
    });

    return updated;
  }

  async removeNextOfKin(clientId: string, nokId: string) {
    const nok = await this.prisma.clientNextOfKin.findFirst({
      where: { id: nokId, clientId },
    });

    if (!nok) {
      throw new NotFoundException('Next of kin not found');
    }

    await this.prisma.clientNextOfKin.delete({
      where: { id: nokId },
    });

    return { message: 'Next of kin removed successfully' };
  }

  async addReferee(
    clientId: string,
    dto: {
      fullName: string;
      phone: string;
      relation?: string;
      idNumber?: string;
      employerName?: string;
      address?: string;
    },
  ) {
    await this.getMe(clientId);

    const referee = await this.prisma.clientReferee.create({
      data: {
        clientId,
        fullName: dto.fullName,
        phone: dto.phone,
        relation: dto.relation,
        idNumber: dto.idNumber,
        employerName: dto.employerName,
        address: dto.address,
      },
    });

    return referee;
  }

  async updateReferee(
    clientId: string,
    refereeId: string,
    dto: {
      fullName?: string;
      phone?: string;
      relation?: string;
      idNumber?: string;
      employerName?: string;
      address?: string;
    },
  ) {
    const referee = await this.prisma.clientReferee.findFirst({
      where: { id: refereeId, clientId },
    });

    if (!referee) {
      throw new NotFoundException('Referee not found');
    }

    const updated = await this.prisma.clientReferee.update({
      where: { id: refereeId },
      data: dto,
    });

    return updated;
  }

  async removeReferee(clientId: string, refereeId: string) {
    const referee = await this.prisma.clientReferee.findFirst({
      where: { id: refereeId, clientId },
    });

    if (!referee) {
      throw new NotFoundException('Referee not found');
    }

    await this.prisma.clientReferee.delete({
      where: { id: refereeId },
    });

    return { message: 'Referee removed successfully' };
  }

  async getLoansForClient(clientId: string) {
    const loans = await this.prisma.loan.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
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
      },
    });

    return loans.map((loan) => {
      const principal = (loan.principalAmount as any).toNumber?.() ?? Number(loan.principalAmount);
      const outstanding =
        (loan.outstandingPrincipal as any).toNumber?.() ?? Number(loan.outstandingPrincipal);

      let nextDueDate: Date | null = null;
      let inArrears = false;
      let daysPastDue = 0;

      for (const sched of loan.schedules) {
        if (!sched.isPaid) {
          if (!nextDueDate || sched.dueDate < nextDueDate) {
            nextDueDate = sched.dueDate;
          }
        }
        if (sched.isOverdue && !sched.isPaid) {
          inArrears = true;
          if (sched.daysPastDue > daysPastDue) {
            daysPastDue = sched.daysPastDue;
          }
        }
      }

      const productName =
        loan.application?.productVersion?.loanProduct?.name ?? loan.applicationId;

      return {
        id: loan.id,
        loanNumber: loan.loanNumber,
        productName,
        status: loan.status,
        principal,
        outstanding,
        nextDueDate,
        inArrears,
        daysPastDue,
      };
    });
  }

  async getLoanForClient(clientId: string, loanId: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, clientId },
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
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found for this client');
    }

    const principal = (loan.principalAmount as any).toNumber?.() ?? Number(loan.principalAmount);
    const outstanding =
      (loan.outstandingPrincipal as any).toNumber?.() ?? Number(loan.outstandingPrincipal);

    let nextDueDate: Date | null = null;
    let inArrears = false;
    let daysPastDue = 0;

    for (const sched of loan.schedules) {
      if (!sched.isPaid) {
        if (!nextDueDate || sched.dueDate < nextDueDate) {
          nextDueDate = sched.dueDate;
        }
      }
      if (sched.isOverdue && !sched.isPaid) {
        inArrears = true;
        if (sched.daysPastDue > daysPastDue) {
          daysPastDue = sched.daysPastDue;
        }
      }
    }

    const productName =
      loan.application?.productVersion?.loanProduct?.name ?? loan.applicationId;

    return {
      id: loan.id,
      loanNumber: loan.loanNumber,
      productName,
      status: loan.status,
      principal,
      outstanding,
      nextDueDate,
      inArrears,
      daysPastDue,
      disbursedAt: loan.disbursedAt,
      termMonths: loan.termMonths,
      interestRate: loan.interestRate,
    };
  }

  async getLoanScheduleForClient(clientId: string, loanId: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, clientId },
      include: { schedules: true },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found for this client');
    }

    return loan.schedules;
  }

  async getLoanTransactionsForClient(clientId: string, loanId: string, from?: Date, to?: Date) {
    const loan = await this.prisma.loan.findFirst({ where: { id: loanId, clientId } });
    if (!loan) {
      throw new NotFoundException('Loan not found for this client');
    }

    const where: any = { loanId, status: 'APPROVED' };
    if (from) {
      where.transactionDate = { ...(where.transactionDate || {}), gte: from };
    }
    if (to) {
      where.transactionDate = { ...(where.transactionDate || {}), lte: to };
    }

    const repayments = await this.prisma.repayment.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: {
        allocation: true,
      },
    });

    return repayments;
  }

  async getDashboard(clientId: string) {
    const loans = await this.getLoansForClient(clientId);

    const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
    const totalActiveLoans = activeLoans.length;
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.outstanding || 0), 0);

    // Next payment across all active loans
    let nextPaymentAmount: number | null = null;
    let nextPaymentDate: Date | null = null;
    let nextPaymentLoanNumber: string | null = null;

    for (const loan of activeLoans) {
      if (!loan.nextDueDate) continue;
      const due = new Date(loan.nextDueDate);
      if (!nextPaymentDate || due < nextPaymentDate) {
        nextPaymentDate = due;
        nextPaymentLoanNumber = loan.loanNumber;
        // We don't have exact installment amount here; use a rough proxy: outstanding / remaining term is out of scope.
        nextPaymentAmount = null;
      }
    }

    return {
      summary: {
        totalActiveLoans,
        totalOutstanding,
        nextPayment: nextPaymentDate
          ? {
              loanNumber: nextPaymentLoanNumber,
              dueDate: nextPaymentDate,
              amount: nextPaymentAmount,
            }
          : null,
      },
      activeLoans,
    };
  }

  async getAvailableLoanProducts() {
    const products = await this.prisma.loanProduct.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    return products
      .map((p) => {
        const version = p.versions?.[0];
        const rules = (version?.rules as any) || null;
        if (!rules) return null;

        const interest = rules.interest || {};
        const terms = rules.terms || {};
        const fees = rules.fees || {};

        return {
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          currencyCode: p.currencyCode,
          productType: p.productType,
          versionId: version.id,
          versionNumber: version.versionNumber,
          minAmount: Number(terms.min_principal ?? 0),
          maxAmount: Number(terms.max_principal ?? 0),
          minTermMonths: Number(terms.min_term_months ?? 0),
          maxTermMonths: Number(terms.max_term_months ?? 0),
          interestRate: Number(interest.rate_per_year ?? 0),
          interestRatePeriod: (interest.rate_period as 'PER_MONTH' | 'PER_ANNUM') || 'PER_ANNUM',
          processingFeeType: (fees.processing_fee_type as 'FIXED' | 'PERCENTAGE') || 'PERCENTAGE',
          processingFeeValue: Number(fees.processing_fee_value ?? 0),
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }

  async getClientDocuments(clientId: string) {
    const documents = await this.prisma.clientDocument.findMany({
      where: { clientId, isDeleted: false },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents.map((doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      sizeBytes: doc.sizeBytes,
      uploadedAt: doc.uploadedAt,
    }));
  }

  async getLoanDocumentsForClient(clientId: string, loanId: string) {
    await this.getLoanForClient(clientId, loanId);

    const documents = await this.prisma.loanDocument.findMany({
      where: { loanId },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents.map((doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      sizeBytes: doc.fileSize,
      uploadedAt: doc.uploadedAt,
    }));
  }

  async updateProfile(clientId: string, data: { firstName?: string; lastName?: string; email?: string; phonePrimary?: string; residentialAddress?: string }) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const isIdentityChange =
      (typeof data.firstName === 'string' && data.firstName !== client.firstName) ||
      (typeof data.lastName === 'string' && data.lastName !== client.lastName) ||
      (typeof data.email === 'string' && data.email !== client.email) ||
      (typeof data.phonePrimary === 'string' && data.phonePrimary !== client.phonePrimary);

    if (isIdentityChange) {
      throw new BadRequestException(
        'You cannot edit your name, email, or phone. Please contact support.',
      );
    }

    const updated = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        residentialAddress:
          typeof data.residentialAddress === 'string'
            ? data.residentialAddress
            : client.residentialAddress,
      },
    });

    return {
      id: updated.id,
      clientCode: updated.clientCode,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      phonePrimary: updated.phonePrimary,
      residentialAddress: updated.residentialAddress,
    };
  }

  async getNotificationPreferences(portalUserId: string) {
    const portalUser = await this.prisma.clientPortalUser.findUnique({
      where: { id: portalUserId },
    });

    if (!portalUser) {
      throw new NotFoundException('Portal user not found');
    }

    const defaultPreferences = {
      paymentReminders: true,
      emailNotifications: true,
      smsNotifications: true,
    };

    return portalUser.preferences || defaultPreferences;
  }

  async updateNotificationPreferences(portalUserId: string, preferences: { paymentReminders?: boolean; emailNotifications?: boolean; smsNotifications?: boolean }) {
    const portalUser = await this.prisma.clientPortalUser.findUnique({
      where: { id: portalUserId },
    });

    if (!portalUser) {
      throw new NotFoundException('Portal user not found');
    }

    const currentPreferences = (portalUser.preferences as any) || {
      paymentReminders: true,
      emailNotifications: true,
      smsNotifications: true,
    };

    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
    };

    await this.prisma.clientPortalUser.update({
      where: { id: portalUserId },
      data: { preferences: updatedPreferences },
    });

    return updatedPreferences;
  }
}
