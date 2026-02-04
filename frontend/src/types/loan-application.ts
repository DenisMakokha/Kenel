import { CreatedChannel, KycStatus, RiskRating, DocumentType, Client } from './client';
import { ProductType, RepaymentFrequency } from './loan-product';

export enum LoanApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum LoanApplicationChecklistStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export interface LoanApplicationChecklistItem {
  id: string;
  loanApplicationId: string;
  itemKey: string;
  itemLabel: string;
  status: LoanApplicationChecklistStatus;
  completedBy?: string | null;
  completedAt?: string | null;
  notes?: string | null;
}

export interface LoanApplicationEvent {
  id: string;
  loanApplicationId: string;
  eventType: string;
  fromStatus?: LoanApplicationStatus | null;
  toStatus?: LoanApplicationStatus | null;
  payload?: any;
  performedBy: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: DocumentType | string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface CreditScore {
  id: string;
  applicationId: string;
  repaymentHistoryScore: number;
  stabilityScore: number;
  incomeScore: number;
  obligationScore: number;
  totalScore: number;
  grade: string;
  officerComments?: string;
  recommendation?: string;
  assessedBy: string;
  assessedAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface LoanApplication {
  id: string;
  applicationNumber: string;
  clientId: string;
  productVersionId: string;
  createdBy?: string | null;

  channel?: CreatedChannel | null;
  kycStatusSnapshot?: KycStatus | null;
  riskRatingSnapshot?: RiskRating | null;

  requestedAmount: string; // Prisma Decimal as string
  requestedTermMonths: number;
  requestedRepaymentFrequency?: RepaymentFrequency | null;
  purpose?: string | null;

  status: LoanApplicationStatus;

  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;

  approvedPrincipal?: string | null;
  approvedTermMonths?: number | null;
  approvedInterestRate?: string | null;

  createdAt: string;
  updatedAt: string;

  client?: Client;
  productVersion?: {
    id: string;
    versionNumber: number;
    rules?: {
      fees?: {
        processing_fee_type: 'FIXED' | 'PERCENTAGE';
        processing_fee_value: number;
        processing_fee_cap: number | null;
      };
    };
    loanProduct?: {
      id: string;
      code: string;
      name: string;
      productType: ProductType;
      currencyCode: string;
    };
  };
  documents?: ApplicationDocument[];
  checklistItems?: LoanApplicationChecklistItem[];
  creditScore?: CreditScore | null;
  loan?: any;
  events?: LoanApplicationEvent[];
}

export interface LoanApplicationListResponse {
  data: LoanApplication[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateLoanApplicationDto {
  clientId: string;
  productVersionId: string;
  requestedAmount: number;
  requestedTermMonths: number;
  requestedRepaymentFrequency?: RepaymentFrequency;
  purpose?: string;
  channel?: CreatedChannel;
}

export interface UpdateLoanApplicationDto {
  requestedAmount?: number;
  requestedTermMonths?: number;
  requestedRepaymentFrequency?: RepaymentFrequency;
  purpose?: string;
}

export interface QueryLoanApplicationsDto {
  status?: LoanApplicationStatus;
  clientId?: string;
  productVersionId?: string;
  officerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SubmitLoanApplicationDto {
  notes?: string;
}

export interface ApproveLoanApplicationDto {
  approvedPrincipal: number;
  approvedTermMonths: number;
  approvedInterestRate: number;
  decisionNotes?: string;
}

export interface RejectLoanApplicationDto {
  reason: string;
  notes?: string;
}

export interface UpdateChecklistItemDto {
  status?: LoanApplicationChecklistStatus;
  notes?: string;
}

export interface UpsertCreditScoreDto {
  repaymentHistoryScore: number;
  stabilityScore: number;
  incomeScore: number;
  obligationScore: number;
  officerComments?: string;
  recommendation?: 'APPROVE' | 'REJECT' | 'CONDITIONAL';
}
