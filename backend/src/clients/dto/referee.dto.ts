import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateRefereeDto {
  @ApiProperty({ example: 'Peter Mwangi' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({ example: 'Colleague' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  relation?: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: '98765432' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  idNumber?: string;

  @ApiPropertyOptional({ example: 'XYZ Corporation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  employerName?: string;

  @ApiPropertyOptional({ example: '321 Office Park, Nairobi' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateRefereeDto extends PartialType(CreateRefereeDto) {}
