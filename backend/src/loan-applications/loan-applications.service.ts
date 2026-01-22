import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  LoanApplicationStatus,
  LoanApplicationChecklistStatus,
  DocumentType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoansService } from '../loans/loans.service';
import {
  ApproveLoanApplicationDto,
  BulkActionResultDto,
  BulkApproveLoanApplicationsDto,
  CreateLoanApplicationDto,
  QueryLoanApplicationsDto,
  BulkRejectLoanApplicationsDto,
  RejectLoanApplicationDto,
  SubmitLoanApplicationDto,
  UpdateChecklistItemDto,
  UpdateLoanApplicationDto,
  UpsertCreditScoreDto,
} from './dto';
import { LoanProductRules } from '../loan-products/interfaces/loan-product-rules.interface';

@Injectable()
export class LoanApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loansService: LoansService,
  ) {}

  // ============================================
  // HELPERS
  // ============================================

  private async generateApplicationNumber(): Promise<string> {
    const count = await this.prisma.loanApplication.count();
    const base = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const existing = await this.prisma.loanApplication.findUnique({
      where: { applicationNumber: base },
    });

    if (!existing) return base;

    return `${base}-${Date.now()}`;
  }

  private mapScoreToGrade(totalScore: number): string {
    if (totalScore >= 18) return 'A';
    if (totalScore >= 15) return 'B';
    if (totalScore >= 12) return 'C';
    if (totalScore >= 8) return 'D';
    return 'E';
  }

  private async getApplicationOrThrow(id: string) {
    const application = await this.prisma.loanApplication.findUnique({
      where: { id },
      include: {
        client: true,
        productVersion: {
          include: {
            loanProduct: true,
          },
        },
        documents: true,
        checklistItems: true,
        creditScore: true,
        loan: true,
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Loan application not found');
    }

    return application;
  }

  private async logEvent(
    loanApplicationId: string,
    userId: string,
    eventType: string,
    fromStatus: LoanApplicationStatus | null,
    toStatus: LoanApplicationStatus | null,
    payload?: any,
  ) {
    await this.prisma.loanApplicationEvent.create({
      data: {
        loanApplicationId,
        eventType,
        fromStatus: fromStatus ?? undefined,
        toStatus: toStatus ?? undefined,
        payload,
        performedBy: userId,
      },
    });
  }

  private validateAgainstRules(
    rules: LoanProductRules,
    amount: number,
    termMonths: number,
  ) {
    if (amount < rules.terms.min_principal || amount > rules.terms.max_principal) {
      throw new BadRequestException(
        `Requested amount must be between ${rules.terms.min_principal} and ${rules.terms.max_principal}`,
      );
    }

    if (termMonths < rules.terms.min_term_months || termMonths > rules.terms.max_term_months) {
      throw new BadRequestException(
        `Requested term must be between ${rules.terms.min_term_months} and ${rules.terms.max_term_months} months`,
      );
    }
  }

  private async seedDefaultChecklist(applicationId: string) {
    const items = [
      {
        itemKey: 'kyc_verified',
        itemLabel: 'Client KYC verified',
      },
      {
        itemKey: 'id_document_uploaded',
        itemLabel: 'ID document uploaded',
      },
      {
        itemKey: 'payslip_uploaded',
        itemLabel: 'Latest payslip uploaded',
      },
      {
        itemKey: 'employer_confirmed',
        itemLabel: 'Employer contact verified',
      },
    ];

    await this.prisma.loanApplicationChecklistItem.createMany({
      data: items.map((item) => ({
        loanApplicationId: applicationId,
        itemKey: item.itemKey,
        itemLabel: item.itemLabel,
      })),
    });
  }

  // ============================================
  // CRUD & LISTING
  // ============================================

  async create(dto: CreateLoanApplicationDto, userId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, deletedAt: null },
    });

    if (!client) {
      throw new BadRequestException('Client not found or deleted');
    }

    const productVersion = await this.prisma.loanProductVersion.findFirst({
      where: {
        id: dto.productVersionId,
        status: 'PUBLISHED',
      },
      include: {
        loanProduct: true,
      },
    });

    if (!productVersion) {
      throw new BadRequestException('Loan product version not found or not published');
    }

    const rules = productVersion.rules as unknown as LoanProductRules;
    this.validateAgainstRules(rules, dto.requestedAmount, dto.requestedTermMonths);

    const applicationNumber = await this.generateApplicationNumber();

    const application = await this.prisma.loanApplication.create({
      data: {
        applicationNumber,
        clientId: dto.clientId,
        productVersionId: dto.productVersionId,
        createdBy: userId,
        channel: dto.channel ?? client.createdChannel,
        kycStatusSnapshot: client.kycStatus,
        riskRatingSnapshot: client.riskRating,
        requestedAmount: dto.requestedAmount,
        requestedTermMonths: dto.requestedTermMonths,
        requestedRepaymentFrequency:
          dto.requestedRepaymentFrequency ?? rules.terms.repayment_frequency ?? 'MONTHLY',
        purpose: dto.purpose,
        status: 'DRAFT',
      },
    });

    await this.seedDefaultChecklist(application.id);
    await this.logEvent(application.id, userId, 'application_created', null, application.status, {
      requestedAmount: application.requestedAmount,
      requestedTermMonths: application.requestedTermMonths,
    });

    return this.getApplicationOrThrow(application.id);
  }

  async findAll(query: QueryLoanApplicationsDto) {
    const { status, clientId, productVersionId, officerId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LoanApplicationWhereInput = {};

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (productVersionId) where.productVersionId = productVersionId;
    if (officerId) where.createdBy = officerId;

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { clientCode: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [applications, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
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
              kycStatus: true,
              riskRating: true,
            },
          },
          productVersion: {
            select: {
              id: true,
              versionNumber: true,
              loanProduct: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  productType: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return {
      data: applications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.getApplicationOrThrow(id);
  }

  // ============================================
  // PORTAL WORKFLOW (CLIENT)
  // ============================================

  async updateForPortal(id: string, dto: UpdateLoanApplicationDto, portalClientId: string, portalUserId: string) {
    const application = await this.getApplicationOrThrow(id);

    if (application.clientId !== portalClientId) {
      throw new BadRequestException('Application not found for this client');
    }

    if (application.status !== 'DRAFT' && application.status !== 'REJECTED') {
      throw new BadRequestException('Only DRAFT or REJECTED applications can be updated');
    }

    // logEvent requires a User id (not portal user). Use the linked client.userId.
    const client = await this.prisma.client.findUnique({ where: { id: portalClientId } });
    if (!client?.userId) {
      throw new BadRequestException('Client user not found');
    }

    return this.update(id, dto, client.userId);
  }

  async submitForPortal(
    id: string,
    dto: SubmitLoanApplicationDto,
    portalClientId: string,
    portalUserId?: string,
  ) {
    const application = await this.getApplicationOrThrow(id);

    if (application.clientId !== portalClientId) {
      throw new BadRequestException('Application not found for this client');
    }

    if (application.status !== 'DRAFT' && application.status !== 'REJECTED') {
      throw new BadRequestException('Only DRAFT or REJECTED applications can be submitted');
    }

    // Require at least one non-deleted supporting document before submit
    const hasDocs = (application.documents || []).some((d: any) => d && (d.isDeleted === false || d.isDeleted === undefined));
    if (!hasDocs) {
      throw new BadRequestException('Please upload at least one supporting document before submitting');
    }

    const client = await this.prisma.client.findUnique({ where: { id: portalClientId } });
    if (!client?.userId) {
      throw new BadRequestException('Client user not found');
    }

    const updated = await this.prisma.loanApplication.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    await this.logEvent(id, client.userId, 'application_submitted', application.status, updated.status, {
      notes: dto.notes,
      portalUserId: portalUserId ?? null,
    });

    return this.getApplicationOrThrow(id);
  }

  async update(id: string, dto: UpdateLoanApplicationDto, userId: string, userRole?: string) {
    const application = await this.getApplicationOrThrow(id);

    if (userRole === UserRole.CREDIT_OFFICER) {
      if (application.status !== 'DRAFT' && application.status !== 'REJECTED') {
        throw new BadRequestException(
          'Credit officers can only update DRAFT or REJECTED applications',
        );
      }
    }

    if (application.status !== 'DRAFT' && application.status !== 'REJECTED') {
      throw new BadRequestException('Only DRAFT or REJECTED applications can be updated');
    }

    const productVersion = await this.prisma.loanProductVersion.findUnique({
      where: { id: application.productVersionId },
    });

    if (!productVersion) {
      throw new BadRequestException('Linked product version not found');
    }

    const rules = productVersion.rules as unknown as LoanProductRules;

    const amount = dto.requestedAmount ?? application.requestedAmount.toNumber?.() ?? Number(application.requestedAmount);
    const term = dto.requestedTermMonths ?? application.requestedTermMonths;
    this.validateAgainstRules(rules, amount, term);

    const updated = await this.prisma.loanApplication.update({
      where: { id },
      data: {
        requestedAmount: dto.requestedAmount ?? undefined,
        requestedTermMonths: dto.requestedTermMonths ?? undefined,
        requestedRepaymentFrequency: dto.requestedRepaymentFrequency ?? undefined,
        purpose: dto.purpose ?? undefined,
      },
    });

    await this.logEvent(id, userId, 'application_updated', application.status, updated.status, {
      before: {
        requestedAmount: application.requestedAmount,
        requestedTermMonths: application.requestedTermMonths,
      },
      after: {
        requestedAmount: updated.requestedAmount,
        requestedTermMonths: updated.requestedTermMonths,
      },
    });

    return this.getApplicationOrThrow(id);
  }

  // ============================================
  // WORKFLOW
  // ============================================

  async submit(id: string, dto: SubmitLoanApplicationDto, userId: string) {
    const application = await this.getApplicationOrThrow(id);

    if (application.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT applications can be submitted');
    }

    const updated = await this.prisma.loanApplication.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    await this.logEvent(id, userId, 'application_submitted', application.status, updated.status, {
      notes: dto.notes,
    });

    return this.getApplicationOrThrow(id);
  }

  async moveToUnderReview(id: string, userId: string) {
    const application = await this.getApplicationOrThrow(id);

    if (application.status !== 'SUBMITTED') {
      throw new BadRequestException('Only SUBMITTED applications can be moved to UNDER_REVIEW');
    }

    const updated = await this.prisma.loanApplication.update({
      where: { id },
      data: {
        status: 'UNDER_REVIEW',
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });

    await this.logEvent(id, userId, 'moved_to_under_review', application.status, updated.status);

    return this.getApplicationOrThrow(id);
  }

  async approve(id: string, dto: ApproveLoanApplicationDto, userId: string) {
    const application = await this.getApplicationOrThrow(id);

    if (application.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('Only UNDER_REVIEW applications can be approved');
    }

    const updated = await this.prisma.loanApplication.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId,
        approvedPrincipal: dto.approvedPrincipal,
        approvedTermMonths: dto.approvedTermMonths,
        approvedInterestRate: dto.approvedInterestRate,
      },
    });

    // Mark existing credit score (if any) as approved by the checker
    await this.prisma.creditScore.updateMany({
      where: { applicationId: id, approvedBy: null },
      data: {
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    await this.logEvent(id, userId, 'application_approved', application.status, updated.status, {
      approvedPrincipal: dto.approvedPrincipal,
      approvedTermMonths: dto.approvedTermMonths,
      approvedInterestRate: dto.approvedInterestRate,
      decisionNotes: dto.decisionNotes,
    });

    // Auto-create a loan so Finance sees it in the pending disbursement queue.
    // If it fails, we keep the application approved (manual creation remains possible).
    try {
      await this.loansService.createFromApplication(id, userId);
    } catch {
      // intentionally ignored
    }

    return this.getApplicationOrThrow(id);
  }

  async bulkApprove(dto: BulkApproveLoanApplicationsDto, userId: string): Promise<BulkActionResultDto> {
    const result: BulkActionResultDto = {
      requested: dto.ids.length,
      succeeded: 0,
      failed: 0,
      succeededIds: [],
      errors: [],
    };

    for (const id of dto.ids) {
      try {
        await this.approve(
          id,
          {
            approvedPrincipal: dto.approvedPrincipal,
            approvedTermMonths: dto.approvedTermMonths,
            approvedInterestRate: dto.approvedInterestRate,
            decisionNotes: dto.decisionNotes,
          },
          userId,
        );
        result.succeeded += 1;
        result.succeededIds.push(id);
      } catch (err: any) {
        result.failed += 1;
        result.errors.push({ id, message: err?.message || 'Failed to approve' });
      }
    }

    return result;
  }

  async bulkReject(dto: BulkRejectLoanApplicationsDto, userId: string): Promise<BulkActionResultDto> {
    const result: BulkActionResultDto = {
      requested: dto.ids.length,
      succeeded: 0,
      failed: 0,
      succeededIds: [],
      errors: [],
    };

    for (const id of dto.ids) {
      try {
        await this.reject(
          id,
          {
            reason: dto.reason,
            notes: dto.notes,
          },
          userId,
        );
        result.succeeded += 1;
        result.succeededIds.push(id);
      } catch (err: any) {
        result.failed += 1;
        result.errors.push({ id, message: err?.message || 'Failed to reject' });
      }
    }

    return result;
  }

  async reject(id: string, dto: RejectLoanApplicationDto, userId: string) {
    const application = await this.getApplicationOrThrow(id);

    if (application.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('Only UNDER_REVIEW applications can be rejected');
    }

    const updated = await this.prisma.loanApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: userId,
        rejectionReason: dto.reason,
      },
    });

    await this.logEvent(id, userId, 'application_rejected', application.status, updated.status, {
      reason: dto.reason,
      notes: dto.notes,
    });

    return this.getApplicationOrThrow(id);
  }

  // ============================================
  // CREDIT SCORING
  // ============================================

  async upsertScore(applicationId: string, dto: UpsertCreditScoreDto, userId: string) {
    const application = await this.getApplicationOrThrow(applicationId);

    if (application.status !== LoanApplicationStatus.SUBMITTED && application.status !== LoanApplicationStatus.UNDER_REVIEW) {
      throw new BadRequestException('Score can only be captured for SUBMITTED or UNDER_REVIEW applications');
    }

    const totalScore =
      dto.repaymentHistoryScore +
      dto.stabilityScore +
      dto.incomeScore +
      dto.obligationScore;
    const grade = this.mapScoreToGrade(totalScore);

    const existing = await this.prisma.creditScore.findUnique({
      where: { applicationId },
    });

    let score;
    if (existing) {
      const updateData: Prisma.CreditScoreUncheckedUpdateInput = {
        repaymentHistoryScore: dto.repaymentHistoryScore,
        stabilityScore: dto.stabilityScore,
        incomeScore: dto.incomeScore,
        obligationScore: dto.obligationScore,
        totalScore,
        grade,
        officerComments: dto.officerComments ?? undefined,
        recommendation: dto.recommendation ?? undefined,
        assessedBy: userId,
        assessedAt: new Date(),
      };
      score = await this.prisma.creditScore.update({
        where: { applicationId },
        data: updateData,
      });
    } else {
      const createData: Prisma.CreditScoreUncheckedCreateInput = {
        applicationId,
        repaymentHistoryScore: dto.repaymentHistoryScore,
        stabilityScore: dto.stabilityScore,
        incomeScore: dto.incomeScore,
        obligationScore: dto.obligationScore,
        totalScore,
        grade,
        officerComments: dto.officerComments ?? undefined,
        recommendation: dto.recommendation ?? undefined,
        assessedBy: userId,
        assessedAt: new Date(),
      };
      score = await this.prisma.creditScore.create({
        data: createData,
      });
    }

    await this.logEvent(
      applicationId,
      userId,
      'score_saved',
      application.status,
      application.status,
      {
        totalScore: score.totalScore,
        grade: score.grade,
      },
    );

    return score;
  }

  // ============================================
  // CHECKLIST
  // ============================================

  async getChecklist(applicationId: string) {
    await this.getApplicationOrThrow(applicationId);

    return this.prisma.loanApplicationChecklistItem.findMany({
      where: { loanApplicationId: applicationId },
      orderBy: { itemKey: 'asc' },
    });
  }

  async updateChecklistItem(applicationId: string, itemId: string, dto: UpdateChecklistItemDto, userId: string) {
    await this.getApplicationOrThrow(applicationId);

    const item = await this.prisma.loanApplicationChecklistItem.findFirst({
      where: {
        id: itemId,
        loanApplicationId: applicationId,
      },
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    const data: Prisma.LoanApplicationChecklistItemUncheckedUpdateInput = {
      notes: dto.notes ?? undefined,
    };

    if (dto.status) {
      data.status = dto.status;
      if (dto.status === LoanApplicationChecklistStatus.PENDING) {
        data.completedBy = null;
        data.completedAt = null;
      } else {
        data.completedBy = userId;
        data.completedAt = new Date();
      }
    }

    const updated = await this.prisma.loanApplicationChecklistItem.update({
      where: { id: itemId },
      data,
    });

    return updated;
  }

  // ============================================
  // DOCUMENTS
  // ============================================

  async getDocuments(applicationId: string) {
    await this.getApplicationOrThrow(applicationId);

    return this.prisma.applicationDocument.findMany({
      where: { applicationId, isDeleted: false } as any,
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getDocumentById(applicationId: string, documentId: string) {
    await this.getApplicationOrThrow(applicationId);

    return this.prisma.applicationDocument.findFirst({
      where: { id: documentId, applicationId, isDeleted: false } as any,
    });
  }

  async uploadDocument(
    applicationId: string,
    file: Express.Multer.File,
    documentType: string,
    uploadedBy?: string,
  ) {
    await this.getApplicationOrThrow(applicationId);

    const normalized = (documentType || '').toString().trim().toUpperCase();
    if (!Object.values(DocumentType).includes(normalized as any)) {
      throw new BadRequestException('Invalid document type');
    }

    const document = await this.prisma.applicationDocument.create({
      data: {
        applicationId,
        documentType: normalized as any,
        category: null,
        fileName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: uploadedBy || null,
        isDeleted: false,
        reviewStatus: 'PENDING' as any,
        reviewNotes: null,
        reviewedAt: null,
        reviewedBy: null,
      },
    });

    return document;
  }

  async deleteDocument(applicationId: string, documentId: string) {
    await this.getApplicationOrThrow(applicationId);

    const document = await this.prisma.applicationDocument.findFirst({
      where: {
        id: documentId,
        applicationId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.applicationDocument.update({
      where: { id: documentId },
      data: { isDeleted: true },
    });

    return { message: 'Document deleted successfully' };
  }

  // ============================================
  // EVENTS / AUDIT
  // ============================================

  async getEvents(applicationId: string) {
    await this.getApplicationOrThrow(applicationId);

    return this.prisma.loanApplicationEvent.findMany({
      where: { loanApplicationId: applicationId },
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
    });
  }
}
