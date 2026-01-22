import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoansModule } from '../loans/loans.module';
import { RepaymentsService } from './repayments.service';
import { RepaymentsController } from './repayments.controller';
import { RepaymentsGlobalController } from './repayments-global.controller';

@Module({
  imports: [PrismaModule, LoansModule],
  providers: [RepaymentsService],
  controllers: [RepaymentsController, RepaymentsGlobalController],
  exports: [RepaymentsService],
})
export class RepaymentsModule {}
