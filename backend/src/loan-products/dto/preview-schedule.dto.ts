import { IsNumber, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PreviewScheduleDto {
  @ApiProperty({ example: 10000, description: 'Principal amount' })
  @IsNumber()
  @Min(0)
  principal: number;

  @ApiProperty({ example: 6, description: 'Term in months' })
  @IsInt()
  @Min(1)
  term_months: number;

  @ApiProperty({ example: '2025-02-01', description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  start_date: string;
}
