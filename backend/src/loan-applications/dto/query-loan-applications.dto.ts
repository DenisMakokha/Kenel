import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { LoanApplicationStatus } from '@prisma/client';

export class QueryLoanApplicationsDto {
  @ApiPropertyOptional({ enum: LoanApplicationStatus })
  @IsOptional()
  @IsEnum(LoanApplicationStatus)
  status?: LoanApplicationStatus;

  @ApiPropertyOptional({ description: 'Filter by client ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filter by product version ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productVersionId?: string;

  @ApiPropertyOptional({ description: 'Filter by credit officer (createdBy)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  officerId?: string;

  @ApiPropertyOptional({ description: 'Search by application number, client name, or client code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
