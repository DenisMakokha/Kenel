import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LoanApplicationChecklistStatus } from '@prisma/client';

export class UpdateChecklistItemDto {
  @ApiPropertyOptional({ enum: LoanApplicationChecklistStatus })
  @IsOptional()
  @IsEnum(LoanApplicationChecklistStatus)
  status?: LoanApplicationChecklistStatus;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
