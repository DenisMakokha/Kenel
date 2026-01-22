// Enums
export enum ProductType {
  SALARY_ADVANCE = 'SALARY_ADVANCE',
  TERM_LOAN = 'TERM_LOAN',
  BUSINESS_LOAN = 'BUSINESS_LOAN',
  CUSTOM = 'CUSTOM',
}

export enum ProductVersionStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  RETIRED = 'RETIRED',
}

export enum RepaymentFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum InterestCalculationMethod {
  FLAT = 'FLAT',
  DECLINING_BALANCE = 'DECLINING_BALANCE',
}

export enum FeeType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum PenaltyType {
  FLAT = 'FLAT',
  PERCENTAGE_OF_OVERDUE = 'PERCENTAGE_OF_OVERDUE',
}

export enum PenaltyFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum InterestRatePeriod {
  PER_ANNUM = 'PER_ANNUM',
  PER_MONTH = 'PER_MONTH',
}

export type AllocationItem = 'penalties' | 'fees' | 'interest' | 'principal';

// Rules Interfaces
export interface TermsRules {
  min_principal: number;
  max_principal: number;
  default_principal: number;
  min_term_months: number;
  max_term_months: number;
  default_term_months: number;
  repayment_frequency: RepaymentFrequency;
  allow_topup: boolean;
}

export interface InterestRules {
  calculation_method: InterestCalculationMethod;
  rate_per_year: number;
  min_rate_per_year: number;
  max_rate_per_year: number;
  rate_period?: InterestRatePeriod;
  interest_free_periods: number;
  recalculate_on_prepayment: boolean;
}

export interface DisbursementFee {
  type: FeeType;
  value: number;
}

export interface FeesRules {
  processing_fee_type: FeeType;
  processing_fee_value: number;
  processing_fee_cap: number | null;
  disbursement_fee: DisbursementFee | null;
}

export interface LatePaymentPenalty {
  type: PenaltyType;
  value: number;
  frequency: PenaltyFrequency;
  grace_days: number;
}

export interface PenaltiesRules {
  late_payment: LatePaymentPenalty | null;
}

export interface GraceMoratoriumRules {
  grace_on_principal_periods: number;
  grace_on_interest_periods: number;
  moratorium_interest_free_periods: number;
}

export interface ArrearsRules {
  grace_on_arrears_ageing_days: number;
  overdue_days_for_npa: number;
}

export interface AllocationRules {
  order: AllocationItem[];
}

export interface ConstraintsRules {
  allow_multiple_loans_per_client: boolean;
  max_active_loans_per_client: number | null;
}

export interface LoanProductRules {
  terms: TermsRules;
  interest: InterestRules;
  fees: FeesRules;
  penalties: PenaltiesRules;
  grace_moratorium: GraceMoratoriumRules;
  arrears: ArrearsRules;
  allocation: AllocationRules;
  constraints: ConstraintsRules;
}

// Entity Interfaces
export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  productType: ProductType;
  currencyCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  versions?: LoanProductVersion[];
}

export interface LoanProductVersion {
  id: string;
  loanProductId: string;
  versionNumber: number;
  status: ProductVersionStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
  rules: LoanProductRules;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  loanProduct?: LoanProduct;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface LoanProductAuditLog {
  id: string;
  loanProductId: string;
  productVersionId?: string;
  action: string;
  performedBy: string;
  payloadSnapshot?: any;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  productVersion?: {
    id: string;
    versionNumber: number;
    status: ProductVersionStatus;
  };
}

// DTOs
export interface CreateLoanProductDto {
  code: string;
  name: string;
  description?: string;
  productType: ProductType;
  currencyCode?: string;
}

export interface UpdateLoanProductDto {
  name?: string;
  description?: string;
  productType?: ProductType;
  currencyCode?: string;
  isActive?: boolean;
}

export interface CreateProductVersionDto {
  versionNumber?: number;
  rules: LoanProductRules;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface UpdateProductVersionDto {
  rules?: LoanProductRules;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface QueryProductsDto {
  productType?: ProductType;
  isActive?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QueryVersionsDto {
  status?: ProductVersionStatus;
  page?: number;
  limit?: number;
}

export interface PreviewScheduleDto {
  principal: number;
  term_months: number;
  start_date: string;
}

// Response Types
export interface ProductListResponse {
  data: LoanProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VersionListResponse {
  data: LoanProductVersion[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditLogListResponse {
  data: LoanProductAuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ScheduleInstallment {
  number: number;
  due_date: string;
  principal: number;
  interest: number;
  fees: number;
  total_due: number;
  balance_after: number;
}

export interface ScheduleTotals {
  principal: number;
  interest: number;
  fees: number;
  total_payable: number;
}

export interface SchedulePreviewResponse {
  currency: string;
  productName: string;
  versionNumber: number;
  installments: ScheduleInstallment[];
  totals: ScheduleTotals;
}
