import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { QueryPortfolioSummaryDto } from './portfolio-summary.dto';
import { QueryAgingDto, QueryLoansInBucketDto } from './aging.dto';

export enum ReportExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}

export class QueryPortfolioSummaryExportDto extends QueryPortfolioSummaryDto {
  @ApiPropertyOptional({ enum: ReportExportFormat, default: ReportExportFormat.CSV })
  @IsOptional()
  @IsEnum(ReportExportFormat)
  format?: ReportExportFormat;
}

export class QueryAgingExportDto extends QueryAgingDto {
  @ApiPropertyOptional({ enum: ReportExportFormat, default: ReportExportFormat.CSV })
  @IsOptional()
  @IsEnum(ReportExportFormat)
  format?: ReportExportFormat;
}

export class QueryLoansExportDto extends QueryLoansInBucketDto {
  @ApiPropertyOptional({ enum: ReportExportFormat, default: ReportExportFormat.CSV })
  @IsOptional()
  @IsEnum(ReportExportFormat)
  format?: ReportExportFormat;
}
