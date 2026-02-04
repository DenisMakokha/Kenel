import { LoanApplicationStatus } from './loan-application';
import type { Repayment } from './repayment';

export enum LoanStatus {
  PENDING_DISBURSEMENT = 'PENDING_DISBURSEMENT',
  ACTIVE = 'ACTIVE',
  DUE = 'DUE',
  IN_ARREARS = 'IN_ARREARS',
  CLOSED = 'CLOSED',
  WRITTEN_OFF = 'WRITTEN_OFF',
  RESTRUCTURED = 'RESTRUCTURED',
}

export type InterestMethod = 'FLAT_RATE' | 'DECLINING_BALANCE' | 'REDUCING_BALANCE';

export interface LoanSchedule {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  principalDue: string; // Decimal as string
  interestDue: string;
  feesDue: string;
  totalDue: string;
  principalPaid: string;
  interestPaid: string;
  feesPaid: string;
  penaltiesPaid: string;
  totalPaid: string;
  balance: string;
  isPaid: boolean;
  paidAt?: string | null;
  isOverdue: boolean;
  daysPastDue: number;
}

export interface Loan {
  id: string;
  loanNumber: string;
  clientId: string;
  applicationId: string;

  principalAmount: string;
  interestRate: string;
  interestMethod: InterestMethod;
  penaltyRate: string;
  termMonths: number;

  totalInterest: string;
  totalAmount: string;
  outstandingPrincipal: string;
  outstandingInterest: string;
  outstandingFees: string;
  outstandingPenalties: string;
  totalRepaid?: string;

  status: LoanStatus;

  disbursedAt?: string | null;
  lastPaymentDate?: string | null;
  firstDueDate?: string | null;
  maturityDate?: string | null;
  closedAt?: string | null;

  createdAt: string;
  updatedAt: string;

  client?: {
    id: string;
    clientCode: string;
    firstName: string;
    lastName: string;
  };
  application?: {
    id: string;
    applicationNumber: string;
    status: LoanApplicationStatus;
  };
  schedules?: LoanSchedule[];
  repayments?: Repayment[];
}

export interface LoanListResponse {
  data: Loan[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QueryLoansDto {
  status?: LoanStatus;
  clientId?: string;
  applicationId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
