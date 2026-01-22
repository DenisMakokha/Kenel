import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ProductVersionStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  RETIRED = 'RETIRED',
}

export class QueryVersionsDto {
  @ApiProperty({ required: false, enum: ProductVersionStatus })
  @IsOptional()
  @IsEnum(ProductVersionStatus)
  status?: ProductVersionStatus;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
