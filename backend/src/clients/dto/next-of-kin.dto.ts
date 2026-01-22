import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateNextOfKinDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: 'Spouse' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  relation: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'jane.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '789 Home Street, Nairobi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateNextOfKinDto extends PartialType(CreateNextOfKinDto) {}
