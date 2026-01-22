import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class SubmitKycDto {
  @ApiPropertyOptional({ example: 'All documents uploaded and verified' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SetProfileEditsAfterKycDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  allowProfileEditsAfterKyc: boolean;
}

export class ApproveKycDto {
  @ApiPropertyOptional({ example: 'KYC documents verified successfully' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectKycDto {
  @ApiProperty({ example: 'ID document is unclear' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'Please resubmit a clearer copy of your ID' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRiskRatingDto {
  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'LOW' })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  riskRating: string;

  @ApiPropertyOptional({ example: 'Good repayment history' })
  @IsOptional()
  @IsString()
  notes?: string;
}
