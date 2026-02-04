import api from '../lib/api';
import type {
  Client,
  ClientListResponse,
  CreateClientDto,
  UpdateClientDto,
  QueryClientsDto,
  SubmitKycDto,
  ApproveKycDto,
  RejectKycDto,
  UpdateRiskRatingDto,
  CreateNextOfKinDto,
  UpdateNextOfKinDto,
  CreateRefereeDto,
  UpdateRefereeDto,
  NextOfKin,
  Referee,
  KycEvent,
} from '../types/client';

const BASE_URL = '/clients';

export const clientService = {
  // ============================================
  // CLIENT CRUD
  // ============================================

  async createClient(data: CreateClientDto): Promise<Client> {
    const response = await api.post<Client>(BASE_URL, data);
    return response.data;
  },

  async getClients(params?: QueryClientsDto): Promise<ClientListResponse> {
    const response = await api.get<ClientListResponse>(BASE_URL, { params });
    return response.data;
  },

  async getClient(id: string): Promise<Client> {
    const response = await api.get<Client>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async updateClient(id: string, data: UpdateClientDto): Promise<Client> {
    const response = await api.patch<Client>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async deleteClient(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // ============================================
  // KYC WORKFLOW
  // ============================================

  async submitForKyc(id: string, data: SubmitKycDto): Promise<Client> {
    const response = await api.post<Client>(`${BASE_URL}/${id}/kyc/submit`, data);
    return response.data;
  },

  async approveKyc(id: string, data: ApproveKycDto): Promise<Client> {
    const response = await api.post<Client>(`${BASE_URL}/${id}/kyc/approve`, data);
    return response.data;
  },

  async rejectKyc(id: string, data: RejectKycDto): Promise<Client> {
    const response = await api.post<Client>(`${BASE_URL}/${id}/kyc/reject`, data);
    return response.data;
  },

  async getKycHistory(id: string): Promise<KycEvent[]> {
    const response = await api.get<KycEvent[]>(`${BASE_URL}/${id}/kyc/history`);
    return response.data;
  },

  async updateRiskRating(id: string, data: UpdateRiskRatingDto): Promise<Client> {
    const response = await api.patch<Client>(`${BASE_URL}/${id}/risk-rating`, data);
    return response.data;
  },

  // ============================================
  // NEXT OF KIN
  // ============================================

  async addNextOfKin(clientId: string, data: CreateNextOfKinDto): Promise<NextOfKin> {
    const response = await api.post<NextOfKin>(`${BASE_URL}/${clientId}/next-of-kin`, data);
    return response.data;
  },

  async updateNextOfKin(
    clientId: string,
    nokId: string,
    data: UpdateNextOfKinDto
  ): Promise<NextOfKin> {
    const response = await api.patch<NextOfKin>(
      `${BASE_URL}/${clientId}/next-of-kin/${nokId}`,
      data
    );
    return response.data;
  },

  async deleteNextOfKin(clientId: string, nokId: string): Promise<void> {
    await api.delete(`${BASE_URL}/${clientId}/next-of-kin/${nokId}`);
  },

  // ============================================
  // REFEREES
  // ============================================

  async addReferee(clientId: string, data: CreateRefereeDto): Promise<Referee> {
    const response = await api.post<Referee>(`${BASE_URL}/${clientId}/referees`, data);
    return response.data;
  },

  async updateReferee(
    clientId: string,
    refereeId: string,
    data: UpdateRefereeDto
  ): Promise<Referee> {
    const response = await api.patch<Referee>(
      `${BASE_URL}/${clientId}/referees/${refereeId}`,
      data
    );
    return response.data;
  },

  async deleteReferee(clientId: string, refereeId: string): Promise<void> {
    await api.delete(`/clients/${clientId}/referees/${refereeId}`);
  },

  // Document Management
  uploadDocument: async (
    clientId: string,
    file: File,
    documentType: string,
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await api.post(`/clients/${clientId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDocuments: async (clientId: string): Promise<any[]> => {
    const response = await api.get(`/clients/${clientId}/documents`);
    return response.data;
  },

  getKycStats: async (): Promise<{ pendingReview: number; verifiedToday: number; rejectedToday: number; totalUnverified: number }> => {
    const response = await api.get('/clients/kyc/stats');
    return response.data;
  },

  deleteDocument: async (clientId: string, documentId: string): Promise<void> => {
    await api.delete(`/clients/${clientId}/documents/${documentId}`);
  },

  getTimeline: async (clientId: string): Promise<any[]> => {
    const response = await api.get(`/clients/${clientId}/timeline`);
    return response.data;
  },

  getLoanStats: async (clientId: string): Promise<{
    totalLoans: number;
    activeLoans: number;
    totalDisbursed: number;
    totalRepaid: number;
    currentBalance: number;
  }> => {
    const response = await api.get(`/clients/${clientId}/loan-stats`);
    return response.data;
  },
};
