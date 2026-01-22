import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InterestRatePeriod, InterestRateType } from '@prisma/client';

export class CreateInterestRateDto {
  @ApiProperty({ example: 'Standard Personal Loan' })
  @IsString()
  name: string;

  @ApiProperty({ enum: InterestRateType })
  @IsEnum(InterestRateType)
  type: InterestRateType;

  @ApiProperty({ example: 14.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @ApiProperty({ enum: InterestRatePeriod, example: 'PER_ANNUM' })
  @IsEnum(InterestRatePeriod)
  ratePeriod: InterestRatePeriod;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(1)
  minTerm: number;

  @ApiProperty({ example: 36 })
  @IsNumber()
  @Min(1)
  maxTerm: number;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  minAmount: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  maxAmount: number;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class UpdateInterestRateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: InterestRateType })
  @IsOptional()
  @IsEnum(InterestRateType)
  type?: InterestRateType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate?: number;

  @ApiPropertyOptional({ enum: InterestRatePeriod })
  @IsOptional()
  @IsEnum(InterestRatePeriod)
  ratePeriod?: InterestRatePeriod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  minTerm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTerm?: number;

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
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class QueryInterestRatesDto {
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

  @ApiPropertyOptional({ enum: InterestRateType })
  @IsOptional()
  @IsEnum(InterestRateType)
  type?: InterestRateType;
}
