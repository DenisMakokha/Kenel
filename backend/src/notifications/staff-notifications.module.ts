import { Module } from '@nestjs/common';
import { StaffNotificationsService } from './staff-notifications.service';
import { StaffNotificationsController } from './staff-notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffNotificationsController],
  providers: [StaffNotificationsService],
  exports: [StaffNotificationsService],
})
export class StaffNotificationsModule {}
