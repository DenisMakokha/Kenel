import { Module } from '@nestjs/common';
import { VirusScanService } from './virus-scan.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VirusScanService],
  exports: [VirusScanService],
})
export class VirusScanModule {}
