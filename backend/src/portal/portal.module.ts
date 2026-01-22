import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RepaymentsModule } from '../repayments/repayments.module';
import { PortalAuthModule } from '../portal-auth/portal-auth.module';
import { LoanApplicationsModule } from '../loan-applications/loan-applications.module';
import { DocumentsModule } from '../documents/documents.module';
import { PortalService } from './portal.service';
import { PortalController } from './portal.controller';
import { PortalClientGuard } from '../portal-auth/portal-client.guard';

@Module({
  imports: [PrismaModule, RepaymentsModule, PortalAuthModule, LoanApplicationsModule, DocumentsModule],
  controllers: [PortalController],
  providers: [PortalService, PortalClientGuard],
})
export class PortalModule {}
