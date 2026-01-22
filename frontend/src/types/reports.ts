import type { LoanStatus } from './loan';

export interface PortfolioSummaryRow {
  asOfDate: string;
  productId: string | null;
  productName: string | null;
  branchId: string | null;
  officerId: string | null;
  totalLoans: number;
  totalPrincipalDisbursed: string;
  totalPrincipalOutstanding: string;
  totalInterestOutstanding: string;
  totalFeesOutstanding: string;
  totalPenaltiesOutstanding: string;
  totalOverduePrincipal: string;
  totalOverdueInterest: string;
  totalClosedLoans: number;
  totalWrittenOffLoans: number;
}

export interface PortfolioSummaryResponse {
  rows: PortfolioSummaryRow[];
  kpis: {
    totalOutstandingPrincipal: string;
    par30Amount: string;
    par30Ratio: number;
    par90Amount: string;
    par90Ratio: number;
  };
}

export interface AgingBucketRow {
  bucketLabel: string;
  dpdMin: number;
  dpdMax: number | null;
  loansInBucket: number;
  principalOutstanding: string;
  principalSharePct: number;
}

export interface AgingSummaryResponse {
  buckets: AgingBucketRow[];
  par: {
    par30Amount: string;
    par30Ratio: number;
    par90Amount: string;
    par90Ratio: number;
  };
}

export interface LoansInBucketRow {
  loanId: string;
  loanNumber: string;
  clientName: string;
  productName: string;
  daysPastDue: number;
  bucketLabel: string;
  principalOutstanding: string;
  lastPaymentDate: string | null;
  status: LoanStatus;
}

export interface LoansInBucketResponse {
  data: LoansInBucketRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type ReportExportFormat = 'csv' | 'pdf';
