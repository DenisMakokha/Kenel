import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FeeCategory, FeeCalculationType } from '@prisma/client';

export class CreateFeeTemplateDto {
  @ApiProperty({ example: 'Standard Processing Fee' })
  @IsString()
  name: string;

  @ApiProperty({ enum: FeeCategory })
  @IsEnum(FeeCategory)
  category: FeeCategory;

  @ApiProperty({ enum: FeeCalculationType })
  @IsEnum(FeeCalculationType)
  calculationType: FeeCalculationType;

  @ApiProperty({ example: 500, description: 'Fixed amount or percentage value' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ example: 100, description: 'Minimum fee amount (for percentage type)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Maximum fee amount (for percentage type)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ example: 'One-time processing fee charged at disbursement' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFeeTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: FeeCategory })
  @IsOptional()
  @IsEnum(FeeCategory)
  category?: FeeCategory;

  @ApiPropertyOptional({ enum: FeeCalculationType })
  @IsOptional()
  @IsEnum(FeeCalculationType)
  calculationType?: FeeCalculationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class QueryFeeTemplatesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiPropertyOptional({ enum: FeeCategory })
  @IsOptional()
  @IsEnum(FeeCategory)
  category?: FeeCategory;
}
