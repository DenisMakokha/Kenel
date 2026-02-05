import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { StaffNotificationsService } from '../notifications/staff-notifications.service';

export interface CreateNotificationDto {
  clientId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'loan_application' | 'payment' | 'loan' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export interface ClientNotificationResponse {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  actionUrl: string | null;
  actionLabel: string | null;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class PortalNotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private staffNotificationsService: StaffNotificationsService,
  ) {}

  private async getClientEmailInfo(clientId: string): Promise<{ email: string; name: string; emailEnabled: boolean } | null> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { portalUser: true },
    });
    
    if (!client?.email) return null;
    
    const preferences = (client.portalUser?.preferences as any) || {};
    const emailEnabled = preferences.emailNotifications !== false;
    
    return {
      email: client.email,
      name: `${client.firstName} ${client.lastName}`,
      emailEnabled,
    };
  }

  async createNotification(data: CreateNotificationDto) {
    return this.prisma.clientNotification.create({
      data: {
        clientId: data.clientId,
        type: data.type,
        category: data.category,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        metadata: data.metadata,
        expiresAt: data.expiresAt,
      },
    });
  }

  async getNotifications(clientId: string): Promise<ClientNotificationResponse[]> {
    const notifications = await this.prisma.clientNotification.findMany({
      where: {
        clientId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      category: n.category,
      title: n.title,
      message: n.message,
      actionUrl: n.actionUrl,
      actionLabel: n.actionLabel,
      read: n.read,
      createdAt: n.createdAt,
    }));
  }

  async getUnreadCount(clientId: string): Promise<number> {
    return this.prisma.clientNotification.count({
      where: {
        clientId,
        read: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
  }

  async markAsRead(clientId: string, notificationId: string): Promise<void> {
    await this.prisma.clientNotification.updateMany({
      where: {
        id: notificationId,
        clientId,
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(clientId: string): Promise<void> {
    await this.prisma.clientNotification.updateMany({
      where: {
        clientId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async deleteNotification(clientId: string, notificationId: string): Promise<void> {
    await this.prisma.clientNotification.deleteMany({
      where: {
        id: notificationId,
        clientId,
      },
    });
  }

  // Event-based notification creators
  async notifyApplicationSubmitted(clientId: string, applicationNumber: string, productName: string) {
    return this.createNotification({
      clientId,
      type: 'success',
      category: 'loan_application',
      title: 'Application Submitted',
      message: `Your loan application ${applicationNumber} for ${productName} has been submitted successfully and is now under review.`,
      actionUrl: '/portal/loans',
      actionLabel: 'View Applications',
      metadata: { applicationNumber },
    });
  }

  async notifyApplicationApproved(clientId: string, applicationNumber: string, amount: number) {
    const notification = await this.createNotification({
      clientId,
      type: 'success',
      category: 'loan_application',
      title: 'Loan Approved!',
      message: `Great news! Your loan application ${applicationNumber} for KES ${amount.toLocaleString()} has been approved. Disbursement will be processed shortly.`,
      actionUrl: '/portal/loans',
      actionLabel: 'View Details',
      metadata: { applicationNumber, amount },
    });

    // Send email notification
    const clientInfo = await this.getClientEmailInfo(clientId);
    if (clientInfo?.emailEnabled) {
      try {
        await this.emailService.sendLoanApprovalEmail(
          clientInfo.email,
          clientInfo.name,
          applicationNumber,
          amount,
        );
        await this.prisma.clientNotification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        });
      } catch {
        // Email failure shouldn't break the notification
      }
    }

    return notification;
  }

  async notifyApplicationRejected(clientId: string, applicationNumber: string, reason?: string) {
    const notification = await this.createNotification({
      clientId,
      type: 'error',
      category: 'loan_application',
      title: 'Application Not Approved',
      message: `Unfortunately, your loan application ${applicationNumber} was not approved.${reason ? ` Reason: ${reason}` : ''} You may apply again after addressing the concerns.`,
      actionUrl: '/portal/loans',
      actionLabel: 'View Details',
      metadata: { applicationNumber, reason },
    });

    // Send email notification
    const clientInfo = await this.getClientEmailInfo(clientId);
    if (clientInfo?.emailEnabled) {
      try {
        await this.emailService.sendLoanRejectionEmail(
          clientInfo.email,
          clientInfo.name,
          applicationNumber,
          reason || 'Application did not meet our requirements',
        );
        await this.prisma.clientNotification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        });
      } catch {
        // Email failure shouldn't break the notification
      }
    }

    return notification;
  }

  async notifyApplicationReturned(
    clientId: string,
    applicationId: string,
    applicationNumber: string,
    reason: string,
    returnedItems: Array<{ type: string; documentType?: string; field?: string; message: string }>,
  ) {
    const notification = await this.createNotification({
      clientId,
      type: 'warning',
      category: 'loan_application',
      title: 'Action Required: Application Needs Correction',
      message: `Your loan application ${applicationNumber} needs corrections. ${reason}`,
      actionUrl: `/portal/applications/${applicationId}?returned=true`,
      actionLabel: 'Fix Now',
      metadata: { applicationId, applicationNumber, reason, returnedItems },
    });

    // Send email notification
    const clientInfo = await this.getClientEmailInfo(clientId);
    if (clientInfo?.emailEnabled) {
      try {
        const itemsHtml = returnedItems
          .map((item) => `<li><strong>${item.documentType || item.field || 'Item'}:</strong> ${item.message}</li>`)
          .join('');

        await this.emailService.sendEmail({
          to: clientInfo.email,
          subject: `Action Required: Loan Application ${applicationNumber} Needs Correction`,
          html: `
            <h2>Loan Application Needs Correction</h2>
            <p>Dear ${clientInfo.name},</p>
            <p>Your loan application <strong>${applicationNumber}</strong> has been reviewed and requires some corrections before it can proceed.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <h3>Items Requiring Attention:</h3>
            <ul>${itemsHtml}</ul>
            <p>Please log in to your portal and make the necessary corrections.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/portal/applications/${applicationId}?returned=true" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Fix Now</a></p>
            <p>If you have any questions, please contact our support team.</p>
          `,
        });
        await this.prisma.clientNotification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        });
      } catch {
        // Email failure shouldn't break the notification
      }
    }

    return notification;
  }

  async notifyLoanDisbursed(clientId: string, loanNumber: string, amount: number, disbursedBy: string) {
    const notification = await this.createNotification({
      clientId,
      type: 'success',
      category: 'loan',
      title: 'Loan Disbursed',
      message: `Your loan ${loanNumber} of KES ${amount.toLocaleString()} has been disbursed to your account by ${disbursedBy}.`,
      actionUrl: '/portal/loans',
      actionLabel: 'View Loan',
      metadata: { loanNumber, amount, disbursedBy },
    });

    // Send email notification
    const clientInfo = await this.getClientEmailInfo(clientId);
    if (clientInfo?.emailEnabled) {
      try {
        await this.emailService.sendLoanDisbursementEmail(
          clientInfo.email,
          clientInfo.name,
          loanNumber,
          amount,
          disbursedBy,
        );
        await this.prisma.clientNotification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        });
      } catch {
        // Email failure shouldn't break the notification
      }
    }

    return notification;
  }

  async notifyPaymentReceived(clientId: string, loanNumber: string, amount: number, remainingBalance: number) {
    return this.createNotification({
      clientId,
      type: 'success',
      category: 'payment',
      title: 'Payment Received',
      message: `Your payment of KES ${amount.toLocaleString()} for loan ${loanNumber} has been received. Remaining balance: KES ${remainingBalance.toLocaleString()}.`,
      actionUrl: '/portal/loans',
      actionLabel: 'View Loan',
      metadata: { loanNumber, amount, remainingBalance },
    });
  }

  async notifyPaymentDue(clientId: string, loanNumber: string, amount: number, dueDate: Date) {
    const formattedDate = dueDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
    return this.createNotification({
      clientId,
      type: 'warning',
      category: 'payment',
      title: 'Payment Due Soon',
      message: `Your payment of KES ${amount.toLocaleString()} for loan ${loanNumber} is due on ${formattedDate}. Please ensure timely payment to avoid penalties.`,
      actionUrl: '/portal/loans',
      actionLabel: 'Make Payment',
      metadata: { loanNumber, amount, dueDate: dueDate.toISOString() },
      expiresAt: new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000), // Expires 7 days after due date
    });
  }

  async notifyPaymentOverdue(clientId: string, loanNumber: string, amount: number, daysOverdue: number) {
    return this.createNotification({
      clientId,
      type: 'error',
      category: 'payment',
      title: 'Payment Overdue',
      message: `Your payment of KES ${amount.toLocaleString()} for loan ${loanNumber} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Please make payment immediately to avoid additional penalties.`,
      actionUrl: '/portal/loans',
      actionLabel: 'Pay Now',
      metadata: { loanNumber, amount, daysOverdue },
    });
  }

  async notifyLoanFullyPaid(clientId: string, loanNumber: string) {
    return this.createNotification({
      clientId,
      type: 'success',
      category: 'loan',
      title: 'Loan Fully Paid!',
      message: `Congratulations! Your loan ${loanNumber} has been fully paid off. Thank you for being a valued customer.`,
      actionUrl: '/portal/loans',
      actionLabel: 'View History',
      metadata: { loanNumber },
    });
  }

  async notifyWelcome(clientId: string, firstName: string) {
    return this.createNotification({
      clientId,
      type: 'info',
      category: 'system',
      title: 'Welcome to Kenels Bureau!',
      message: `Hi ${firstName}, welcome to Kenels Bureau Loan Management System. Complete your profile to get started with your first loan application.`,
      actionUrl: '/portal/profile',
      actionLabel: 'Complete Profile',
      metadata: { firstName },
    });
  }

  async notifyApplicationUnderReview(clientId: string, applicationNumber: string) {
    const notification = await this.createNotification({
      clientId,
      type: 'info',
      category: 'loan_application',
      title: 'Application Under Review',
      message: `Your loan application ${applicationNumber} is now under review by our admin team. You will be notified once a decision is made.`,
      actionUrl: '/portal/loans',
      actionLabel: 'View Application',
      metadata: { applicationNumber },
    });

    // Send email notification
    const clientInfo = await this.getClientEmailInfo(clientId);
    if (clientInfo?.emailEnabled) {
      try {
        await this.emailService.sendEmail({
          to: clientInfo.email,
          subject: `Loan Application ${applicationNumber} Under Review`,
          html: `
            <h2>Your Loan Application is Under Review</h2>
            <p>Dear ${clientInfo.name},</p>
            <p>Your loan application <strong>${applicationNumber}</strong> has been submitted to our admin team for final review and approval.</p>
            <p>You will receive a notification once a decision has been made.</p>
            <p>Thank you for choosing Kenels Bureau.</p>
          `,
        });
        await this.prisma.clientNotification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        });
      } catch {
        // Email failure shouldn't break the notification
      }
    }

    return notification;
  }

  // Notify staff users (admins) about pending reviews via email
  async notifyAdminsNewApplicationForReview(applicationNumber: string, clientName: string, amount: number) {
    // Get all admin users with emails
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true, email: true, firstName: true },
    });

    // Send email to each admin
    for (const admin of admins) {
      if (admin.email) {
        try {
          await this.emailService.sendEmail({
            to: admin.email,
            subject: `New Loan Application ${applicationNumber} Ready for Review`,
            html: `
              <h2>New Loan Application for Review</h2>
              <p>Dear ${admin.firstName || 'Admin'},</p>
              <p>A new loan application is ready for your review and approval:</p>
              <ul>
                <li><strong>Application:</strong> ${applicationNumber}</li>
                <li><strong>Client:</strong> ${clientName}</li>
                <li><strong>Amount:</strong> KES ${amount.toLocaleString()}</li>
              </ul>
              <p>Please log in to the system to review and take action.</p>
            `,
          });
        } catch {
          // Email failure shouldn't break the process
        }
      }
    }
  }

  async notifyKycApproved(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) return;

    const notification = await this.createNotification({
      clientId,
      type: 'success',
      category: 'system',
      title: 'KYC Verified!',
      message: 'Congratulations! Your KYC has been verified. You can now apply for loans.',
      actionUrl: '/portal/loans',
      actionLabel: 'Apply for Loan',
    });

    // Send email notification
    const clientInfo = await this.getClientEmailInfo(clientId);
    if (clientInfo?.emailEnabled) {
      try {
        await this.emailService.sendEmail({
          to: clientInfo.email,
          subject: 'Your KYC Has Been Verified - Kenels Bureau',
          html: `
            <h2>KYC Verification Successful</h2>
            <p>Dear ${clientInfo.name},</p>
            <p>Great news! Your KYC documents have been reviewed and verified by our team.</p>
            <p>You can now apply for loans through our portal.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/portal/loans">Apply for a Loan</a></p>
            <p>Thank you for choosing Kenels Bureau.</p>
          `,
        });
        await this.prisma.clientNotification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        });
      } catch {
        // Email failure shouldn't break the notification
      }
    }

    return notification;
  }

  async notifyKycRejected(clientId: string, reason: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) return;

    const notification = await this.createNotification({
      clientId,
      type: 'error',
      category: 'system',
      title: 'KYC Rejected',
      message: `Your KYC verification was not successful. Reason: ${reason}. Please update your documents and resubmit.`,
      actionUrl: '/portal/kyc',
      actionLabel: 'Update Documents',
      metadata: { reason },
    });

    // Send email notification
    const clientInfo = await this.getClientEmailInfo(clientId);
    if (clientInfo?.emailEnabled) {
      try {
        await this.emailService.sendEmail({
          to: clientInfo.email,
          subject: 'KYC Verification Update - Action Required',
          html: `
            <h2>KYC Verification Unsuccessful</h2>
            <p>Dear ${clientInfo.name},</p>
            <p>Unfortunately, your KYC verification was not successful.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>Please log in to your portal, update the required documents, and resubmit for verification.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/portal/kyc">Update Your Documents</a></p>
            <p>If you have any questions, please contact our support team.</p>
          `,
        });
        await this.prisma.clientNotification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        });
      } catch {
        // Email failure shouldn't break the notification
      }
    }

    return notification;
  }

  async notifyKycReturned(
    clientId: string,
    reason: string,
    returnedItems: Array<{ type: string; documentType?: string; field?: string; message: string }>,
  ) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) return;

    // Build a summary of items needing correction
    const itemsSummary = returnedItems
      .map((item) => `• ${item.message}`)
      .join('\n');

    const notification = await this.createNotification({
      clientId,
      type: 'warning',
      category: 'system',
      title: 'Action Required: KYC Needs Correction',
      message: `Your KYC verification needs corrections. ${reason}`,
      actionUrl: '/portal/kyc?returned=true',
      actionLabel: 'Fix Now',
      metadata: { reason, returnedItems },
    });

    // Send email notification
    const clientInfo = await this.getClientEmailInfo(clientId);
    if (clientInfo?.emailEnabled) {
      try {
        const itemsHtml = returnedItems
          .map((item) => `<li><strong>${item.documentType || item.field || 'Item'}:</strong> ${item.message}</li>`)
          .join('');

        await this.emailService.sendEmail({
          to: clientInfo.email,
          subject: 'Action Required: Your KYC Needs Correction',
          html: `
            <h2>KYC Verification Needs Correction</h2>
            <p>Dear ${clientInfo.name},</p>
            <p>Your KYC verification has been reviewed and requires some corrections before it can be approved.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <h3>Items Requiring Attention:</h3>
            <ul>${itemsHtml}</ul>
            <p>Please log in to your portal and make the necessary corrections.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/portal/kyc?returned=true" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Fix Now</a></p>
            <p>If you have any questions, please contact our support team.</p>
          `,
        });
        await this.prisma.clientNotification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        });
      } catch {
        // Email failure shouldn't break the notification
      }
    }

    return notification;
  }

  async notifyStaffKycSubmitted(clientId: string) {
    // Get client details
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) return;

    const clientName = `${client.firstName} ${client.lastName}`;
    const clientCode = client.clientCode || clientId.slice(0, 8);

    // Get all active credit officers and admins
    const staffToNotify = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ['CREDIT_OFFICER', 'ADMIN'] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        role: true,
      },
    });

    // Create in-app notification for client
    await this.createNotification({
      clientId,
      type: 'info',
      category: 'system',
      title: 'KYC Submitted for Review',
      message: 'Your KYC documents have been submitted for review. We will notify you once verified.',
    });

    // Create in-app notifications for all credit officers and admins
    await this.staffNotificationsService.notifyKycSubmitted(clientId, clientName, clientCode);

    // Send email notifications to credit officers and admins
    for (const staff of staffToNotify) {
      if (staff.email) {
        try {
          await this.emailService.sendEmail({
            to: staff.email,
            subject: `New KYC Submission: ${clientName} (${clientCode})`,
            html: `
              <h2>New KYC Submission for Review</h2>
              <p>Dear ${staff.firstName || staff.role},</p>
              <p>A client has submitted their KYC for verification:</p>
              <ul>
                <li><strong>Client:</strong> ${clientName}</li>
                <li><strong>Client Code:</strong> ${clientCode}</li>
                <li><strong>Phone:</strong> ${client.phonePrimary || 'N/A'}</li>
                <li><strong>Email:</strong> ${client.email || 'N/A'}</li>
              </ul>
              <p>Please log in to the system to review and verify the client's KYC documents.</p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/clients/${clientId}">Review KYC</a></p>
            `,
          });
        } catch {
          // Email failure shouldn't break the process
        }
      }
    }
  }
}
