import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService, SmtpConfig, SystemSettings } from './settings.service';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('settings')
@Controller('settings')
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({ status: 200, description: 'System settings' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put('smtp')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update SMTP settings' })
  @ApiResponse({ status: 200, description: 'SMTP settings updated' })
  async updateSmtpSettings(@Body() config: SmtpConfig) {
    return this.settingsService.updateSmtpSettings(config);
  }

  @Post('smtp/test')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test SMTP configuration' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async testSmtpConnection(
    @Body() body: { config: SmtpConfig; testEmail: string },
  ) {
    return this.settingsService.testSmtpConnection(body.config, body.testEmail);
  }

  @Put('email-templates')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update email template settings' })
  @ApiResponse({ status: 200, description: 'Email template settings updated' })
  async updateEmailTemplates(@Body() templates: SystemSettings['emailTemplates']) {
    return this.settingsService.updateEmailTemplates(templates);
  }

  @Put('general')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update general settings' })
  @ApiResponse({ status: 200, description: 'General settings updated' })
  async updateGeneralSettings(@Body() settings: SystemSettings['general']) {
    return this.settingsService.updateGeneralSettings(settings);
  }
}
