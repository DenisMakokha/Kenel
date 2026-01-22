import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProductType {
  SALARY_ADVANCE = 'SALARY_ADVANCE',
  TERM_LOAN = 'TERM_LOAN',
  BUSINESS_LOAN = 'BUSINESS_LOAN',
  CUSTOM = 'CUSTOM',
}

export class CreateLoanProductDto {
  @ApiProperty({ example: 'SAL_ADV', description: 'Unique product code' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Salary Advance', description: 'Product name' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ required: false, description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.SALARY_ADVANCE })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiProperty({ example: 'KES', default: 'KES' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;
}
