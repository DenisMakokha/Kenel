import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private getTransporter(config?: SmtpConfig) {
    const smtpConfig = config || {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      username: process.env.SMTP_USERNAME || '',
      password: process.env.SMTP_PASSWORD || '',
      fromEmail: process.env.SMTP_FROM_EMAIL || '',
      fromName: process.env.SMTP_FROM_NAME || 'Kenels LMS',
    };

    if (!smtpConfig.host || !smtpConfig.port) {
      return null;
    }

    const isLocalhost = smtpConfig.host === 'localhost' || smtpConfig.host === '127.0.0.1';

    return nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      ignoreTLS: isLocalhost,
      tls: isLocalhost ? { rejectUnauthorized: false } : undefined,
      auth: smtpConfig.username
        ? {
            user: smtpConfig.username,
            pass: smtpConfig.password,
          }
        : undefined,
    });
  }

  private getFromAddress(config?: SmtpConfig): string {
    const fromEmail = config?.fromEmail || process.env.SMTP_FROM_EMAIL || '';
    const fromName = config?.fromName || process.env.SMTP_FROM_NAME || 'Kenels LMS';
    return `"${fromName}" <${fromEmail}>`;
  }

  async sendEmail(options: EmailOptions, config?: SmtpConfig): Promise<{ success: boolean; message: string }> {
    const transporter = this.getTransporter(config);

    if (!transporter) {
      return {
        success: false,
        message: 'SMTP not configured. Please configure SMTP settings.',
      };
    }

    try {
      const info = await transporter.sendMail({
        from: this.getFromAddress(config),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
      return {
        success: true,
        message: `Email sent successfully. Message ID: ${info.messageId}`,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return {
        success: false,
        message: `Failed to send email: ${error.message}`,
      };
    }
  }

  async testConnection(config: SmtpConfig, testEmail: string): Promise<{ success: boolean; message: string }> {
    const transporter = this.getTransporter(config);

    if (!transporter) {
      return {
        success: false,
        message: 'Invalid SMTP configuration',
      };
    }

    try {
      await transporter.verify();

      const result = await this.sendEmail(
        {
          to: testEmail,
          subject: 'Kenels LMS - SMTP Test',
          text: 'This is a test email from Kenels LMS. If you received this, your SMTP configuration is working correctly.',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Kenels LMS - SMTP Test</h2>
              <p>This is a test email from Kenels LMS.</p>
              <p>If you received this, your SMTP configuration is working correctly.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">
                This email was sent automatically by Kenels LMS.
              </p>
            </div>
          `,
        },
        config,
      );

      return result;
    } catch (error: any) {
      this.logger.error(`SMTP connection test failed: ${error.message}`);
      return {
        success: false,
        message: `SMTP connection failed: ${error.message}`,
      };
    }
  }

  async sendLoanApprovalEmail(
    clientEmail: string,
    clientName: string,
    applicationNumber: string,
    approvedAmount: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to: clientEmail,
      subject: `Loan Application ${applicationNumber} Approved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Congratulations, ${clientName}!</h2>
          <p>Your loan application <strong>${applicationNumber}</strong> has been approved.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;">
              <strong>Approved Amount:</strong> KES ${approvedAmount.toLocaleString()}
            </p>
          </div>
          <p>Please log in to your portal to view the details and complete the disbursement process.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent by Kenels Bureau LMS. Do not reply to this email.
          </p>
        </div>
      `,
    });
  }

  async sendLoanRejectionEmail(
    clientEmail: string,
    clientName: string,
    applicationNumber: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to: clientEmail,
      subject: `Loan Application ${applicationNumber} Status Update`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Dear ${clientName},</h2>
          <p>We regret to inform you that your loan application <strong>${applicationNumber}</strong> was not approved at this time.</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
          </div>
          <p>You may submit a new application or contact us for more information.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent by Kenels Bureau LMS. Do not reply to this email.
          </p>
        </div>
      `,
    });
  }

  async sendPaymentReminderEmail(
    clientEmail: string,
    clientName: string,
    loanNumber: string,
    dueDate: string,
    amountDue: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to: clientEmail,
      subject: `Payment Reminder - Loan ${loanNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Payment Reminder</h2>
          <p>Dear ${clientName},</p>
          <p>This is a friendly reminder that your payment for loan <strong>${loanNumber}</strong> is due.</p>
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Due Date:</strong> ${dueDate}</p>
            <p style="margin: 0; font-size: 18px;"><strong>Amount Due:</strong> KES ${amountDue.toLocaleString()}</p>
          </div>
          <p>Please ensure timely payment to avoid penalties.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent by Kenels Bureau LMS. Do not reply to this email.
          </p>
        </div>
      `,
    });
  }

  async sendLoanDisbursementEmail(
    clientEmail: string,
    clientName: string,
    loanNumber: string,
    amount: number,
    disbursedBy: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to: clientEmail,
      subject: `Loan ${loanNumber} Disbursed - KES ${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Loan Disbursed Successfully!</h2>
          <p>Dear ${clientName},</p>
          <p>Great news! Your loan has been disbursed to your account.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Loan Number:</strong> ${loanNumber}</p>
            <p style="margin: 0 0 10px 0; font-size: 18px;"><strong>Amount Disbursed:</strong> KES ${amount.toLocaleString()}</p>
            <p style="margin: 0;"><strong>Disbursed By:</strong> ${disbursedBy}</p>
          </div>
          <p>Please log in to your portal to view the loan details and repayment schedule.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent by Kenels Bureau LMS. Do not reply to this email.
          </p>
        </div>
      `,
    });
  }

  async sendPaymentConfirmationEmail(
    clientEmail: string,
    clientName: string,
    loanNumber: string,
    amountPaid: number,
    receiptNumber: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to: clientEmail,
      subject: `Payment Received - Receipt ${receiptNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Payment Received</h2>
          <p>Dear ${clientName},</p>
          <p>We have received your payment for loan <strong>${loanNumber}</strong>.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Receipt Number:</strong> ${receiptNumber}</p>
            <p style="margin: 0; font-size: 18px;"><strong>Amount Paid:</strong> KES ${amountPaid.toLocaleString()}</p>
          </div>
          <p>Thank you for your payment.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent by Kenels Bureau LMS. Do not reply to this email.
          </p>
        </div>
      `,
    });
  }
}
