import api from '../lib/api';
import type {
  LoanProduct,
  LoanProductVersion,
  ProductListResponse,
  VersionListResponse,
  AuditLogListResponse,
  SchedulePreviewResponse,
  CreateLoanProductDto,
  UpdateLoanProductDto,
  CreateProductVersionDto,
  UpdateProductVersionDto,
  QueryProductsDto,
  QueryVersionsDto,
  PreviewScheduleDto,
} from '../types/loan-product';

const BASE_URL = '/loan-products';

export const loanProductService = {
  // ============================================
  // PRODUCT CRUD
  // ============================================

  async createProduct(data: CreateLoanProductDto): Promise<LoanProduct> {
    const response = await api.post<LoanProduct>(BASE_URL, data);
    return response.data;
  },

  async getProducts(params?: QueryProductsDto): Promise<ProductListResponse> {
    const response = await api.get<ProductListResponse>(BASE_URL, { params });
    return response.data;
  },

  async getProduct(id: string): Promise<LoanProduct> {
    const response = await api.get<LoanProduct>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async updateProduct(id: string, data: UpdateLoanProductDto): Promise<LoanProduct> {
    const response = await api.patch<LoanProduct>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // ============================================
  // VERSION MANAGEMENT
  // ============================================

  async getVersions(productId: string, params?: QueryVersionsDto): Promise<VersionListResponse> {
    const response = await api.get<VersionListResponse>(`${BASE_URL}/${productId}/versions`, {
      params,
    });
    return response.data;
  },

  async createVersion(
    productId: string,
    data: CreateProductVersionDto,
  ): Promise<LoanProductVersion> {
    const response = await api.post<LoanProductVersion>(
      `${BASE_URL}/${productId}/versions`,
      data,
    );
    return response.data;
  },

  async getVersion(productId: string, versionId: string): Promise<LoanProductVersion> {
    const response = await api.get<LoanProductVersion>(
      `${BASE_URL}/${productId}/versions/${versionId}`,
    );
    return response.data;
  },

  async updateVersion(
    productId: string,
    versionId: string,
    data: UpdateProductVersionDto,
  ): Promise<LoanProductVersion> {
    const response = await api.patch<LoanProductVersion>(
      `${BASE_URL}/${productId}/versions/${versionId}`,
      data,
    );
    return response.data;
  },

  async publishVersion(productId: string, versionId: string): Promise<LoanProductVersion> {
    const response = await api.post<LoanProductVersion>(
      `${BASE_URL}/${productId}/versions/${versionId}/publish`,
    );
    return response.data;
  },

  async retireVersion(productId: string, versionId: string): Promise<LoanProductVersion> {
    const response = await api.post<LoanProductVersion>(
      `${BASE_URL}/${productId}/versions/${versionId}/retire`,
    );
    return response.data;
  },

  async previewSchedule(
    productId: string,
    versionId: string,
    data: PreviewScheduleDto,
  ): Promise<SchedulePreviewResponse> {
    const response = await api.post<SchedulePreviewResponse>(
      `${BASE_URL}/${productId}/versions/${versionId}/preview-schedule`,
      data,
    );
    return response.data;
  },

  async downloadSchedulePdf(
    productId: string,
    versionId: string,
    data: PreviewScheduleDto,
  ): Promise<Blob> {
    const response = await api.post(
      `${BASE_URL}/${productId}/versions/${versionId}/preview-schedule/pdf`,
      data,
      { responseType: 'blob' },
    );
    return response.data as Blob;
  },

  // ============================================
  // AUDIT LOGS
  // ============================================

  async getAuditLogs(
    productId: string,
    page?: number,
    limit?: number,
  ): Promise<AuditLogListResponse> {
    const response = await api.get<AuditLogListResponse>(
      `${BASE_URL}/${productId}/audit-logs`,
      {
        params: { page, limit },
      },
    );
    return response.data;
  },
};
