import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Req,
  Get,
  Delete,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser, JwtPayload } from './decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const req = response.req as any;
    const ipHeader = (req?.headers?.['x-forwarded-for'] as string | undefined) || undefined;
    const ip = (ipHeader ? ipHeader.split(',')[0].trim() : req?.ip) || null;
    const userAgent = (req?.headers?.['user-agent'] as string | undefined) || null;

    const result = await this.authService.register(registerDto, { ipAddress: ip, userAgent });

    const forwardedProto = (response.req?.headers?.['x-forwarded-proto'] as string | undefined) || '';
    const isHttps =
      (response.req as any)?.secure || forwardedProto.split(',')[0].trim().toLowerCase() === 'https';

    // Set refresh token in httpOnly cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const ipHeader = (request.headers['x-forwarded-for'] as string | undefined) || undefined;
    const ip = (ipHeader ? ipHeader.split(',')[0].trim() : request.ip) || null;
    const userAgent = (request.headers['user-agent'] as string | undefined) || null;

    const result = await this.authService.login(loginDto.email, loginDto.password, { ipAddress: ip, userAgent });

    await this.prisma.auditLog.create({
      data: {
        entity: 'users',
        entityId: result.user.id,
        action: AuditAction.UPDATE,
        performedBy: result.user.id,
        oldValue: undefined,
        newValue: {
          eventType: 'login_success',
        } as any,
        ipAddress: ip,
        userAgent,
      },
    });

    const forwardedProto = (request.headers['x-forwarded-proto'] as string | undefined) || '';
    const isHttps = request.secure || forwardedProto.split(',')[0].trim().toLowerCase() === 'https';

    // Set refresh token in httpOnly cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens successfully refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const user = request.user as JwtPayload & { refreshToken: string };
    const ipHeader = (request.headers['x-forwarded-for'] as string | undefined) || undefined;
    const ip = (ipHeader ? ipHeader.split(',')[0].trim() : request.ip) || null;
    const userAgent = (request.headers['user-agent'] as string | undefined) || null;

    const result = await this.authService.refreshTokens(user.sub, user.refreshToken, { ipAddress: ip, userAgent });

    const forwardedProto = (request.headers['x-forwarded-proto'] as string | undefined) || '';
    const isHttps = request.secure || forwardedProto.split(',')[0].trim().toLowerCase() === 'https';

    // Set new refresh token in httpOnly cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = request.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(user.sub, refreshToken);
    }

    // Clear refresh token cookie
    response.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user information' })
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateCurrentUser(
    @CurrentUser() user: JwtPayload,
    @Body() body: { firstName?: string; lastName?: string; phone?: string },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: user.sub },
      data: {
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.phone && { phone: body.phone }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
    return updated;
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active sessions for current user' })
  @ApiResponse({ status: 200, description: 'List of active sessions' })
  async getSessions(@CurrentUser() user: JwtPayload, @Req() request: Request) {
    const currentRefreshToken = (request as any).cookies?.refreshToken as string | undefined;
    const currentTokenRecord = currentRefreshToken
      ? await this.prisma.refreshToken.findUnique({ where: { token: currentRefreshToken } })
      : null;

    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: user.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const sessions = activeTokens.map((tokenRow) => {
      const row: any = tokenRow as any;
      const userAgent = row.userAgent || '';
      const isCurrent = Boolean(currentTokenRecord?.id && currentTokenRecord.id === row.id);
      
      // Parse user agent for device/browser info
      let device = 'Unknown Device';
      let browser = 'Unknown Browser';
      
      if (userAgent.includes('Windows')) device = 'Windows PC';
      else if (userAgent.includes('Mac')) device = 'MacBook';
      else if (userAgent.includes('iPhone')) device = 'iPhone';
      else if (userAgent.includes('Android')) device = 'Android Phone';
      else if (userAgent.includes('Linux')) device = 'Linux PC';
      
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      return {
        id: row.id,
        device,
        browser,
        ip: row.ipAddress || 'Unknown',
        location: 'Unknown',
        lastActive: row.createdAt.toISOString(),
        isCurrent,
      };
    });

    return { sessions };
  }

  @Delete('sessions/:sessionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async revokeSession(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Req() request: Request,
  ) {
    const currentRefreshToken = (request as any).cookies?.refreshToken as string | undefined;
    const currentTokenRecord = currentRefreshToken
      ? await this.prisma.refreshToken.findUnique({ where: { token: currentRefreshToken } })
      : null;

    if (currentTokenRecord?.id === sessionId) {
      throw new BadRequestException('You cannot revoke the current session.');
    }

    const token = await this.prisma.refreshToken.findFirst({
      where: {
        id: sessionId,
        userId: user.sub,
        revokedAt: null,
      },
    });

    if (!token) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        entity: 'users',
        entityId: user.sub,
        action: AuditAction.UPDATE,
        performedBy: user.sub,
        newValue: {
          eventType: 'session_revoked',
          sessionId,
        } as any,
      },
    });

    return { message: 'Session revoked successfully' };
  }

  @Delete('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all other sessions' })
  @ApiResponse({ status: 200, description: 'All other sessions revoked' })
  async revokeAllSessions(@CurrentUser() user: JwtPayload, @Req() request: Request) {
    const currentRefreshToken = (request as any).cookies?.refreshToken as string | undefined;
    if (!currentRefreshToken) {
      throw new BadRequestException('Current session token not found');
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        userId: user.sub,
        revokedAt: null,
        token: { not: currentRefreshToken },
      },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        entity: 'users',
        entityId: user.sub,
        action: AuditAction.UPDATE,
        performedBy: user.sub,
        newValue: {
          eventType: 'all_sessions_revoked',
        } as any,
      },
    });

    return { message: 'All other sessions revoked successfully' };
  }

  @Get('activity')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent activity for current user' })
  @ApiResponse({ status: 200, description: 'List of recent activities' })
  async getActivity(@CurrentUser() user: JwtPayload) {
    const activities = await this.prisma.auditLog.findMany({
      where: {
        performedBy: user.sub,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const formattedActivities = activities.map((activity) => {
      let action = 'Unknown action';
      const newValue = activity.newValue as any;
      
      if (newValue?.eventType === 'login_success') action = 'Login successful';
      else if (newValue?.eventType === 'session_revoked') action = 'Session revoked';
      else if (newValue?.eventType === 'all_sessions_revoked') action = 'All sessions revoked';
      else if (activity.action === 'CREATE') action = `Created ${activity.entity}`;
      else if (activity.action === 'UPDATE') action = `Updated ${activity.entity}`;
      else if (activity.action === 'DELETE') action = `Deleted ${activity.entity}`;

      return {
        id: activity.id,
        action,
        ip: activity.ipAddress || 'Unknown',
        timestamp: activity.createdAt.toISOString(),
      };
    });

    return { activities: formattedActivities };
  }

  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(user.sub, body.currentPassword, body.newPassword);
    
    await this.prisma.auditLog.create({
      data: {
        entity: 'users',
        entityId: user.sub,
        action: AuditAction.UPDATE,
        performedBy: user.sub,
        newValue: {
          eventType: 'password_changed',
        } as any,
      },
    });

    return { message: 'Password changed successfully' };
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset link via email' })
  @ApiResponse({ status: 200, description: 'Reset link sent if account exists' })
  async forgotPassword(@Body() body: { email: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });

    if (user) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.passwordResetToken.updateMany({
        where: { email: body.email, usedAt: null },
        data: { usedAt: new Date() },
      });

      await this.prisma.passwordResetToken.create({
        data: { email: body.email, token: otp, expiresAt },
      });

      await this.emailService.sendEmail({
        to: body.email,
        subject: 'Password Reset Code - Kenels Bureau',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Password Reset</h2>
            <p>You requested a password reset for your Kenels Bureau staff account.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Your verification code:</p>
              <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #059669;">${otp}</p>
            </div>
            <p>This code expires in <strong>15 minutes</strong>.</p>
            <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    }

    return { message: 'If an account exists with this email, a verification code has been sent.' };
  }

  @Public()
  @Post('verify-reset-otp')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified' })
  async verifyResetOtp(@Body() body: { email: string; otp: string }) {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: { email: body.email, token: body.otp, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!token) {
      throw new BadRequestException('Invalid or expired verification code');
    }
    return { valid: true, message: 'Code verified successfully' };
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: { email: body.email, token: body.otp, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!token) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      throw new BadRequestException('Account not found');
    }

    const hashedPassword = await argon2.hash(body.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }
}
