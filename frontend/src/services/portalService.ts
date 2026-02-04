import portalApi from '../lib/portalApi';
import type { PortalClient, PortalDashboardResponse, PortalLoanSummary, PortalLoanApplication, PortalNotificationsResponse } from '../types/portal';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  password: string;
}

export const portalService = {
  async login(email: string, password: string) {
    const response = await portalApi.post<{
      accessToken: string;
      refreshToken: string;
      client: PortalClient | null;
    }>('/portal/auth/login', { email, password });
    return response.data;
  },

  async register(data: RegisterData) {
    const response = await portalApi.post('/portal/auth/register', data);
    return response.data;
  },

  async refresh() {
    const response = await portalApi.post<{
      accessToken: string;
      refreshToken: string;
    }>('/portal/auth/refresh');
    return response.data;
  },

  async logout() {
    await portalApi.post('/portal/auth/logout');
  },

  async getMe(): Promise<PortalClient> {
    const response = await portalApi.get<PortalClient>('/portal/me');
    return response.data;
  },

  async getDashboard(): Promise<PortalDashboardResponse> {
    const response = await portalApi.get<PortalDashboardResponse>('/portal/dashboard');
    return response.data;
  },

  async getLoanProducts() {
    const response = await portalApi.get('/portal/products');
    return response.data;
  },

  async getLoanApplications(): Promise<PortalLoanApplication[]> {
    const response = await portalApi.get<PortalLoanApplication[]>('/portal/loan-applications');
    return response.data;
  },

  async getLoanApplicationDetail(applicationId: string): Promise<any> {
    const response = await portalApi.get(`/portal/loan-applications/${applicationId}`);
    return response.data;
  },

  async createLoanApplication(data: {
    productVersionId: string;
    requestedAmount: number;
    requestedTermMonths: number;
    purpose: string;
  }) {
    const response = await portalApi.post('/portal/loan-applications', data);
    return response.data;
  },

  async updateLoanApplication(
    id: string,
    data: {
      requestedAmount?: number;
      requestedTermMonths?: number;
      requestedRepaymentFrequency?: string;
      purpose?: string;
    },
  ) {
    const response = await portalApi.patch(`/portal/loan-applications/${id}`, data);
    return response.data;
  },

  async uploadLoanApplicationDocument(
    id: string,
    data: {
      file: File;
      type?: string;
      category?: string;
    },
  ) {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.type) formData.append('type', data.type);
    if (data.category) formData.append('category', data.category);

    const response = await portalApi.post(`/portal/loan-applications/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async submitLoanApplication(id: string, data?: { notes?: string }) {
    const response = await portalApi.post(`/portal/loan-applications/${id}/submit`, data || {});
    return response.data;
  },

  async deleteLoanApplication(id: string) {
    const response = await portalApi.delete(`/portal/loan-applications/${id}`);
    return response.data;
  },

  async getLoans(): Promise<PortalLoanSummary[]> {
    const response = await portalApi.get<PortalLoanSummary[]>('/portal/loans');
    return response.data;
  },

  async getLoan(loanId: string) {
    const response = await portalApi.get(`/portal/loans/${loanId}`);
    return response.data;
  },

  async getLoanSchedule(loanId: string) {
    const response = await portalApi.get(`/portal/loans/${loanId}/schedule`);
    return response.data;
  },

  async getLoanTransactions(loanId: string) {
    const response = await portalApi.get(`/portal/loans/${loanId}/transactions`);
    return response.data;
  },

  async downloadReceipt(loanId: string, repaymentId: string): Promise<Blob> {
    const response = await portalApi.get(`/portal/loans/${loanId}/receipts/${repaymentId}`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  async downloadStatement(loanId: string, from?: string, to?: string): Promise<Blob> {
    const response = await portalApi.get(`/portal/loans/${loanId}/statement`, {
      params: { from, to },
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  async updateProfile(data: { firstName?: string; lastName?: string; email?: string; phonePrimary?: string; residentialAddress?: string }) {
    const response = await portalApi.patch('/portal/me', data);
    return response.data;
  },

  async addNextOfKin(data: {
    fullName: string;
    relation: string;
    phone: string;
    email?: string;
    address?: string;
    isPrimary?: boolean;
  }) {
    const response = await portalApi.post('/portal/me/next-of-kin', data);
    return response.data;
  },

  async updateNextOfKin(
    nokId: string,
    data: {
      fullName?: string;
      relation?: string;
      phone?: string;
      email?: string;
      address?: string;
      isPrimary?: boolean;
    },
  ) {
    const response = await portalApi.patch(`/portal/me/next-of-kin/${nokId}`, data);
    return response.data;
  },

  async removeNextOfKin(nokId: string) {
    const response = await portalApi.post(`/portal/me/next-of-kin/${nokId}/delete`);
    return response.data;
  },

  async addReferee(data: {
    fullName: string;
    phone: string;
    relation?: string;
    idNumber?: string;
    employerName?: string;
    address?: string;
  }) {
    const response = await portalApi.post('/portal/me/referees', data);
    return response.data;
  },

  async updateReferee(
    refereeId: string,
    data: {
      fullName?: string;
      phone?: string;
      relation?: string;
      idNumber?: string;
      employerName?: string;
      address?: string;
    },
  ) {
    const response = await portalApi.patch(`/portal/me/referees/${refereeId}`, data);
    return response.data;
  },

  async removeReferee(refereeId: string) {
    const response = await portalApi.post(`/portal/me/referees/${refereeId}/delete`);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await portalApi.post('/portal/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  async getNotificationPreferences() {
    const response = await portalApi.get('/portal/preferences');
    return response.data;
  },

  async updateNotificationPreferences(preferences: { paymentReminders?: boolean; emailNotifications?: boolean; smsNotifications?: boolean }) {
    const response = await portalApi.patch('/portal/preferences', preferences);
    return response.data;
  },

  // Notifications
  async getNotifications(): Promise<PortalNotificationsResponse> {
    const response = await portalApi.get<PortalNotificationsResponse>('/portal/notifications');
    return response.data;
  },

  async markNotificationAsRead(notificationId: string) {
    const response = await portalApi.post(`/portal/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllNotificationsAsRead() {
    const response = await portalApi.post('/portal/notifications/read-all');
    return response.data;
  },

  async deleteNotification(notificationId: string) {
    const response = await portalApi.delete(`/portal/notifications/${notificationId}`);
    return response.data;
  },

  // Document management
  async uploadDocument(file: File, documentType: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    const response = await portalApi.post('/portal/me/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteDocument(documentId: string) {
    const response = await portalApi.delete(`/portal/me/documents/${documentId}`);
    return response.data;
  },

  // Employment update
  async updateEmployment(data: { employerName?: string; occupation?: string; monthlyIncome?: string }) {
    const response = await portalApi.patch('/portal/me', data);
    return response.data;
  },

  // KYC submission
  async submitKycForReview() {
    const response = await portalApi.post('/portal/me/kyc/submit');
    return response.data;
  },
};
