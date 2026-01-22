import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../services/loanService';
import type { Loan, LoanListResponse } from '../types/loan';
import { LoanStatus } from '../types/loan';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Download } from 'lucide-react';
import { exportLoanPortfolio } from '../lib/exportUtils';
import { formatCurrency } from '../lib/utils';

export default function LoansPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<LoanListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await loanService.getLoans({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          limit,
        });
        setData(response);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load loans');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [statusFilter, page, limit]);

  const getStatusBadge = (status: LoanStatus) => {
    const variants: Record<LoanStatus, any> = {
      PENDING_DISBURSEMENT: 'warning',
      ACTIVE: 'success',
      DUE: 'warning',
      IN_ARREARS: 'destructive',
      CLOSED: 'outline',
      WRITTEN_OFF: 'destructive',
      RESTRUCTURED: 'secondary',
    };

    const labels: Record<LoanStatus, string> = {
      PENDING_DISBURSEMENT: 'Pending Disbursement',
      ACTIVE: 'Active',
      DUE: 'Due',
      IN_ARREARS: 'In Arrears',
      CLOSED: 'Closed',
      WRITTEN_OFF: 'Written Off',
      RESTRUCTURED: 'Restructured',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const handleExport = () => {
    if (!data?.data) return;
    const exportData = data.data.map((loan) => ({
      loanNumber: loan.loanNumber,
      clientName: `${loan.client?.firstName || ''} ${loan.client?.lastName || ''}`.trim(),
      clientCode: loan.client?.clientCode || '',
      product: (loan as any).product?.name || '',
      disbursedAmount: Number(loan.principalAmount || 0),
      outstandingBalance: Number(loan.outstandingPrincipal || 0),
      interestRate: Number(loan.interestRate || 0),
      disbursementDate: loan.disbursedAt || '',
      maturityDate: (loan as any).maturityDate || '',
      status: loan.status,
      daysInArrears: 0,
    }));
    exportLoanPortfolio(exportData, 'loans_export');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Loans</h1>
          <p className="text-muted-foreground text-sm">Loans created from approved applications.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!data?.data?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card className="border-slate-100 bg-white shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Loans</CardTitle>
            <select
              className="border border-input rounded-md px-2 py-1 text-sm bg-background"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LoanStatus | 'ALL')}
            >
              <option value="ALL">All Statuses</option>
              <option value={LoanStatus.PENDING_DISBURSEMENT}>Pending Disbursement</option>
              <option value={LoanStatus.ACTIVE}>Active</option>
              <option value={LoanStatus.CLOSED}>Closed</option>
              <option value={LoanStatus.WRITTEN_OFF}>Written Off</option>
              <option value={LoanStatus.RESTRUCTURED}>Restructured</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading loans...</p>
          ) : !data || data.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No loans found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Repayment Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((loan: Loan) => {
                    const principal = Number(loan.principalAmount) || 0;
                    const outstanding = Number(loan.outstandingPrincipal) || 0;
                    const paid = principal - outstanding;
                    const progress = principal > 0 ? Math.round((paid / principal) * 100) : 0;
                    
                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.loanNumber}</TableCell>
                        <TableCell>
                          {loan.client
                            ? `${loan.client.firstName} ${loan.client.lastName}`
                            : loan.clientId}
                        </TableCell>
                        <TableCell>{formatCurrency(principal)}</TableCell>
                        <TableCell className="min-w-[180px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">{progress}% paid</span>
                              <span className="text-slate-500">{formatCurrency(outstanding)} left</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/loans/${loan.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-4 text-sm">
                <span className="text-muted-foreground">
                  Page {data.meta.page} of {data.meta.totalPages} (Total: {data.meta.total})
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.meta.page >= data.meta.totalPages}
                    onClick={() =>
                      setPage((p) => (data.meta.totalPages ? Math.min(data.meta.totalPages, p + 1) : p))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
