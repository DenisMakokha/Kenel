import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum AgingGroupBy {
  NONE = 'none',
  PRODUCT = 'product',
  BRANCH = 'branch',
}

export class QueryAgingDto {
  @ApiPropertyOptional({ description: 'As-of date for the report (YYYY-MM-DD)', example: '2025-03-31' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @ApiPropertyOptional({ enum: AgingGroupBy, default: AgingGroupBy.NONE })
  @IsOptional()
  @IsEnum(AgingGroupBy)
  groupBy?: AgingGroupBy;

  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID (future use)' })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class QueryLoansInBucketDto {
  @ApiPropertyOptional({ description: 'As-of date for the report (YYYY-MM-DD)', example: '2025-03-31' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @ApiPropertyOptional({ description: 'DPD bucket label', example: '31-60' })
  @IsString()
  bucket!: string;

  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID (future use)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
