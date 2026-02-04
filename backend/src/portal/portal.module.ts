import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RepaymentsModule } from '../repayments/repayments.module';
import { PortalAuthModule } from '../portal-auth/portal-auth.module';
import { LoanApplicationsModule } from '../loan-applications/loan-applications.module';
import { DocumentsModule } from '../documents/documents.module';
import { EmailModule } from '../email/email.module';
import { StaffNotificationsModule } from '../notifications/staff-notifications.module';
import { VirusScanModule } from '../virus-scan/virus-scan.module';
import { PortalService } from './portal.service';
import { PortalController } from './portal.controller';
import { PortalClientGuard } from '../portal-auth/portal-client.guard';
import { PortalNotificationsService } from './portal-notifications.service';

@Module({
  imports: [PrismaModule, RepaymentsModule, PortalAuthModule, forwardRef(() => LoanApplicationsModule), DocumentsModule, EmailModule, StaffNotificationsModule, VirusScanModule],
  controllers: [PortalController],
  providers: [PortalService, PortalClientGuard, PortalNotificationsService],
  exports: [PortalNotificationsService],
})
export class PortalModule {}
