import api from '../lib/api';
import type {
  AgingSummaryResponse,
  LoansInBucketResponse,
  PortfolioSummaryResponse,
  ReportExportFormat,
} from '../types/reports';

const BASE_URL = '/reports';

export const reportService = {
  async getPortfolioSummary(params: {
    asOfDate?: string;
    groupBy?: 'none' | 'product' | 'branch' | 'officer';
    productId?: string;
    branchId?: string;
    officerId?: string;
  }): Promise<PortfolioSummaryResponse> {
    const response = await api.get<PortfolioSummaryResponse>(`${BASE_URL}/portfolio-summary`, {
      params,
    });
    return response.data;
  },

  async exportPortfolioSummary(params: {
    asOfDate?: string;
    groupBy?: 'none' | 'product' | 'branch' | 'officer';
    productId?: string;
    branchId?: string;
    officerId?: string;
    format?: ReportExportFormat;
  }): Promise<Blob> {
    const response = await api.get(`${BASE_URL}/portfolio-summary/export`, {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  async getAgingSummary(params: {
    asOfDate?: string;
    productId?: string;
    branchId?: string;
  }): Promise<AgingSummaryResponse> {
    const response = await api.get<AgingSummaryResponse>(`${BASE_URL}/aging`, {
      params,
    });
    return response.data;
  },

  async exportAgingSummary(params: {
    asOfDate?: string;
    productId?: string;
    branchId?: string;
    format?: ReportExportFormat;
  }): Promise<Blob> {
    const response = await api.get(`${BASE_URL}/aging/export`, {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  async getLoansInBucket(params: {
    asOfDate?: string;
    bucket: string;
    productId?: string;
    branchId?: string;
    page?: number;
    limit?: number;
  }): Promise<LoansInBucketResponse> {
    const response = await api.get<LoansInBucketResponse>(`${BASE_URL}/loans-in-bucket`, {
      params,
    });
    return response.data;
  },

  async exportLoans(params: {
    asOfDate?: string;
    bucket: string;
    productId?: string;
    branchId?: string;
    page?: number;
    limit?: number;
    format?: ReportExportFormat;
  }): Promise<Blob> {
    const response = await api.get(`${BASE_URL}/loans/export`, {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
