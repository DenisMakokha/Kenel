import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { PortalAuthService } from './portal-auth.service';
import { Public } from '../auth/decorators/public.decorator';

class PortalLoginDto {
  @ApiProperty({ example: 'portal.client@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '<PASSWORD>' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

class PortalRegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  idNumber!: string;

  @ApiProperty({ example: '1995-06-15' })
  @IsString()
  @IsNotEmpty()
  dateOfBirth!: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}

@ApiTags('Portal Auth')
@Controller('portal/auth')
export class PortalAuthController {
  constructor(private readonly portalAuthService: PortalAuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Portal login for clients' })
  @ApiResponse({ status: 200, description: 'Logged in successfully' })
  async login(
    @Body() body: PortalLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipHeader = (req.headers['x-forwarded-for'] as string | undefined) || undefined;
    const ip = (ipHeader ? ipHeader.split(',')[0].trim() : req.ip) || null;
    const userAgent = (req.headers['user-agent'] as string | undefined) || null;

    const result = await this.portalAuthService.login(body.email, body.password, ip, userAgent);

    const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined) || '';
    const isHttps = req.secure || forwardedProto.split(',')[0].trim().toLowerCase() === 'https';

    res.cookie('portalRefreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh portal access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req.cookies as any)?.portalRefreshToken;
    const result = await this.portalAuthService.refresh(refreshToken || '');

    const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined) || '';
    const isHttps = req.secure || forwardedProto.split(',')[0].trim().toLowerCase() === 'https';

    res.cookie('portalRefreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Portal logout' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('portalRefreshToken');
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new client account via portal' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate account' })
  async register(@Body() body: PortalRegisterDto) {
    return this.portalAuthService.register(body);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change portal user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async changePassword(
    @Req() req: Request,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const portalUser = (req as any).portalUser;
    if (!portalUser?.sub) {
      throw new Error('Unauthorized');
    }
    return this.portalAuthService.changePassword(portalUser.sub, body.currentPassword, body.newPassword);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP via email' })
  @ApiResponse({ status: 200, description: 'OTP sent if account exists' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.portalAuthService.forgotPassword(body.email);
  }

  @Public()
  @Post('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified' })
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.portalAuthService.verifyResetOtp(body.email, body.otp);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.portalAuthService.resetPassword(body.email, body.otp, body.newPassword);
  }
}
