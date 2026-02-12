import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  dateOfBirth: string;
  password: string;
}

export interface PortalJwtPayload {
  sub: string; // portal user id
  clientId: string;
  email: string;
}

@Injectable()
export class PortalAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.clientPortalUser.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Portal account is not active');
    }

    return user;
  }

  async login(email: string, password: string, ipAddress: string | null, userAgent: string | null) {
    const user = await this.validateUser(email, password);

    const tokens = await this.generateTokens(user.id, user.clientId, user.email);

    await this.prisma.clientPortalUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.clientPortalAudit.create({
      data: {
        clientPortalUserId: user.id,
        eventType: 'login_success',
        ipAddress,
        userAgent,
      },
    });

    const client = await this.prisma.client.findUnique({ where: { id: user.clientId } });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      client: client
        ? {
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            clientCode: client.clientCode,
          }
        : null,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<PortalJwtPayload>(refreshToken, {
        secret: this.configService.get('PORTAL_REFRESH_TOKEN_SECRET') || this.configService.get('REFRESH_TOKEN_SECRET'),
      });

      const user = await this.prisma.clientPortalUser.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('Portal user not found or inactive');
      }

      const tokens = await this.generateTokens(user.id, user.clientId, user.email);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, clientId: string, email: string) {
    const payload: PortalJwtPayload = { sub: userId, clientId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('PORTAL_JWT_SECRET') || this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('PORTAL_JWT_EXPIRES_IN') || '30m',
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get('PORTAL_REFRESH_TOKEN_SECRET') ||
          this.configService.get('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get('PORTAL_REFRESH_TOKEN_EXPIRES_IN') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async register(data: RegisterDto) {
    // Check if email already exists
    const existingEmail = await this.prisma.clientPortalUser.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new BadRequestException('An account with this email already exists');
    }

    // Check if ID number already exists in clients
    const existingClient = await this.prisma.client.findUnique({
      where: { idNumber: data.idNumber },
    });
    if (existingClient) {
      throw new BadRequestException('A client with this ID number already exists. Please login instead.');
    }

    // Check if email exists in users table
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new BadRequestException('An account with this email already exists');
    }

    // Generate client code
    const clientCount = await this.prisma.client.count();
    const clientCode = `KEN${String(clientCount + 1).padStart(6, '0')}`;

    // Hash password
    const passwordHash = await argon2.hash(data.password);

    // Create user, client, and portal user in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'CLIENT',
          isActive: true,
          emailVerified: false,
        },
      });

      // Create client record
      const client = await tx.client.create({
        data: {
          clientCode,
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          idType: 'NATIONAL_ID',
          idNumber: data.idNumber,
          dateOfBirth: new Date(data.dateOfBirth),
          phonePrimary: data.phone,
          email: data.email,
          createdChannel: 'ONLINE',
          kycStatus: 'UNVERIFIED',
        },
      });

      // Create portal user
      const portalUser = await tx.clientPortalUser.create({
        data: {
          clientId: client.id,
          email: data.email,
          passwordHash,
          status: 'active',
        },
      });

      return { user, client, portalUser };
    });

    return {
      message: 'Account created successfully',
      clientCode: result.client.clientCode,
    };
  }

  async changePassword(portalUserId: string, currentPassword: string, newPassword: string) {
    const portalUser = await this.prisma.clientPortalUser.findUnique({
      where: { id: portalUserId },
    });

    if (!portalUser) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isPasswordValid = await argon2.verify(portalUser.passwordHash, currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await argon2.hash(newPassword);

    // Update password
    await this.prisma.clientPortalUser.update({
      where: { id: portalUserId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string) {
    // Always return success to prevent email enumeration
    const portalUser = await this.prisma.clientPortalUser.findUnique({ where: { email } });
    
    if (portalUser) {
      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Invalidate existing tokens for this email
      await this.prisma.passwordResetToken.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Store token
      await this.prisma.passwordResetToken.create({
        data: { email, token: otp, expiresAt },
      });

      // Send email
      await this.emailService.sendEmail({
        to: email,
        subject: 'Password Reset Code - Kenels Bureau',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Password Reset</h2>
            <p>You requested a password reset for your Kenels Bureau portal account.</p>
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

  async verifyResetOtp(email: string, otp: string) {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        email,
        token: otp,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    return { valid: true, message: 'Code verified successfully' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        email,
        token: otp,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const portalUser = await this.prisma.clientPortalUser.findUnique({ where: { email } });
    if (!portalUser) {
      throw new BadRequestException('Account not found');
    }

    const newPasswordHash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.clientPortalUser.update({
        where: { id: portalUser.id },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }
}
