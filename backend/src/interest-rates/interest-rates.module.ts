import { Module } from '@nestjs/common';
import { InterestRatesController } from './interest-rates.controller';
import { InterestRatesService } from './interest-rates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InterestRatesController],
  providers: [InterestRatesService],
  exports: [InterestRatesService],
})
export class InterestRatesModule {}
