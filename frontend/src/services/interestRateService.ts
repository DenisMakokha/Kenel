import { api } from '../lib/api';

const BASE_URL = '/interest-rates';

export interface InterestRate {
  id: string;
  name: string;
  type: 'FLAT' | 'REDUCING' | 'DECLINING';
  rate: number;
  ratePeriod: 'PER_ANNUM' | 'PER_MONTH';
  minTerm: number;
  maxTerm: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterestRateDto {
  name: string;
  type: 'FLAT' | 'REDUCING' | 'DECLINING';
  rate: number;
  ratePeriod: 'PER_ANNUM' | 'PER_MONTH';
  minTerm: number;
  maxTerm: number;
  minAmount: number;
  maxAmount: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface UpdateInterestRateDto extends Partial<CreateInterestRateDto> {
  isActive?: boolean;
}

export interface QueryInterestRatesDto {
  page?: number;
  limit?: number;
  isActive?: string;
  type?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const interestRateService = {
  async getAll(params?: QueryInterestRatesDto): Promise<PaginatedResponse<InterestRate>> {
    const response = await api.get<PaginatedResponse<InterestRate>>(BASE_URL, { params });
    return response.data;
  },

  async getById(id: string): Promise<InterestRate> {
    const response = await api.get<InterestRate>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(data: CreateInterestRateDto): Promise<InterestRate> {
    const response = await api.post<InterestRate>(BASE_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdateInterestRateDto): Promise<InterestRate> {
    const response = await api.patch<InterestRate>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async toggleActive(id: string): Promise<InterestRate> {
    const response = await api.patch<InterestRate>(`${BASE_URL}/${id}/toggle-active`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
