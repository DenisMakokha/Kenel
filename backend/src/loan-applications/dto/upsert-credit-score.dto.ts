import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpsertCreditScoreDto {
  @ApiProperty({ minimum: 1, maximum: 5, description: 'Repayment history score (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  repaymentHistoryScore: number;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'Employment / stability score (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  stabilityScore: number;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'Income adequacy score (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  incomeScore: number;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'Indebtedness / obligations score (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  obligationScore: number;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  officerComments?: string;

  @ApiProperty({
    required: false,
    description: 'Overall recommendation, e.g. APPROVE | REJECT | CONDITIONAL',
    enum: ['APPROVE', 'REJECT', 'CONDITIONAL'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['APPROVE', 'REJECT', 'CONDITIONAL'])
  recommendation?: string;
}
