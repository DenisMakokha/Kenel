import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoanProductsModule } from '../loan-products/loan-products.module';
import { LoansModule } from '../loans/loans.module';
import { PortalModule } from '../portal/portal.module';
import { VirusScanModule } from '../virus-scan/virus-scan.module';
import { LoanApplicationsService } from './loan-applications.service';
import { LoanApplicationsController } from './loan-applications.controller';

@Module({
  imports: [PrismaModule, LoanProductsModule, LoansModule, forwardRef(() => PortalModule), VirusScanModule],
  providers: [LoanApplicationsService],
  controllers: [LoanApplicationsController],
  exports: [LoanApplicationsService],
})
export class LoanApplicationsModule {}
