import api from '../lib/api';
import type {
  QueryAllRepaymentsParams,
  QueryRepaymentsParams,
  Repayment,
  RepaymentListResponse,
} from '../types/repayment';

const BASE_URL = '/loans';
const GLOBAL_BASE_URL = '/repayments';

export const repaymentService = {
  async getRepayments(loanId: string, params?: QueryRepaymentsParams): Promise<RepaymentListResponse> {
    const response = await api.get<RepaymentListResponse>(`${BASE_URL}/${loanId}/repayments`, {
      params,
    });
    return response.data;
  },

  async getAllRepayments(params?: QueryAllRepaymentsParams): Promise<RepaymentListResponse> {
    const response = await api.get<RepaymentListResponse>(GLOBAL_BASE_URL, { params });
    return response.data;
  },

  async postRepayment(
    loanId: string,
    payload: {
      valueDate: string;
      amount: number;
      channel: string;
      reference?: string;
      notes?: string;
    },
  ): Promise<Repayment> {
    const response = await api.post<Repayment>(`${BASE_URL}/${loanId}/repayments`, payload);
    return response.data;
  },

  async downloadReceipt(loanId: string, repaymentId: string): Promise<Blob> {
    const response = await api.get(`${BASE_URL}/${loanId}/repayments/${repaymentId}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async downloadReceiptGlobal(repaymentId: string): Promise<Blob> {
    const response = await api.get(`${GLOBAL_BASE_URL}/${repaymentId}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async reverseRepayment(loanId: string, repaymentId: string, reason: string): Promise<Repayment> {
    const response = await api.post<Repayment>(
      `${BASE_URL}/${loanId}/repayments/${repaymentId}/reverse`,
      { reason },
    );
    return response.data;
  },
};
