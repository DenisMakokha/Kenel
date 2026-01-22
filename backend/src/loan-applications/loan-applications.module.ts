import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoanProductsModule } from '../loan-products/loan-products.module';
import { LoansModule } from '../loans/loans.module';
import { LoanApplicationsService } from './loan-applications.service';
import { LoanApplicationsController } from './loan-applications.controller';

@Module({
  imports: [PrismaModule, LoanProductsModule, LoansModule],
  providers: [LoanApplicationsService],
  controllers: [LoanApplicationsController],
  exports: [LoanApplicationsService],
})
export class LoanApplicationsModule {}
