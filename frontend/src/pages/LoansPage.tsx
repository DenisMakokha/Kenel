import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../services/loanService';
import type { Loan, LoanListResponse } from '../types/loan';
import { LoanStatus } from '../types/loan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Download,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { exportLoanPortfolio } from '../lib/exportUtils';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';

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

  const STATUS_CONFIG: Record<LoanStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
    PENDING_DISBURSEMENT: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
    ACTIVE: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle },
    DUE: { label: 'Due', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertTriangle },
    IN_ARREARS: { label: 'In Arrears', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
    CLOSED: { label: 'Closed', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icon: CheckCircle },
    WRITTEN_OFF: { label: 'Written Off', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
    RESTRUCTURED: { label: 'Restructured', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: TrendingUp },
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

  // Calculate stats
  const stats = {
    total: data?.meta?.total || 0,
    active: data?.data?.filter(l => l.status === LoanStatus.ACTIVE).length || 0,
    totalDisbursed: data?.data?.reduce((sum, l) => sum + (Number(l.principalAmount) || 0), 0) || 0,
    totalOutstanding: data?.data?.reduce((sum, l) => sum + (Number(l.outstandingPrincipal) || 0), 0) || 0,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loans</h1>
          <p className="text-sm text-slate-600">Manage and track all disbursed loans</p>
        </div>
        <Button onClick={handleExport} disabled={!data?.data?.length} className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <Wallet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalDisbursed)}</p>
            <p className="text-xs text-muted-foreground">Principal amount</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</p>
            <p className="text-xs text-muted-foreground">Balance to collect</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loans Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Loans</CardTitle>
              <CardDescription>View and manage loan portfolio</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LoanStatus | 'ALL')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value={LoanStatus.PENDING_DISBURSEMENT}>Pending Disbursement</SelectItem>
                <SelectItem value={LoanStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={LoanStatus.CLOSED}>Closed</SelectItem>
                <SelectItem value={LoanStatus.WRITTEN_OFF}>Written Off</SelectItem>
                <SelectItem value={LoanStatus.RESTRUCTURED}>Restructured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading loans...</p>
          ) : !data || data.data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No loans found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((loan: Loan) => {
                      const principal = Number(loan.principalAmount) || 0;
                      const outstanding = Number(loan.outstandingPrincipal) || 0;
                      const paid = principal - outstanding;
                      const progress = principal > 0 ? Math.round((paid / principal) * 100) : 0;
                      const statusConfig = STATUS_CONFIG[loan.status];
                      const StatusIcon = statusConfig?.icon || Clock;
                      
                      return (
                        <TableRow key={loan.id}>
                          <TableCell>
                            <span className="font-mono text-sm">{loan.loanNumber}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {loan.client ? `${loan.client.firstName} ${loan.client.lastName}` : loan.clientId}
                              </p>
                              {loan.client?.clientCode && (
                                <p className="text-xs text-slate-500">{loan.client.clientCode}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-emerald-600">{formatCurrency(principal)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="w-32">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>{progress}%</span>
                                <span className="text-slate-500">{formatCurrency(outstanding)}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div 
                                  className={cn(
                                    'h-full rounded-full',
                                    progress === 100 ? 'bg-emerald-500' : 'bg-emerald-400'
                                  )}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(statusConfig?.bg, statusConfig?.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/loans/${loan.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {data.meta.page} of {data.meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.meta.page >= data.meta.totalPages}
                    onClick={() => setPage((p) => (data.meta.totalPages ? Math.min(data.meta.totalPages, p + 1) : p))}
                  >
                    <ChevronRight className="h-4 w-4" />
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
