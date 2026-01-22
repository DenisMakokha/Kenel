export type RepaymentFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type InterestCalculationMethod = 'FLAT' | 'DECLINING_BALANCE';
export type FeeType = 'FIXED' | 'PERCENTAGE';
export type PenaltyType = 'FLAT' | 'PERCENTAGE_OF_OVERDUE';
export type PenaltyFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type AllocationItem = 'penalties' | 'fees' | 'interest' | 'principal';

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

export type InterestRatePeriod = 'PER_ANNUM' | 'PER_MONTH';

export interface InterestRules {
  calculation_method: InterestCalculationMethod;
  rate_per_year: number;
  min_rate_per_year: number;
  max_rate_per_year: number;
  rate_period: InterestRatePeriod; // Whether rates are entered as per annum or per month
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
