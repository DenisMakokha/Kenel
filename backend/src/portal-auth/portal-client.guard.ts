import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// First ensure JWT is valid using the portal-jwt strategy, then attach clientId to request

@Injectable()
export class PortalClientGuard extends AuthGuard('portal-jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    if (!result) {
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub: string; clientId: string; email: string } | undefined;
    if (!user || !user.clientId) {
      throw new UnauthorizedException('Missing portal client context');
    }

    request.portalUser = user;
    request.portalClientId = user.clientId;
    return true;
  }
}
