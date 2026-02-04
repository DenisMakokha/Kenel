import { Module, forwardRef } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PortalModule } from '../portal/portal.module';
import { VirusScanModule } from '../virus-scan/virus-scan.module';

@Module({
  imports: [PrismaModule, forwardRef(() => PortalModule), VirusScanModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
