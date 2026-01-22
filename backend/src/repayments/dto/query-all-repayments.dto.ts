import { ApiPropertyOptional } from '@nestjs/swagger';
 import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { RepaymentChannel, RepaymentStatus } from '@prisma/client';

export class QueryAllRepaymentsDto {
  @ApiPropertyOptional({ description: 'Search by receipt number, reference, loan number, or client info' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by loanId' })
  @IsOptional()
  @IsString()
  loanId?: string;

  @ApiPropertyOptional({ description: 'Filter by clientId' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ enum: RepaymentChannel })
  @IsOptional()
  @IsEnum(RepaymentChannel)
  channel?: RepaymentChannel;

  @ApiPropertyOptional({ enum: RepaymentStatus })
  @IsOptional()
  @IsEnum(RepaymentStatus)
  status?: RepaymentStatus;

  @ApiPropertyOptional({ description: 'Start date (inclusive)', example: '2026-01-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (inclusive)', example: '2026-01-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page for pagination', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  limit?: number;
}
