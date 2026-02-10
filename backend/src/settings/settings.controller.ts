import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService, SmtpConfig } from './settings.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('settings')
@Controller('settings')
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Public()
  @Get('org')
  @ApiOperation({ summary: 'Get public organization settings (no auth required)' })
  @ApiResponse({ status: 200, description: 'Organization settings' })
  async getOrgSettings() {
    return this.settingsService.getOrgSettings();
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'System settings' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Get('smtp/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get SMTP configuration status' })
  async getSmtpStatus() {
    return this.settingsService.getSmtpStatus();
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
  async updateEmailTemplates(@Body() templates: Record<string, boolean>) {
    return this.settingsService.updateEmailTemplates(templates);
  }

  @Put('general')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update general settings' })
  @ApiResponse({ status: 200, description: 'General settings updated' })
  async updateGeneralSettings(@Body() settings: Record<string, string>) {
    return this.settingsService.updateGeneralSettings(settings);
  }

  @Put('category/:category')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update settings by category (loans, notifications, security)' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettingsByCategory(
    @Param('category') category: string,
    @Body() settings: Record<string, string>,
  ) {
    return this.settingsService.updateSettingsByCategory(category, settings);
  }
}
