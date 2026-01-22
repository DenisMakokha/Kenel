import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReverseRepaymentDto {
  @ApiProperty({ description: 'Reason for reversing the repayment', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
