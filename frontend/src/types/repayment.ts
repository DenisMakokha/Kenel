export enum RepaymentChannel {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CHEQUE = 'CHEQUE',
}

export enum RepaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVERSED = 'REVERSED',
}

export interface RepaymentAllocation {
  id: string;
  repaymentId: string;
  principalAmount: string; // decimal as string
  interestAmount: string;
  feesAmount: string;
  penaltiesAmount: string;
  totalAllocated: string;
  createdAt: string;
}

export interface Repayment {
  id: string;
  loanId: string;
  receiptNumber: string;
  amount: string;
  channel: RepaymentChannel;
  reference?: string | null;
  transactionDate: string;
  status: RepaymentStatus;
  postedBy: string;
  postedAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  reversedBy?: string | null;
  reversedAt?: string | null;
  reversalReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  allocation?: RepaymentAllocation | null;

  loan?: {
    id: string;
    loanNumber: string;
    clientId: string;
    client?: {
      id: string;
      clientCode: string;
      firstName: string;
      lastName: string;
      phonePrimary?: string | null;
      email?: string | null;
    } | null;
  };
}

export interface RepaymentListResponse {
  data: Repayment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QueryRepaymentsParams {
  status?: RepaymentStatus;
  page?: number;
  limit?: number;
}

export interface QueryAllRepaymentsParams {
  search?: string;
  loanId?: string;
  clientId?: string;
  channel?: RepaymentChannel;
  status?: RepaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateRepaymentDto {
  amount: number;
  channel: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE';
  reference?: string;
  valueDate: string;
  notes?: string;
}
