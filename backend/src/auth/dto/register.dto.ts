import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password (min 8 characters, must contain uppercase, lowercase, number)',
  })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and number/special character',
  })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: '+254712345678',
    description: 'User phone number',
    required: false,
  })
  @IsString()
  phone?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.CLIENT,
    description: 'User role',
    default: UserRole.CLIENT,
  })
  @IsEnum(UserRole)
  role?: UserRole;
}
