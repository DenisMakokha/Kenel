import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLoanProductDto } from './create-loan-product.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLoanProductDto extends PartialType(
  OmitType(CreateLoanProductDto, ['code'] as const),
) {
  @ApiProperty({ required: false, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
