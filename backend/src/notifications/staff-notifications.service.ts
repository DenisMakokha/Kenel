import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateStaffNotificationDto {
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'kyc_review' | 'loan_application';
  category: 'kyc' | 'loan' | 'system' | 'client';
  title: string;
  message: string;
  linkUrl?: string;
  linkText?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class StaffNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: CreateStaffNotificationDto) {
    return this.prisma.staffNotification.create({
      data: {
        userId: data.userId,
        type: data.type,
        category: data.category,
        title: data.title,
        message: data.message,
        linkUrl: data.linkUrl,
        linkText: data.linkText,
        metadata: data.metadata,
      },
    });
  }

  async createNotificationForRoles(
    roles: string[],
    notification: Omit<CreateStaffNotificationDto, 'userId'>,
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: roles as any },
      },
      select: { id: true },
    });

    const notifications = users.map((user) => ({
      userId: user.id,
      type: notification.type,
      category: notification.category,
      title: notification.title,
      message: notification.message,
      linkUrl: notification.linkUrl,
      linkText: notification.linkText,
      metadata: notification.metadata,
    }));

    return this.prisma.staffNotification.createMany({
      data: notifications,
    });
  }

  async getNotifications(userId: string, options?: { unreadOnly?: boolean; limit?: number }) {
    return this.prisma.staffNotification.findMany({
      where: {
        userId,
        ...(options?.unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.staffNotification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.staffNotification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.staffNotification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // KYC-specific notification
  async notifyKycSubmitted(clientId: string, clientName: string, clientCode: string) {
    return this.createNotificationForRoles(['CREDIT_OFFICER', 'ADMIN'], {
      type: 'kyc_review',
      category: 'kyc',
      title: 'New KYC Submission',
      message: `${clientName} (${clientCode}) has submitted their KYC for review.`,
      linkUrl: `/clients/${clientId}`,
      linkText: 'Review KYC',
      metadata: { clientId, clientName, clientCode },
    });
  }

  // Loan application notification
  async notifyLoanApplicationSubmitted(
    applicationId: string,
    applicationNumber: string,
    clientName: string,
    amount: number,
  ) {
    return this.createNotificationForRoles(['CREDIT_OFFICER', 'ADMIN'], {
      type: 'loan_application',
      category: 'loan',
      title: 'New Loan Application',
      message: `${clientName} has applied for KES ${amount.toLocaleString()}. Application: ${applicationNumber}`,
      linkUrl: `/loan-applications/${applicationId}`,
      linkText: 'Review Application',
      metadata: { applicationId, applicationNumber, clientName, amount },
    });
  }

  // Get pending KYC count for dashboard
  async getPendingKycCount() {
    return this.prisma.client.count({
      where: { kycStatus: 'PENDING_REVIEW' },
    });
  }

  // Get pending loan applications count
  async getPendingApplicationsCount() {
    return this.prisma.loanApplication.count({
      where: { status: 'SUBMITTED' },
    });
  }

  // Get dashboard alerts for all staff roles
  async getDashboardAlerts(role?: string) {
    const [pendingKyc, pendingApplications, overdueLoans] = await Promise.all([
      this.getPendingKycCount(),
      this.getPendingApplicationsCount(),
      this.prisma.loan.count({
        where: {
          status: 'IN_ARREARS',
        },
      }),
    ]);

    return {
      pendingKyc,
      pendingApplications,
      overdueLoans,
    };
  }

  // Get role-specific dashboard alerts
  async getRoleAlerts(role: string) {
    const baseAlerts = await this.getDashboardAlerts(role);

    if (role === 'CREDIT_OFFICER') {
      const [applicationsUnderReview, pendingKycReviews, documentsPendingReview] = await Promise.all([
        this.prisma.loanApplication.count({
          where: { status: 'UNDER_REVIEW' },
        }),
        this.prisma.client.count({
          where: { kycStatus: 'PENDING_REVIEW' },
        }),
        this.prisma.clientDocument.count({
          where: { reviewStatus: 'PENDING', isDeleted: false },
        }),
      ]);

      return {
        ...baseAlerts,
        applicationsUnderReview,
        pendingKycReviews,
        documentsPendingReview,
      };
    }

    if (role === 'FINANCE_OFFICER') {
      const [pendingDisbursements, loansInArrears, highValueArrears, loansDueToday] = await Promise.all([
        this.prisma.loan.count({
          where: { status: 'PENDING_DISBURSEMENT' },
        }),
        this.prisma.loan.count({
          where: { status: 'IN_ARREARS' },
        }),
        this.prisma.loan.count({
          where: {
            status: 'IN_ARREARS',
            outstandingPrincipal: { gte: 100000 },
          },
        }),
        this.prisma.loan.count({
          where: { status: 'DUE' },
        }),
      ]);

      return {
        ...baseAlerts,
        pendingDisbursements,
        loansInArrears,
        highValueArrears,
        loansDueToday,
      };
    }

    // ADMIN gets everything
    if (role === 'ADMIN') {
      const [
        applicationsUnderReview,
        pendingDisbursements,
        documentsWithThreats,
        loansDueToday,
        documentsPendingReview,
      ] = await Promise.all([
        this.prisma.loanApplication.count({
          where: { status: 'UNDER_REVIEW' },
        }),
        this.prisma.loan.count({
          where: { status: 'PENDING_DISBURSEMENT' },
        }),
        this.prisma.clientDocument.count({
          where: { virusScanStatus: 'infected' },
        }),
        this.prisma.loan.count({
          where: { status: 'DUE' },
        }),
        this.prisma.clientDocument.count({
          where: { reviewStatus: 'PENDING', isDeleted: false },
        }),
      ]);

      return {
        ...baseAlerts,
        applicationsUnderReview,
        pendingDisbursements,
        documentsWithThreats,
        loansDueToday,
        documentsPendingReview,
      };
    }

    return baseAlerts;
  }
}
