import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revokedAt) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
