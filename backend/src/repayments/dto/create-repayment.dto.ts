import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { RepaymentChannel } from '@prisma/client';

export class CreateRepaymentDto {
  @ApiProperty({ description: 'Value date for the repayment', example: '2025-03-05', format: 'date' })
  @IsDateString()
  valueDate: string;

  @ApiProperty({ description: 'Repayment amount', example: 5000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: RepaymentChannel })
  @IsEnum(RepaymentChannel)
  channel: RepaymentChannel;

  @ApiProperty({ description: 'External reference (e.g. MPESA code, receipt)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiProperty({ description: 'Internal notes about this repayment', required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
