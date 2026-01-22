import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async getNotifications(@CurrentUser() user: JwtPayload) {
    const notifications = await this.notificationsService.getNotifications(user.sub);
    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
      notifications,
      unreadCount,
    };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.markAsRead(user.sub, notificationId);
    return { message: 'Notification marked as read' };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    await this.notificationsService.markAllAsRead(user.sub);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(
    @CurrentUser() user: JwtPayload,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.deleteNotification(user.sub, notificationId);
    return { message: 'Notification deleted' };
  }
}
