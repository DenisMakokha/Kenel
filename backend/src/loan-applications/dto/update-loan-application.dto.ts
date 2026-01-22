import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import { RepaymentFrequency } from '@prisma/client';

export class UpdateLoanApplicationDto {
  @ApiPropertyOptional({ example: 12000, description: 'Requested principal amount' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  requestedAmount?: number;

  @ApiPropertyOptional({ example: 12, description: 'Requested term in months' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  requestedTermMonths?: number;

  @ApiPropertyOptional({ enum: RepaymentFrequency })
  @IsOptional()
  @IsEnum(RepaymentFrequency)
  requestedRepaymentFrequency?: RepaymentFrequency;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  purpose?: string;
}
