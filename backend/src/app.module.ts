import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './crypto/crypto.module';
import { RetentionModule } from './retention/retention.module';
import { AuthModule } from './auth/auth.module';
import { PortalAuthModule } from './portal-auth/portal-auth.module';
import { PortalModule } from './portal/portal.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { LoanProductsModule } from './loan-products/loan-products.module';
import { LoanApplicationsModule } from './loan-applications/loan-applications.module';
import { LoansModule } from './loans/loans.module';
import { RepaymentsModule } from './repayments/repayments.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DocumentsModule } from './documents/documents.module';
import { SettingsModule } from './settings/settings.module';
import { InterestRatesModule } from './interest-rates/interest-rates.module';
import { FeeTemplatesModule } from './fee-templates/fee-templates.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),

    // Database
    PrismaModule,
    CryptoModule,
    RetentionModule,

    // Feature Modules
    AuthModule,
    PortalAuthModule,
    PortalModule,
    UsersModule,
    ClientsModule,
    LoanProductsModule,
    LoanApplicationsModule,
    LoansModule,
    RepaymentsModule,
    AuditLogsModule,
    ReportsModule,
    NotificationsModule,
    DocumentsModule,
    SettingsModule,
    InterestRatesModule,
    FeeTemplatesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
