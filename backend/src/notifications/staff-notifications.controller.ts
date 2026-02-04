import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StaffNotificationsService } from './staff-notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Staff Notifications')
@ApiBearerAuth()
@Controller('staff-notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffNotificationsController {
  constructor(private readonly staffNotificationsService: StaffNotificationsService) {}

  @Get()
  @Roles('ADMIN', 'CREDIT_OFFICER', 'FINANCE_OFFICER')
  @ApiOperation({ summary: 'Get staff notifications for current user' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(@Req() req: any) {
    const userId = req.user.sub;
    return this.staffNotificationsService.getNotifications(userId);
  }

  @Get('unread')
  @Roles('ADMIN', 'CREDIT_OFFICER', 'FINANCE_OFFICER')
  @ApiOperation({ summary: 'Get unread notifications for current user' })
  @ApiResponse({ status: 200, description: 'Unread notifications retrieved successfully' })
  async getUnreadNotifications(@Req() req: any) {
    const userId = req.user.sub;
    return this.staffNotificationsService.getNotifications(userId, { unreadOnly: true });
  }

  @Get('count')
  @Roles('ADMIN', 'CREDIT_OFFICER', 'FINANCE_OFFICER')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  @ApiResponse({ status: 200, description: 'Count retrieved successfully' })
  async getUnreadCount(@Req() req: any) {
    const userId = req.user.sub;
    const count = await this.staffNotificationsService.getUnreadCount(userId);
    return { count };
  }

  @Get('alerts')
  @Roles('ADMIN', 'CREDIT_OFFICER', 'FINANCE_OFFICER')
  @ApiOperation({ summary: 'Get dashboard alerts (pending KYC, applications, overdue loans)' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  async getDashboardAlerts() {
    return this.staffNotificationsService.getDashboardAlerts();
  }

  @Patch(':id/read')
  @Roles('ADMIN', 'CREDIT_OFFICER', 'FINANCE_OFFICER')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Req() req: any, @Param('id') notificationId: string) {
    const userId = req.user.sub;
    await this.staffNotificationsService.markAsRead(notificationId, userId);
    return { success: true };
  }

  @Patch('read-all')
  @Roles('ADMIN', 'CREDIT_OFFICER', 'FINANCE_OFFICER')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: any) {
    const userId = req.user.sub;
    await this.staffNotificationsService.markAllAsRead(userId);
    return { success: true };
  }
}
