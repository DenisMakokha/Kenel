import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectLoanApplicationDto {
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
