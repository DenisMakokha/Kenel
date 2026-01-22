import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum PortfolioGroupBy {
  NONE = 'none',
  PRODUCT = 'product',
  BRANCH = 'branch',
  OFFICER = 'officer',
}

export class QueryPortfolioSummaryDto {
  @ApiPropertyOptional({ description: 'As-of date for the report (YYYY-MM-DD)', example: '2025-03-31' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @ApiPropertyOptional({ enum: PortfolioGroupBy, default: PortfolioGroupBy.PRODUCT })
  @IsOptional()
  @IsEnum(PortfolioGroupBy)
  groupBy?: PortfolioGroupBy;

  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID (future use)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by officer ID (future use)' })
  @IsOptional()
  @IsString()
  officerId?: string;

  @ApiPropertyOptional({ description: 'Page for grouped results', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size for grouped results', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
