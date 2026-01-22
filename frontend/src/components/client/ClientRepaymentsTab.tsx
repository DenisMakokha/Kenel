import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Wallet,
  Receipt,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { loanService } from '../../services/loanService';
import { repaymentService } from '../../services/repaymentService';
import type { Client } from '../../types/client';
import type { Loan } from '../../types/loan';
import type { Repayment } from '../../types/repayment';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface ClientRepaymentsTabProps {
  client: Client;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  REVERSED: { label: 'Reversed', color: 'bg-slate-100 text-slate-700', icon: RotateCcw },
};

const CHANNEL_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'M-Pesa',
  CHEQUE: 'Cheque',
};

export default function ClientRepaymentsTab({ client }: ClientRepaymentsTabProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [client.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all loans for this client
      const loansResponse = await loanService.getLoans({ clientId: client.id, page: 1, limit: 100 });
      setLoans(loansResponse.data);
      
      // Get repayments for each loan
      const allRepayments: Repayment[] = [];
      for (const loan of loansResponse.data) {
        try {
          const repaymentsResponse = await repaymentService.getRepayments(loan.id, { page: 1, limit: 50 });
          allRepayments.push(...repaymentsResponse.data.map(r => ({ ...r, loanNumber: loan.loanNumber })));
        } catch {
          // Skip if no repayments
        }
      }
      
      // Sort by date descending
      allRepayments.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
      setRepayments(allRepayments);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load repayment history');
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = repayments
    .filter((r) => r.status === 'APPROVED')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const totalOutstanding = loans.reduce(
    (sum, loan) => sum + Number(loan.outstandingPrincipal) + Number(loan.outstandingInterest),
    0
  );

  if (loading) {
    return (
      <Card className="border-slate-100">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Loading repayment history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-100">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Repaid</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {repayments.filter(r => r.status === 'APPROVED').length} payments
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {loans.filter(l => l.status === 'ACTIVE').length} active loan(s)
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loans.filter(l => l.status === 'ACTIVE').length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {loans.length} total loan(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Repayments Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            All repayments made by {client.firstName} {client.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {repayments.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No repayments recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Loan</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repayments.map((repayment: any) => {
                    const statusConfig = STATUS_CONFIG[repayment.status];
                    const StatusIcon = statusConfig?.icon || Clock;
                    return (
                      <TableRow key={repayment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-slate-400" />
                            <code className="text-xs font-mono">
                              {repayment.receiptNumber}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono text-slate-600">
                            {repayment.loanNumber || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {formatDate(repayment.transactionDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(Number(repayment.amount))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">
                              {CHANNEL_LABELS[repayment.channel] || repayment.channel}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('font-medium', statusConfig?.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig?.label || repayment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
