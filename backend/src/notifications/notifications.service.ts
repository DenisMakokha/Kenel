import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string): Promise<Notification[]> {
    // Get notifications from audit logs and other sources
    const notifications: Notification[] = [];

    // Get pending loan applications (for credit officers/admins)
    const pendingApplications = await this.prisma.loanApplication.count({
      where: { status: 'SUBMITTED' },
    });

    if (pendingApplications > 0) {
      notifications.push({
        id: 'pending-apps',
        type: 'warning',
        title: 'Pending Applications',
        message: `${pendingApplications} loan application${pendingApplications > 1 ? 's' : ''} awaiting review`,
        link: '/loan-applications?status=SUBMITTED',
        read: false,
        createdAt: new Date(),
      });
    }

    // Get loans in arrears
    const loansInArrears = await this.prisma.loan.count({
      where: {
        OR: [
          { status: 'IN_ARREARS' as any },
          {
            status: { in: ['ACTIVE', 'DUE'] as any },
            outstandingPenalties: { gt: 0 },
          },
        ],
      },
    });

    if (loansInArrears > 0) {
      notifications.push({
        id: 'arrears-alert',
        type: 'error',
        title: 'Loans in Arrears',
        message: `${loansInArrears} loan${loansInArrears > 1 ? 's' : ''} currently in arrears`,
        link: '/loans?status=IN_ARREARS',
        read: false,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      });
    }

    // Get recent repayments
    const recentRepayments = await this.prisma.repayment.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        status: 'APPROVED',
      },
      include: { loan: { include: { client: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    recentRepayments.forEach((repayment) => {
      notifications.push({
        id: `repayment-${repayment.id}`,
        type: 'success',
        title: 'Payment Received',
        message: `KES ${Number(repayment.amount).toLocaleString()} from ${repayment.loan?.client?.firstName || 'Unknown'} ${repayment.loan?.client?.lastName || ''}`,
        link: `/loans/${repayment.loanId}`,
        read: false,
        createdAt: repayment.createdAt,
      });
    });

    // Get recent loan approvals
    const recentApprovals = await this.prisma.loanApplication.findMany({
      where: {
        status: 'APPROVED',
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: { client: true },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });

    recentApprovals.forEach((app) => {
      notifications.push({
        id: `approval-${app.id}`,
        type: 'success',
        title: 'Loan Approved',
        message: `Application ${app.applicationNumber} has been approved`,
        link: `/loan-applications/${app.id}`,
        read: false,
        createdAt: app.updatedAt,
      });
    });

    // Sort by date, newest first
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const limited = notifications.slice(0, 20);

    if (limited.length === 0) {
      return [];
    }

    const stateRows = await this.prisma.notificationUserState.findMany({
      where: {
        userId,
        notificationKey: { in: limited.map((n) => n.id) },
      },
    });

    const stateByKey = new Map(stateRows.map((s) => [s.notificationKey, s]));

    return limited
      .filter((n) => {
        const state = stateByKey.get(n.id);
        return !state?.deletedAt;
      })
      .map((n) => {
        const state = stateByKey.get(n.id);
        return {
          ...n,
          read: Boolean(state?.readAt),
        };
      });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notificationUserState.upsert({
      where: {
        userId_notificationKey: {
          userId,
          notificationKey: notificationId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        userId,
        notificationKey: notificationId,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId);
    if (notifications.length === 0) return;

    const keys = notifications.map((n) => n.id);
    const now = new Date();

    await this.prisma.notificationUserState.createMany({
      data: keys.map((notificationKey) => ({
        userId,
        notificationKey,
        readAt: now,
      })),
      skipDuplicates: true,
    });

    await this.prisma.notificationUserState.updateMany({
      where: {
        userId,
        notificationKey: { in: keys },
        deletedAt: null,
      },
      data: {
        readAt: now,
      },
    });
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notificationUserState.upsert({
      where: {
        userId_notificationKey: {
          userId,
          notificationKey: notificationId,
        },
      },
      update: {
        deletedAt: new Date(),
      },
      create: {
        userId,
        notificationKey: notificationId,
        deletedAt: new Date(),
      },
    });
  }
}
