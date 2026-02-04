import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoanProductsModule } from '../loan-products/loan-products.module';
import { PortalModule } from '../portal/portal.module';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { LoanStatusSyncService } from './loan-status-sync.service';

@Module({
  imports: [PrismaModule, LoanProductsModule, forwardRef(() => PortalModule)],
  providers: [LoansService, LoanStatusSyncService],
  controllers: [LoansController],
  exports: [LoansService, LoanStatusSyncService],
})
export class LoansModule {}
