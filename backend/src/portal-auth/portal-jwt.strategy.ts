import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { PortalJwtPayload } from './portal-auth.service';

@Injectable()
export class PortalJwtStrategy extends PassportStrategy(Strategy, 'portal-jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('PORTAL_JWT_SECRET') || configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: PortalJwtPayload) {
    const user = await this.prisma.clientPortalUser.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Portal user not found or inactive');
    }

    return {
      sub: payload.sub,
      clientId: payload.clientId,
      email: payload.email,
    };
  }
}
