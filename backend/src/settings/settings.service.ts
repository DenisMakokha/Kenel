import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

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
  emailTemplates?: Record<string, boolean>;
  general?: Record<string, string>;
  loans?: Record<string, string>;
  notifications?: Record<string, string>;
  security?: Record<string, string>;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {
    // Load org + SMTP settings from DB into process.env on startup
    this.loadSettingsIntoEnv().catch((err) =>
      this.logger.warn('Could not preload settings from DB: ' + err.message),
    );
  }

  private async loadSettingsIntoEnv(): Promise<void> {
    const generalMap = await this.getSettingsByCategory('general');
    if (generalMap.companyName) process.env.COMPANY_NAME = generalMap.companyName;
    if (generalMap.contactEmail) process.env.COMPANY_EMAIL = generalMap.contactEmail;
    if (generalMap.contactPhone) process.env.COMPANY_PHONE = generalMap.contactPhone;
    if (generalMap.address) process.env.COMPANY_ADDRESS = generalMap.address;
    if (generalMap.website) process.env.COMPANY_WEBSITE = generalMap.website;

    const smtpMap = await this.getSettingsByCategory('smtp');
    if (smtpMap.host) process.env.SMTP_HOST = smtpMap.host;
    if (smtpMap.port) process.env.SMTP_PORT = smtpMap.port;
    if (smtpMap.secure) process.env.SMTP_SECURE = smtpMap.secure;
    if (smtpMap.username) process.env.SMTP_USERNAME = smtpMap.username;
    if (smtpMap.password) process.env.SMTP_PASSWORD = smtpMap.password;
    if (smtpMap.fromEmail) process.env.SMTP_FROM_EMAIL = smtpMap.fromEmail;
    if (smtpMap.fromName) process.env.SMTP_FROM_NAME = smtpMap.fromName;

    this.logger.log('Settings loaded from DB into process.env');
  }

  // ── helpers ──────────────────────────────────────────

  private async getSetting(key: string): Promise<string | null> {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  private async upsertSetting(key: string, value: string, category: string): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, category },
      create: { key, value, category },
    });
  }

  private async getSettingsByCategory(category: string): Promise<Record<string, string>> {
    const rows = await this.prisma.systemSetting.findMany({ where: { category } });
    const map: Record<string, string> = {};
    for (const r of rows) {
      // Strip category prefix for cleaner keys (e.g. "smtp.host" → "host")
      const shortKey = r.key.startsWith(`${category}.`) ? r.key.slice(category.length + 1) : r.key;
      map[shortKey] = r.value;
    }
    return map;
  }

  private async upsertMany(entries: Record<string, string>, category: string): Promise<void> {
    const ops = Object.entries(entries).map(([shortKey, value]) => {
      const key = `${category}.${shortKey}`;
      return this.prisma.systemSetting.upsert({
        where: { key },
        update: { value, category },
        create: { key, value, category },
      });
    });
    await this.prisma.$transaction(ops);
  }

  // ── public API ───────────────────────────────────────

  async getSettings(): Promise<SystemSettings> {
    const [smtpMap, generalMap, loansMap, notificationsMap, securityMap, emailTemplatesMap] =
      await Promise.all([
        this.getSettingsByCategory('smtp'),
        this.getSettingsByCategory('general'),
        this.getSettingsByCategory('loans'),
        this.getSettingsByCategory('notifications'),
        this.getSettingsByCategory('security'),
        this.getSettingsByCategory('emailTemplates'),
      ]);

    return {
      smtp: {
        host: smtpMap.host || process.env.SMTP_HOST || '',
        port: parseInt(smtpMap.port || process.env.SMTP_PORT || '587'),
        secure: (smtpMap.secure ?? process.env.SMTP_SECURE) === 'true',
        username: smtpMap.username || process.env.SMTP_USERNAME || '',
        password: '', // Never return password
        fromEmail: smtpMap.fromEmail || process.env.SMTP_FROM_EMAIL || '',
        fromName: smtpMap.fromName || process.env.SMTP_FROM_NAME || 'Kenels LMS',
      },
      emailTemplates: Object.keys(emailTemplatesMap).length
        ? Object.fromEntries(Object.entries(emailTemplatesMap).map(([k, v]) => [k, v === 'true']))
        : {
            loanApproval: true,
            loanRejection: true,
            repaymentReminder: true,
            repaymentConfirmation: true,
            welcomeEmail: true,
            passwordReset: true,
          },
      general: {
        companyName: generalMap.companyName || process.env.COMPANY_NAME || 'Kenels Microfinance',
        currency: generalMap.currency || 'KES',
        timezone: generalMap.timezone || 'Africa/Nairobi',
        dateFormat: generalMap.dateFormat || 'DD/MM/YYYY',
      },
      loans: loansMap,
      notifications: notificationsMap,
      security: securityMap,
    };
  }

  async updateSmtpSettings(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
    if (!config.host || !config.port) {
      return { success: false, message: 'Host and port are required' };
    }

    const entries: Record<string, string> = {
      host: config.host,
      port: config.port.toString(),
      secure: config.secure.toString(),
      username: config.username,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
    };
    if (config.password) {
      entries.password = config.password;
    }

    await this.upsertMany(entries, 'smtp');

    // Also update process.env so the email service picks it up immediately
    process.env.SMTP_HOST = config.host;
    process.env.SMTP_PORT = config.port.toString();
    process.env.SMTP_SECURE = config.secure.toString();
    process.env.SMTP_USERNAME = config.username;
    if (config.password) process.env.SMTP_PASSWORD = config.password;
    process.env.SMTP_FROM_EMAIL = config.fromEmail;
    process.env.SMTP_FROM_NAME = config.fromName;

    this.logger.log('SMTP settings saved to database');
    return { success: true, message: 'SMTP settings updated successfully' };
  }

  async testSmtpConnection(config: SmtpConfig, testEmail: string): Promise<{ success: boolean; message: string }> {
    if (!config.host || !config.port || !config.fromEmail) {
      return { success: false, message: 'Missing required SMTP configuration (host, port, fromEmail)' };
    }
    if (!testEmail || !testEmail.includes('@')) {
      return { success: false, message: 'Invalid test email address' };
    }
    return this.emailService.testConnection(config, testEmail);
  }

  async updateEmailTemplates(templates: Record<string, boolean>): Promise<{ success: boolean; message: string }> {
    const entries: Record<string, string> = {};
    for (const [k, v] of Object.entries(templates)) {
      entries[k] = String(v);
    }
    await this.upsertMany(entries, 'emailTemplates');
    return { success: true, message: 'Email template settings saved' };
  }

  async updateGeneralSettings(settings: Record<string, string>): Promise<{ success: boolean; message: string }> {
    await this.upsertMany(settings, 'general');
    // Keep process.env in sync so PDF_CONFIG and email templates pick up changes immediately
    if (settings.companyName) process.env.COMPANY_NAME = settings.companyName;
    if (settings.contactEmail) process.env.COMPANY_EMAIL = settings.contactEmail;
    if (settings.contactPhone) process.env.COMPANY_PHONE = settings.contactPhone;
    if (settings.address) process.env.COMPANY_ADDRESS = settings.address;
    if (settings.website) process.env.COMPANY_WEBSITE = settings.website;
    return { success: true, message: 'General settings saved' };
  }

  async updateSettingsByCategory(
    category: string,
    settings: Record<string, string>,
  ): Promise<{ success: boolean; message: string }> {
    await this.upsertMany(settings, category);
    return { success: true, message: `${category} settings saved` };
  }

  async getSmtpStatus(): Promise<{ configured: boolean }> {
    const host = await this.getSetting('smtp.host');
    return { configured: !!(host || process.env.SMTP_HOST) };
  }

  /**
   * Get organization settings (public, no auth required).
   * Used across emails, PDFs, and frontend.
   */
  async getOrgSettings(): Promise<{
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    website: string;
  }> {
    const generalMap = await this.getSettingsByCategory('general');
    return {
      companyName: generalMap.companyName || process.env.COMPANY_NAME || 'Kenels Bureau Ltd',
      contactEmail: generalMap.contactEmail || process.env.COMPANY_EMAIL || 'support@kenelsbureau.co.ke',
      contactPhone: generalMap.contactPhone || process.env.COMPANY_PHONE || '+254 759 599 124',
      address: generalMap.address || process.env.COMPANY_ADDRESS || 'Eaton Place, 2nd Floor, United Nations Crescent, Nairobi-Kenya',
      website: generalMap.website || process.env.COMPANY_WEBSITE || 'https://kenels.app',
    };
  }
}
