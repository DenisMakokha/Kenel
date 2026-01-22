export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  performedBy: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: AuditLogUser;
}

export interface AuditLogListResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
