import api from '../lib/api';
import type {
  LoanApplication,
  LoanApplicationListResponse,
  LoanApplicationChecklistItem,
  LoanApplicationEvent,
  ApplicationDocument,
  CreditScore,
  CreateLoanApplicationDto,
  UpdateLoanApplicationDto,
  QueryLoanApplicationsDto,
  SubmitLoanApplicationDto,
  ApproveLoanApplicationDto,
  RejectLoanApplicationDto,
  UpdateChecklistItemDto,
  UpsertCreditScoreDto,
} from '../types/loan-application';

const BASE_URL = '/loan-applications';

export const loanApplicationService = {
  async createApplication(data: CreateLoanApplicationDto): Promise<LoanApplication> {
    const response = await api.post<LoanApplication>(BASE_URL, data);
    return response.data;
  },

  async getApplications(params?: QueryLoanApplicationsDto): Promise<LoanApplicationListResponse> {
    const response = await api.get<LoanApplicationListResponse>(BASE_URL, { params });
    return response.data;
  },

  async getApplication(id: string): Promise<LoanApplication> {
    const response = await api.get<LoanApplication>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async updateApplication(id: string, data: UpdateLoanApplicationDto): Promise<LoanApplication> {
    const response = await api.patch<LoanApplication>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async submitApplication(id: string, data: SubmitLoanApplicationDto): Promise<LoanApplication> {
    const response = await api.post<LoanApplication>(`${BASE_URL}/${id}/submit`, data);
    return response.data;
  },

  async moveToUnderReview(id: string): Promise<LoanApplication> {
    const response = await api.post<LoanApplication>(`${BASE_URL}/${id}/move-to-under-review`);
    return response.data;
  },

  async approveApplication(id: string, data: ApproveLoanApplicationDto): Promise<LoanApplication> {
    const response = await api.post<LoanApplication>(`${BASE_URL}/${id}/approve`, data);
    return response.data;
  },

  async rejectApplication(id: string, data: RejectLoanApplicationDto): Promise<LoanApplication> {
    const response = await api.post<LoanApplication>(`${BASE_URL}/${id}/reject`, data);
    return response.data;
  },

  async bulkApprove(data: {
    ids: string[];
    approvedPrincipal: number;
    approvedTermMonths: number;
    approvedInterestRate: number;
    decisionNotes?: string;
  }): Promise<any> {
    const response = await api.post(`${BASE_URL}/bulk/approve`, data);
    return response.data;
  },

  async bulkReject(data: { ids: string[]; reason: string; notes?: string }): Promise<any> {
    const response = await api.post(`${BASE_URL}/bulk/reject`, data);
    return response.data;
  },

  async upsertScore(id: string, data: UpsertCreditScoreDto): Promise<CreditScore> {
    const response = await api.post<CreditScore>(`${BASE_URL}/${id}/score`, data);
    return response.data;
  },

  async getChecklist(id: string): Promise<LoanApplicationChecklistItem[]> {
    const response = await api.get<LoanApplicationChecklistItem[]>(`${BASE_URL}/${id}/checklist`);
    return response.data;
  },

  async updateChecklistItem(
    applicationId: string,
    itemId: string,
    data: UpdateChecklistItemDto,
  ): Promise<LoanApplicationChecklistItem> {
    const response = await api.patch<LoanApplicationChecklistItem>(
      `${BASE_URL}/${applicationId}/checklist/${itemId}`,
      data,
    );
    return response.data;
  },

  async getDocuments(id: string): Promise<ApplicationDocument[]> {
    const response = await api.get<ApplicationDocument[]>(`${BASE_URL}/${id}/documents`);
    return response.data;
  },

  async uploadDocument(
    applicationId: string,
    file: File,
    documentType: string,
  ): Promise<ApplicationDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await api.post<ApplicationDocument>(`${BASE_URL}/${applicationId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async deleteDocument(applicationId: string, documentId: string): Promise<void> {
    await api.delete(`${BASE_URL}/${applicationId}/documents/${documentId}`);
  },

  async reviewDocument(
    applicationId: string,
    documentId: string,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string,
  ): Promise<ApplicationDocument> {
    const response = await api.patch<ApplicationDocument>(
      `${BASE_URL}/${applicationId}/documents/${documentId}/review`,
      { status, notes },
    );
    return response.data;
  },

  async getEvents(id: string): Promise<LoanApplicationEvent[]> {
    const response = await api.get<LoanApplicationEvent[]>(`${BASE_URL}/${id}/events`);
    return response.data;
  },
};
