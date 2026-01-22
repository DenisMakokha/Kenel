import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class BulkRejectLoanApplicationsDto {
  @ApiProperty({ type: [String], description: 'Loan application IDs to reject' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];

  @ApiProperty({ description: 'Reason for rejection', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
