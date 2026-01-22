import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { CreatedChannel, RepaymentFrequency } from '@prisma/client';

export class CreateLoanApplicationDto {
  @ApiProperty({ description: 'Client ID', format: 'uuid' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'Loan product version ID to apply for', format: 'uuid' })
  @IsUUID()
  productVersionId: string;

  @ApiProperty({ example: 10000, description: 'Requested principal amount' })
  @IsNumber()
  @IsPositive()
  requestedAmount: number;

  @ApiProperty({ example: 6, description: 'Requested term in months' })
  @IsNumber()
  @Min(1)
  requestedTermMonths: number;

  @ApiProperty({ enum: RepaymentFrequency, required: false })
  @IsOptional()
  @IsEnum(RepaymentFrequency)
  requestedRepaymentFrequency?: RepaymentFrequency;

  @ApiProperty({ required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  purpose?: string;

  @ApiProperty({ enum: CreatedChannel, required: false })
  @IsOptional()
  @IsEnum(CreatedChannel)
  channel?: CreatedChannel;
}
