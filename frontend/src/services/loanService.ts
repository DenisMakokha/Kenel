import api from '../lib/api';
import type { Loan, LoanListResponse, QueryLoansDto } from '../types/loan';

const BASE_URL = '/loans';

export const loanService = {
  async getLoans(params?: QueryLoansDto): Promise<LoanListResponse> {
    const response = await api.get<LoanListResponse>(BASE_URL, { params });
    return response.data;
  },

  async getLoan(id: string): Promise<Loan> {
    const response = await api.get<Loan>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createFromApplication(applicationId: string): Promise<Loan> {
    const response = await api.post<Loan>(`${BASE_URL}/from-application/${applicationId}`);
    return response.data;
  },

  async disburseLoan(id: string): Promise<Loan> {
    const response = await api.post<Loan>(`${BASE_URL}/${id}/disburse`);
    return response.data;
  },
};
