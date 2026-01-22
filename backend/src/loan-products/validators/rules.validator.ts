import { BadRequestException } from '@nestjs/common';
import { LoanProductRules, AllocationItem } from '../interfaces/loan-product-rules.interface';

export interface ValidationError {
  path: string;
  message: string;
}

export class RulesValidator {
  static validate(rules: LoanProductRules): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate Terms
    if (rules.terms.min_principal <= 0) {
      errors.push({ path: 'terms.min_principal', message: 'Must be greater than 0' });
    }
    if (rules.terms.max_principal <= 0) {
      errors.push({ path: 'terms.max_principal', message: 'Must be greater than 0' });
    }
    if (rules.terms.min_principal > rules.terms.max_principal) {
      errors.push({ path: 'terms.min_principal', message: 'Must be less than or equal to max_principal' });
    }
    if (rules.terms.default_principal < rules.terms.min_principal || rules.terms.default_principal > rules.terms.max_principal) {
      errors.push({ path: 'terms.default_principal', message: 'Must be between min_principal and max_principal' });
    }

    if (rules.terms.min_term_months <= 0) {
      errors.push({ path: 'terms.min_term_months', message: 'Must be greater than 0' });
    }
    if (rules.terms.max_term_months <= 0) {
      errors.push({ path: 'terms.max_term_months', message: 'Must be greater than 0' });
    }
    if (rules.terms.min_term_months > rules.terms.max_term_months) {
      errors.push({ path: 'terms.min_term_months', message: 'Must be less than or equal to max_term_months' });
    }
    if (rules.terms.default_term_months < rules.terms.min_term_months || rules.terms.default_term_months > rules.terms.max_term_months) {
      errors.push({ path: 'terms.default_term_months', message: 'Must be between min_term_months and max_term_months' });
    }

    // Validate Interest
    if (rules.interest.min_rate_per_year < 0) {
      errors.push({ path: 'interest.min_rate_per_year', message: 'Must be greater than or equal to 0' });
    }
    if (rules.interest.max_rate_per_year < 0) {
      errors.push({ path: 'interest.max_rate_per_year', message: 'Must be greater than or equal to 0' });
    }
    if (rules.interest.min_rate_per_year > rules.interest.max_rate_per_year) {
      errors.push({ path: 'interest.min_rate_per_year', message: 'Must be less than or equal to max_rate_per_year' });
    }
    if (rules.interest.rate_per_year < rules.interest.min_rate_per_year || rules.interest.rate_per_year > rules.interest.max_rate_per_year) {
      errors.push({ path: 'interest.rate_per_year', message: 'Must be between min_rate_per_year and max_rate_per_year' });
    }
    if (rules.interest.interest_free_periods < 0) {
      errors.push({ path: 'interest.interest_free_periods', message: 'Must be greater than or equal to 0' });
    }

    // Validate Fees
    if (rules.fees.processing_fee_value < 0) {
      errors.push({ path: 'fees.processing_fee_value', message: 'Must be greater than or equal to 0' });
    }
    if (rules.fees.processing_fee_cap !== null && rules.fees.processing_fee_cap < 0) {
      errors.push({ path: 'fees.processing_fee_cap', message: 'Must be greater than or equal to 0 or null' });
    }
    if (rules.fees.disbursement_fee && rules.fees.disbursement_fee.value < 0) {
      errors.push({ path: 'fees.disbursement_fee.value', message: 'Must be greater than or equal to 0' });
    }

    // Validate Penalties
    if (rules.penalties.late_payment) {
      if (rules.penalties.late_payment.value < 0) {
        errors.push({ path: 'penalties.late_payment.value', message: 'Must be greater than or equal to 0' });
      }
      if (rules.penalties.late_payment.grace_days < 0) {
        errors.push({ path: 'penalties.late_payment.grace_days', message: 'Must be greater than or equal to 0' });
      }
    }

    // Validate Grace & Moratorium
    if (rules.grace_moratorium.grace_on_principal_periods < 0) {
      errors.push({ path: 'grace_moratorium.grace_on_principal_periods', message: 'Must be greater than or equal to 0' });
    }
    if (rules.grace_moratorium.grace_on_interest_periods < 0) {
      errors.push({ path: 'grace_moratorium.grace_on_interest_periods', message: 'Must be greater than or equal to 0' });
    }
    if (rules.grace_moratorium.moratorium_interest_free_periods < 0) {
      errors.push({ path: 'grace_moratorium.moratorium_interest_free_periods', message: 'Must be greater than or equal to 0' });
    }

    // Validate Arrears
    if (rules.arrears.grace_on_arrears_ageing_days < 0) {
      errors.push({ path: 'arrears.grace_on_arrears_ageing_days', message: 'Must be greater than or equal to 0' });
    }
    if (rules.arrears.overdue_days_for_npa < 0) {
      errors.push({ path: 'arrears.overdue_days_for_npa', message: 'Must be greater than or equal to 0' });
    }
    if (rules.arrears.overdue_days_for_npa < rules.arrears.grace_on_arrears_ageing_days) {
      errors.push({ path: 'arrears.overdue_days_for_npa', message: 'Must be greater than or equal to grace_on_arrears_ageing_days' });
    }

    // Validate Allocation
    const requiredAllocationItems: AllocationItem[] = ['penalties', 'fees', 'interest', 'principal'];
    const allocationOrder = rules.allocation.order;
    
    if (allocationOrder.length !== 4) {
      errors.push({ path: 'allocation.order', message: 'Must contain exactly 4 items' });
    }
    
    const uniqueItems = new Set(allocationOrder);
    if (uniqueItems.size !== allocationOrder.length) {
      errors.push({ path: 'allocation.order', message: 'Must not contain duplicate items' });
    }
    
    for (const item of requiredAllocationItems) {
      if (!allocationOrder.includes(item)) {
        errors.push({ path: 'allocation.order', message: `Must include '${item}'` });
      }
    }

    // Validate Constraints
    if (rules.constraints.max_active_loans_per_client !== null && rules.constraints.max_active_loans_per_client < 1) {
      errors.push({ path: 'constraints.max_active_loans_per_client', message: 'Must be greater than 0 or null' });
    }

    return errors;
  }

  static validateAndThrow(rules: LoanProductRules): void {
    const errors = this.validate(rules);
    if (errors.length > 0) {
      throw new BadRequestException({
        status: 'error',
        message: 'Validation failed',
        errors,
      });
    }
  }
}
