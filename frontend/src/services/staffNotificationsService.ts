import api from '../lib/api';

export interface StaffNotification {
  id: string;
  userId: string;
  type: string;
  category: string;
  title: string;
  message: string;
  linkUrl?: string;
  linkText?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface DashboardAlerts {
  pendingKyc: number;
  pendingApplications: number;
  overdueLoans: number;
  // Credit Officer specific
  applicationsUnderReview?: number;
  pendingKycReviews?: number;
  // Finance Officer specific
  pendingDisbursements?: number;
  loansInArrears?: number;
  highValueArrears?: number;
  // Admin specific
  documentsWithThreats?: number;
}

export const staffNotificationsService = {
  async getNotifications(): Promise<StaffNotification[]> {
    const response = await api.get('/staff-notifications');
    return response.data;
  },

  async getUnreadNotifications(): Promise<StaffNotification[]> {
    const response = await api.get('/staff-notifications/unread');
    return response.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get('/staff-notifications/count');
    return response.data;
  },

  async getDashboardAlerts(): Promise<DashboardAlerts> {
    const response = await api.get('/staff-notifications/alerts');
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/staff-notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/staff-notifications/read-all');
  },
};

export default staffNotificationsService;
