import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class ApproveLoanApplicationDto {
  @ApiProperty({ example: 10000, description: 'Approved principal amount' })
  @IsNumber()
  @IsPositive()
  approvedPrincipal: number;

  @ApiProperty({ example: 6, description: 'Approved term in months' })
  @IsNumber()
  @Min(1)
  approvedTermMonths: number;

  @ApiProperty({ example: 18.0, description: 'Approved interest rate (percent per year)' })
  @IsNumber()
  @IsPositive()
  approvedInterestRate: number;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  decisionNotes?: string;
}
