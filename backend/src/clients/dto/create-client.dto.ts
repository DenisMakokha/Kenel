import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  IsDecimal,
  IsPhoneNumber,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum IdType {
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  ALIEN_CARD = 'ALIEN_CARD',
}

export enum CreatedChannel {
  BRANCH = 'BRANCH',
  AGENT = 'AGENT',
  ONLINE = 'ONLINE',
}

export class CreateClientDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ example: 'Michael' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  otherNames?: string;

  @ApiProperty({ enum: IdType, example: IdType.NATIONAL_ID })
  @IsEnum(IdType)
  idType: IdType;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  idNumber: string;

  @ApiProperty({ example: '1990-01-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({ example: 'Male' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'Single' })
  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phonePrimary: string;

  @ApiPropertyOptional({ example: '+254798765432' })
  @IsOptional()
  @IsString()
  phoneSecondary?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Nairobi' })
  @IsOptional()
  @IsString()
  residentialAddress?: string;

  @ApiPropertyOptional({ example: 'ABC Company Ltd' })
  @IsOptional()
  @IsString()
  employerName?: string;

  @ApiPropertyOptional({ example: '456 Business Ave, Nairobi' })
  @IsOptional()
  @IsString()
  employerAddress?: string;

  @ApiPropertyOptional({ example: '+254720111222' })
  @IsOptional()
  @IsString()
  employerPhone?: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ example: '50000.00' })
  @IsOptional()
  @IsDecimal()
  monthlyIncome?: string;

  @ApiPropertyOptional({ enum: CreatedChannel, example: CreatedChannel.BRANCH })
  @IsOptional()
  @IsEnum(CreatedChannel)
  createdChannel?: CreatedChannel;

  @ApiPropertyOptional({ example: 'Client prefers email communication' })
  @IsOptional()
  @IsString()
  notes?: string;
}
