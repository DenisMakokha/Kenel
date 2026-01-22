import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ description: 'Entity name, e.g. repayments', example: 'repayments' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ description: 'Entity ID (UUID)' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Loan ID to fetch related audit logs (e.g. repayment logs for a loan)' })
  @IsOptional()
  @IsString()
  loanId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
