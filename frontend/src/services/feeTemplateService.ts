import { api } from '../lib/api';

const BASE_URL = '/fee-templates';

export type FeeCategory = 'PROCESSING' | 'SERVICE' | 'INSURANCE' | 'LEGAL' | 'PENALTY' | 'OTHER';
export type FeeCalculationType = 'FIXED' | 'PERCENTAGE';

export interface FeeTemplate {
  id: string;
  name: string;
  category: FeeCategory;
  calculationType: FeeCalculationType;
  value: number;
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeeTemplateDto {
  name: string;
  category: FeeCategory;
  calculationType: FeeCalculationType;
  value: number;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
}

export interface UpdateFeeTemplateDto extends Partial<CreateFeeTemplateDto> {
  isActive?: boolean;
}

export interface QueryFeeTemplatesDto {
  page?: number;
  limit?: number;
  isActive?: string;
  category?: FeeCategory;
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

export const feeTemplateService = {
  async getAll(params?: QueryFeeTemplatesDto): Promise<PaginatedResponse<FeeTemplate>> {
    const response = await api.get<PaginatedResponse<FeeTemplate>>(BASE_URL, { params });
    return response.data;
  },

  async getById(id: string): Promise<FeeTemplate> {
    const response = await api.get<FeeTemplate>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(data: CreateFeeTemplateDto): Promise<FeeTemplate> {
    const response = await api.post<FeeTemplate>(BASE_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdateFeeTemplateDto): Promise<FeeTemplate> {
    const response = await api.patch<FeeTemplate>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async toggleActive(id: string): Promise<FeeTemplate> {
    const response = await api.patch<FeeTemplate>(`${BASE_URL}/${id}/toggle-active`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
