import api from '../lib/api';
import type { AuditLogListResponse } from '../types/audit';

export interface QueryAuditLogsParams {
  entity?: string;
  entityId?: string;
  loanId?: string;
  page?: number;
  limit?: number;
}

export const auditLogService = {
  async getLogs(params?: QueryAuditLogsParams): Promise<AuditLogListResponse> {
    // Ensure page and limit are proper integers
    const queryParams: Record<string, any> = {};
    if (params) {
      if (params.entity) queryParams.entity = params.entity;
      if (params.entityId) queryParams.entityId = params.entityId;
      if (params.loanId) queryParams.loanId = params.loanId;
      if (params.page !== undefined) queryParams.page = Number(params.page);
      if (params.limit !== undefined) queryParams.limit = Number(params.limit);
    }
    const response = await api.get<AuditLogListResponse>('/audit-logs', {
      params: queryParams,
    });
    return response.data;
  },

  async getForLoan(
    loanId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ): Promise<AuditLogListResponse> {
    const response = await api.get<AuditLogListResponse>('/audit-logs', {
      params: {
        loanId,
        ...(params || {}),
      },
    });
    return response.data;
  },

  async getForEntity(
    entity: string,
    entityId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ): Promise<AuditLogListResponse> {
    const response = await api.get<AuditLogListResponse>('/audit-logs', {
      params: {
        entity,
        entityId,
        ...(params || {}),
      },
    });
    return response.data;
  },

  async getForLoanApplication(
    applicationId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ): Promise<AuditLogListResponse> {
    const response = await api.get<AuditLogListResponse>('/audit-logs', {
      params: {
        entity: 'loan_applications',
        entityId: applicationId,
        ...(params || {}),
      },
    });
    return response.data;
  },
};
