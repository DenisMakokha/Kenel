import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductType } from './create-loan-product.dto';

export class QueryProductsDto {
  @ApiProperty({ required: false, description: 'Filter by product type' })
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @ApiProperty({ required: false, description: 'Filter by active status' })
  @IsOptional()
  @Type(() => String)
  isActive?: string;

  @ApiProperty({ required: false, description: 'Search by name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
