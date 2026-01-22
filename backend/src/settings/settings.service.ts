import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface SystemSettings {
  smtp?: SmtpConfig;
  emailTemplates?: {
    loanApproval: boolean;
    loanRejection: boolean;
    repaymentReminder: boolean;
    repaymentConfirmation: boolean;
    welcomeEmail: boolean;
    passwordReset: boolean;
  };
  general?: {
    companyName: string;
    currency: string;
    timezone: string;
    dateFormat: string;
  };
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(): Promise<SystemSettings> {
    return {
      smtp: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        username: process.env.SMTP_USERNAME || '',
        password: '', // Never return password
        fromEmail: process.env.SMTP_FROM_EMAIL || '',
        fromName: process.env.SMTP_FROM_NAME || 'Kenels LMS',
      },
      emailTemplates: {
        loanApproval: true,
        loanRejection: true,
        repaymentReminder: true,
        repaymentConfirmation: true,
        welcomeEmail: true,
        passwordReset: true,
      },
      general: {
        companyName: process.env.COMPANY_NAME || 'Kenels Microfinance',
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        dateFormat: 'DD/MM/YYYY',
      },
    };
  }

  async updateSmtpSettings(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
    if (!config.host || !config.port) {
      return { success: false, message: 'Host and port are required' };
    }

    // Store in environment (in production, use database or secrets manager)
    process.env.SMTP_HOST = config.host;
    process.env.SMTP_PORT = config.port.toString();
    process.env.SMTP_SECURE = config.secure.toString();
    process.env.SMTP_USERNAME = config.username;
    if (config.password) {
      process.env.SMTP_PASSWORD = config.password;
    }
    process.env.SMTP_FROM_EMAIL = config.fromEmail;
    process.env.SMTP_FROM_NAME = config.fromName;

    return { success: true, message: 'SMTP settings updated successfully' };
  }

  async testSmtpConnection(config: SmtpConfig, testEmail: string): Promise<{ success: boolean; message: string }> {
    if (!config.host || !config.port || !config.fromEmail) {
      return { 
        success: false, 
        message: 'Missing required SMTP configuration (host, port, fromEmail)' 
      };
    }

    if (!testEmail || !testEmail.includes('@')) {
      return { 
        success: false, 
        message: 'Invalid test email address' 
      };
    }

    return {
      success: false,
      message: 'SMTP test email sending is not available yet.',
    };
  }

  async updateEmailTemplates(templates: SystemSettings['emailTemplates']): Promise<{ success: boolean }> {
    return { success: true };
  }

  async updateGeneralSettings(settings: SystemSettings['general']): Promise<{ success: boolean }> {
    if (settings?.companyName) {
      process.env.COMPANY_NAME = settings.companyName;
    }
    return { success: true };
  }
}
