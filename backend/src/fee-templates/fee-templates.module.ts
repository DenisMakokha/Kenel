import { Module } from '@nestjs/common';
import { FeeTemplatesController } from './fee-templates.controller';
import { FeeTemplatesService } from './fee-templates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeeTemplatesController],
  providers: [FeeTemplatesService],
  exports: [FeeTemplatesService],
})
export class FeeTemplatesModule {}
