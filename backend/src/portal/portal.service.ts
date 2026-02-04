import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VirusScanService } from '../virus-scan/virus-scan.service';

@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly virusScanService: VirusScanService,
  ) {}

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
        documents: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'desc' },
        },
        kycEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            reason: true,
            notes: true,
            createdAt: true,
          },
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
      otherNames: client.otherNames,
      email: client.email,
      phonePrimary: client.phonePrimary,
      residentialAddress: client.residentialAddress,
      employerName: client.employerName,
      occupation: client.occupation,
      monthlyIncome: client.monthlyIncome,
      kycStatus: client.kycStatus,
      idNumber: client.idNumber,
      dateOfBirth: client.dateOfBirth,
      maskedIdNumber: this.maskIdNumber(client.idNumber),
      maskedPhone: this.maskPhone(client.phonePrimary),
      nextOfKin: client.nextOfKin,
      referees: client.referees,
      documents: client.documents,
      kycEvents: client.kycEvents,
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

    // Next payment across all active loans - find next unpaid installment
    let nextPaymentAmount: number | null = null;
    let nextPaymentDate: Date | null = null;
    let nextPaymentLoanNumber: string | null = null;

    // Get loan IDs for active loans
    const activeLoanIds = activeLoans.map(l => l.id);
    
    if (activeLoanIds.length > 0) {
      // Find the next unpaid schedule entry across all active loans
      const nextSchedule = await this.prisma.loanSchedule.findFirst({
        where: {
          loanId: { in: activeLoanIds },
          isPaid: false,
        },
        orderBy: { dueDate: 'asc' },
        include: {
          loan: {
            select: { loanNumber: true },
          },
        },
      });

      if (nextSchedule) {
        nextPaymentDate = nextSchedule.dueDate;
        nextPaymentLoanNumber = nextSchedule.loan.loanNumber;
        // Calculate total due for this installment
        const principalDue = Number(nextSchedule.principalDue) - Number(nextSchedule.principalPaid || 0);
        const interestDue = Number(nextSchedule.interestDue) - Number(nextSchedule.interestPaid || 0);
        const feesDue = Number(nextSchedule.feesDue || 0) - Number(nextSchedule.feesPaid || 0);
        nextPaymentAmount = principalDue + interestDue + feesDue;
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

  async updateProfile(clientId: string, data: { 
    firstName?: string; 
    lastName?: string; 
    email?: string; 
    phonePrimary?: string; 
    residentialAddress?: string;
    employerName?: string;
    occupation?: string;
    monthlyIncome?: string;
  }) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Prevent any profile edits once KYC is fully verified
    if (client.kycStatus === 'VERIFIED') {
      throw new BadRequestException(
        'Your account is fully verified. Profile changes are not allowed. Please contact support if you need to update your information.',
      );
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
        employerName:
          typeof data.employerName === 'string'
            ? data.employerName
            : client.employerName,
        occupation:
          typeof data.occupation === 'string'
            ? data.occupation
            : client.occupation,
        monthlyIncome:
          typeof data.monthlyIncome === 'string'
            ? data.monthlyIncome
            : client.monthlyIncome,
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

  async uploadDocument(clientId: string, file: Express.Multer.File, documentType: string) {
    // Verify client exists and get userId
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (!client.userId) {
      throw new BadRequestException('Client does not have an associated user');
    }

    // Save document record
    const document = await this.prisma.clientDocument.create({
      data: {
        clientId,
        documentType: documentType as any,
        fileName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: client.userId,
        uploadedAt: new Date(),
        virusScanStatus: 'pending',
      },
    });

    // Trigger virus scan asynchronously
    this.virusScanService.scanClientDocument(document.id).catch((err) => {
      this.logger.error(`Failed to scan document ${document.id}: ${err.message}`);
    });

    return document;
  }

  async deleteDocument(clientId: string, documentId: string) {
    // Find document and verify it belongs to this client
    const document = await this.prisma.clientDocument.findFirst({
      where: { id: documentId, clientId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete file from disk if it exists
    if (document.filePath) {
      const fs = require('fs');
      try {
        if (fs.existsSync(document.filePath)) {
          fs.unlinkSync(document.filePath);
        }
      } catch {
        // Ignore file deletion errors
      }
    }

    // Delete document record
    await this.prisma.clientDocument.delete({
      where: { id: documentId },
    });

    return { success: true };
  }

  async submitKycForReview(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        nextOfKin: true,
        referees: true,
        documents: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.kycStatus === 'VERIFIED') {
      throw new BadRequestException('KYC is already verified');
    }

    if (client.kycStatus === 'PENDING_REVIEW') {
      throw new BadRequestException('KYC is already pending review');
    }

    // Validate KYC completeness
    const hasPersonalInfo = !!(client.firstName && client.lastName && client.idNumber);
    const hasAddress = !!client.residentialAddress;
    const hasEmployment = !!client.employerName;
    const hasNextOfKin = client.nextOfKin.length > 0;
    const hasReferees = client.referees.length >= 2;

    const docs = client.documents;
    const hasDoc = (type: string) => docs.some((d) => d.documentType === type);
    const hasNationalId = hasDoc('NATIONAL_ID') || hasDoc('PASSPORT');
    const hasKraPin = hasDoc('KRA_PIN');
    const hasBankStatement = hasDoc('BANK_STATEMENT');
    const hasEmploymentDoc = hasDoc('EMPLOYMENT_CONTRACT') || hasDoc('EMPLOYMENT_LETTER') || hasDoc('CONTRACT');
    const hasProofOfResidence = hasDoc('PROOF_OF_RESIDENCE');

    const missingItems: string[] = [];
    if (!hasPersonalInfo) missingItems.push('Personal Information');
    if (!hasAddress) missingItems.push('Residential Address');
    if (!hasEmployment) missingItems.push('Employment Information');
    if (!hasNextOfKin) missingItems.push('Next of Kin');
    if (!hasReferees) missingItems.push('At least 2 Referees');
    if (!hasNationalId) missingItems.push('National ID or Passport');
    if (!hasKraPin) missingItems.push('KRA PIN Certificate');
    if (!hasBankStatement) missingItems.push('Bank Statement');
    if (!hasEmploymentDoc) missingItems.push('Employment Contract/Letter');
    if (!hasProofOfResidence) missingItems.push('Proof of Residence');

    if (missingItems.length > 0) {
      throw new BadRequestException(`Please complete the following before submitting: ${missingItems.join(', ')}`);
    }

    if (!client.userId) {
      throw new BadRequestException('Client does not have an associated user');
    }

    // Create KYC event
    await this.prisma.clientKycEvent.create({
      data: {
        clientId,
        fromStatus: client.kycStatus || 'UNVERIFIED',
        toStatus: 'PENDING_REVIEW',
        notes: 'Submitted via client portal',
        performedBy: client.userId,
      },
    });

    // Update client status
    await this.prisma.client.update({
      where: { id: clientId },
      data: { kycStatus: 'PENDING_REVIEW' },
    });

    return { success: true, message: 'KYC submitted for review' };
  }
}
