import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class QueryDocumentsDto {
  @ApiPropertyOptional({ description: 'Search by file name, client name/code, application number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Category filter', example: 'KYC' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Document type filter', example: 'ID_FRONT' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Status filter', enum: ['PENDING', 'VERIFIED', 'REJECTED'] })
  @IsOptional()
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED'])
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'From date (inclusive)', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date (inclusive)', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  limit?: number;
}
