import { ApiPropertyOptional } from '@nestjs/swagger';
 import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { RepaymentStatus } from '@prisma/client';

export class QueryRepaymentsDto {
  @ApiPropertyOptional({ enum: RepaymentStatus })
  @IsOptional()
  @IsEnum(RepaymentStatus)
  status?: RepaymentStatus;

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
