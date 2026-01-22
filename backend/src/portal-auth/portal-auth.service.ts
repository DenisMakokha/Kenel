import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
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
          dateOfBirth: new Date('1990-01-01'), // Default, can be updated later
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
}
