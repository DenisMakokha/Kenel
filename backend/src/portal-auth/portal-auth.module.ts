import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PortalAuthController } from './portal-auth.controller';
import { PortalAuthService } from './portal-auth.service';
import { PortalJwtStrategy } from './portal-jwt.strategy';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ConfigModule, JwtModule.register({}), EmailModule],
  controllers: [PortalAuthController],
  providers: [PortalAuthService, PortalJwtStrategy, PrismaService],
  exports: [PortalAuthService],
})
export class PortalAuthModule {}
