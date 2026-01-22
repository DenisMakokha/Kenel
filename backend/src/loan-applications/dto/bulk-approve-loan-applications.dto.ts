import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class BulkApproveLoanApplicationsDto {
  @ApiProperty({ type: [String], description: 'Loan application IDs to approve' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];

  @ApiProperty({ example: 10000, description: 'Approved principal amount (applies to all selected applications)' })
  @IsNumber()
  @IsPositive()
  approvedPrincipal: number;

  @ApiProperty({ example: 6, description: 'Approved term in months (applies to all selected applications)' })
  @IsNumber()
  @Min(1)
  approvedTermMonths: number;

  @ApiProperty({ example: 18.0, description: 'Approved interest rate (percent per year; applies to all selected applications)' })
  @IsNumber()
  @IsPositive()
  approvedInterestRate: number;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  decisionNotes?: string;
}
