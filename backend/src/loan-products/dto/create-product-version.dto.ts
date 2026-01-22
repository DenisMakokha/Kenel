import { IsObject, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LoanProductRules } from '../interfaces/loan-product-rules.interface';

export class CreateProductVersionDto {
  @ApiProperty({ required: false, description: 'Version number (auto-generated if not provided)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  versionNumber?: number;

  @ApiProperty({
    description: 'Complete product rules as JSON',
    example: {
      terms: {
        min_principal: 2000,
        max_principal: 50000,
        default_principal: 10000,
        min_term_months: 1,
        max_term_months: 12,
        default_term_months: 6,
        repayment_frequency: 'MONTHLY',
        allow_topup: false,
      },
      interest: {
        calculation_method: 'DECLINING_BALANCE',
        rate_per_year: 18.0,
        min_rate_per_year: 12.0,
        max_rate_per_year: 24.0,
        interest_free_periods: 0,
        recalculate_on_prepayment: true,
      },
      fees: {
        processing_fee_type: 'PERCENTAGE',
        processing_fee_value: 2.0,
        processing_fee_cap: 2000,
        disbursement_fee: null,
      },
      penalties: {
        late_payment: {
          type: 'PERCENTAGE_OF_OVERDUE',
          value: 1.5,
          frequency: 'MONTHLY',
          grace_days: 5,
        },
      },
      grace_moratorium: {
        grace_on_principal_periods: 0,
        grace_on_interest_periods: 0,
        moratorium_interest_free_periods: 0,
      },
      arrears: {
        grace_on_arrears_ageing_days: 0,
        overdue_days_for_npa: 90,
      },
      allocation: {
        order: ['penalties', 'fees', 'interest', 'principal'],
      },
      constraints: {
        allow_multiple_loans_per_client: true,
        max_active_loans_per_client: 3,
      },
    },
  })
  @IsObject()
  @Type(() => Object)
  rules: LoanProductRules;

  @ApiProperty({ required: false, description: 'Effective from date' })
  @IsOptional()
  effectiveFrom?: Date;

  @ApiProperty({ required: false, description: 'Effective to date' })
  @IsOptional()
  effectiveTo?: Date;
}
