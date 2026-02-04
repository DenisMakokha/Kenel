export interface PortalClient {
  id: string;
  clientCode: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phonePrimary?: string | null;
  residentialAddress?: string | null;
  kycStatus?: string;
  maskedIdNumber: string | null;
  maskedPhone: string | null;
  nextOfKin?: PortalNextOfKin[];
  referees?: PortalReferee[];
}

export interface PortalNextOfKin {
  id: string;
  clientId: string;
  fullName: string;
  relation: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortalReferee {
  id: string;
  clientId: string;
  fullName: string;
  relation?: string | null;
  phone: string;
  idNumber?: string | null;
  employerName?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalLoanSummary {
  id: string;
  loanNumber: string;
  productName: string;
  status: string;
  principal: number;
  outstanding: number;
  nextDueDate: string | null;
  inArrears: boolean;
  daysPastDue: number;
}

export interface PortalDashboardResponse {
  summary: {
    totalActiveLoans: number;
    totalOutstanding: number;
    nextPayment: {
      loanNumber: string | null;
      dueDate: string;
      amount: number | null;
    } | null;
  };
  activeLoans: PortalLoanSummary[];
}

export interface PortalLoanApplication {
  id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CANCELLED';
  requestedAmount: number;
  requestedTermMonths: number;
  purpose: string | null;
  productName: string;
  createdAt: string;
  submittedAt: string | null;
  rejectionReason: string | null;
  loanId: string | null;
  loanStatus: string | null;
}

export interface PortalNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'loan_application' | 'payment' | 'loan' | 'system';
  title: string;
  message: string;
  actionUrl: string | null;
  actionLabel: string | null;
  read: boolean;
  createdAt: string;
}

export interface PortalNotificationsResponse {
  notifications: PortalNotification[];
  unreadCount: number;
}
