import { Module } from '@nestjs/common';
import { LoanProductsController } from './loan-products.controller';
import { LoanProductsService } from './loan-products.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoanProductsController],
  providers: [LoanProductsService],
  exports: [LoanProductsService],
})
export class LoanProductsModule {}
