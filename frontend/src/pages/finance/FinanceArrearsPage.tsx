import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  AlertTriangle,
  Search,
  Eye,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { loanService } from '../../services/loanService';
import { reportService } from '../../services/reportService';
import { LoanStatus } from '../../types/loan';
import type { Loan } from '../../types/loan';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { exportArrearsReport, exportToCSV } from '../../lib/exportUtils';
import { Progress } from '../../components/ui/progress';

interface AgingBucket {
  bucket: string;
  count: number;
  amount: number;
}

export default function FinanceArrearsPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bucketFilter, setBucketFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [agingBuckets, setAgingBuckets] = useState<AgingBucket[]>([]);

  useEffect(() => {
    loadData();
  }, [bucketFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const today = new Date().toISOString().slice(0, 10);

      const [loansResponse, agingSummary] = await Promise.all([
        loanService.getLoans({ status: LoanStatus.IN_ARREARS, search: searchTerm.trim() || undefined, page: 1, limit: 1000 }),
        reportService.getAgingSummary({ asOfDate: today }),
      ]);

      setLoans(loansResponse.data);
      setPage(1);

      // Transform aging buckets
      const buckets: AgingBucket[] = agingSummary.buckets.map((b) => ({
        bucket: b.bucketLabel,
        count: b.loansInBucket,
        amount: Number(b.principalOutstanding || 0),
      }));
      setAgingBuckets(buckets);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load arrears data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const getMaxDaysPastDue = (loan: Loan): number => {
    if (!loan.schedules || loan.schedules.length === 0) return 0;
    return Math.max(...loan.schedules.filter((s) => s.isOverdue).map((s) => s.daysPastDue || 0), 0);
  };

  const getBucketForDays = (days: number): string => {
    if (days <= 0) return '0';
    if (days <= 30) return '1-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    return '90+';
  };

  const getDaysColor = (days: number): string => {
    if (days <= 30) return 'bg-amber-100 text-amber-700';
    if (days <= 60) return 'bg-orange-100 text-orange-700';
    if (days <= 90) return 'bg-red-100 text-red-700';
    return 'bg-red-200 text-red-800';
  };

  const totalArrears = agingBuckets.reduce((sum, b) => sum + b.amount, 0);
  const totalLoansInArrears = agingBuckets.reduce((sum, b) => sum + b.count, 0);

  const filteredLoans = loans.filter((loan) => {
    if (bucketFilter === 'ALL') return true;
    const days = getMaxDaysPastDue(loan);
    const bucketKey = getBucketForDays(days);
    return bucketFilter.includes(bucketKey) || bucketFilter === bucketKey;
  });

  const pageSize = 20;
  const pagedLoans = filteredLoans.slice((page - 1) * pageSize, page * pageSize);
  const computedTotalPages = Math.ceil(filteredLoans.length / pageSize) || 1;

  useEffect(() => {
    setTotalPages(computedTotalPages);
    if (page > computedTotalPages) {
      setPage(computedTotalPages);
    }
  }, [computedTotalPages, page]);

  const handleExportExcel = () => {
    const exportData = filteredLoans.map((loan) => {
      const daysPastDue = getMaxDaysPastDue(loan);
      const overdueSchedules = loan.schedules?.filter((s) => s.isOverdue) || [];
      const arrearsAmount = overdueSchedules.reduce(
        (sum, s) => sum + Number(s.principalDue || 0) + Number(s.interestDue || 0),
        0
      );
      return {
        loanNumber: loan.loanNumber,
        clientName: `${loan.client?.firstName || ''} ${loan.client?.lastName || ''}`.trim(),
        clientPhone: (loan.client as any)?.phonePrimary || (loan.client as any)?.phone || '',
        product: (loan as any).product?.name || '',
        outstandingBalance: Number(loan.outstandingPrincipal || 0),
        arrearsAmount,
        daysInArrears: daysPastDue,
        lastPaymentDate: loan.lastPaymentDate || '',
        nextDueDate: (loan as any).nextDueDate || '',
        assignedOfficer: (loan as any).creditOfficer?.firstName || '',
      };
    });
    exportArrearsReport(exportData, 'arrears_report');
  };

  const handleExportCSV = () => {
    const exportData = filteredLoans.map((loan) => {
      const daysPastDue = getMaxDaysPastDue(loan);
      const overdueSchedules = loan.schedules?.filter((s) => s.isOverdue) || [];
      const arrearsAmount = overdueSchedules.reduce(
        (sum, s) => sum + Number(s.principalDue || 0) + Number(s.interestDue || 0),
        0
      );
      return {
        loanNumber: loan.loanNumber,
        clientName: `${loan.client?.firstName || ''} ${loan.client?.lastName || ''}`.trim(),
        clientPhone: (loan.client as any)?.phonePrimary || (loan.client as any)?.phone || '',
        outstandingBalance: Number(loan.outstandingPrincipal || 0),
        arrearsAmount,
        daysInArrears: daysPastDue,
        lastPaymentDate: loan.lastPaymentDate || '',
      };
    });
    exportToCSV({
      filename: 'arrears_report',
      columns: [
        { key: 'loanNumber', header: 'Loan Number' },
        { key: 'clientName', header: 'Client Name' },
        { key: 'clientPhone', header: 'Phone' },
        { key: 'outstandingBalance', header: 'Outstanding', formatter: (v) => v?.toFixed(2) || '0.00' },
        { key: 'arrearsAmount', header: 'Arrears Amount', formatter: (v) => v?.toFixed(2) || '0.00' },
        { key: 'daysInArrears', header: 'Days in Arrears' },
        { key: 'lastPaymentDate', header: 'Last Payment', formatter: (v) => v ? formatDate(v) : 'Never' },
      ],
      data: exportData,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Arrears Management</h1>
          <p className="text-sm text-slate-600">
            Monitor and follow up on overdue loans
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total in Arrears</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalArrears)}</p>
            <p className="text-xs text-muted-foreground">Outstanding principal</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Loans in Arrears</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLoansInArrears}</p>
            <p className="text-xs text-muted-foreground">Accounts overdue</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">PAR 30+</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {agingBuckets.filter((b) => !b.bucket.includes('1-30')).reduce((sum, b) => sum + b.count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Loans 30+ days overdue</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">PAR 90+</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {agingBuckets.filter((b) => b.bucket.includes('90')).reduce((sum, b) => sum + b.count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Critical arrears</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Aging Buckets */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Aging Breakdown</CardTitle>
          <CardDescription>Distribution by days past due</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {agingBuckets.map((bucket) => {
              const maxCount = Math.max(...agingBuckets.map(b => b.count), 1);
              const percentage = (bucket.count / maxCount) * 100;
              const isSelected = bucketFilter === bucket.bucket;
              const severity = bucket.bucket.includes('90') ? 'red' : 
                              bucket.bucket.includes('60') ? 'orange' : 
                              bucket.bucket.includes('30') ? 'amber' : 'emerald';
              
              return (
                <div
                  key={bucket.bucket}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    isSelected 
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200" 
                      : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  )}
                  onClick={() => setBucketFilter(isSelected ? 'ALL' : bucket.bucket)}
                >
                  <p className="text-xs font-medium text-slate-500 mb-1">{bucket.bucket}</p>
                  <p className="text-lg font-bold">{bucket.count} loans</p>
                  <p className="text-sm text-slate-600 mb-2">{formatCurrency(bucket.amount)}</p>
                  <Progress 
                    value={percentage} 
                    className={cn(
                      "h-1.5",
                      severity === 'red' && "[&>div]:bg-red-500",
                      severity === 'orange' && "[&>div]:bg-orange-500",
                      severity === 'amber' && "[&>div]:bg-amber-500",
                      severity === 'emerald' && "[&>div]:bg-emerald-500"
                    )}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-slate-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by loan number or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={bucketFilter} onValueChange={(v) => { setBucketFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Aging Bucket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Buckets</SelectItem>
                  {agingBuckets.map((b) => (
                    <SelectItem key={b.bucket} value={b.bucket}>{b.bucket}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Arrears Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Loans in Arrears</CardTitle>
          <CardDescription>
            {filteredLoans.length} loan(s) requiring follow-up
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No loans in arrears</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan / Client</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Arrears Amount</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedLoans.map((loan) => {
                      const daysPastDue = getMaxDaysPastDue(loan);
                      const overdueSchedules = loan.schedules?.filter((s) => s.isOverdue) || [];
                      const arrearsAmount = overdueSchedules.reduce(
                        (sum, s) => sum + Number(s.principalDue || 0) + Number(s.interestDue || 0),
                        0,
                      );

                      return (
                        <TableRow key={loan.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {loan.client?.firstName} {loan.client?.lastName}
                              </p>
                              <code className="text-xs text-slate-500">{loan.loanNumber}</code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('font-medium', getDaysColor(daysPastDue))}>
                              <Clock className="h-3 w-3 mr-1" />
                              {daysPastDue} days
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              {formatCurrency(Number(loan.outstandingPrincipal || 0))}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(arrearsAmount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {loan.lastPaymentDate ? formatDate(loan.lastPaymentDate) : 'No payments'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/loans/${loan.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Call client">
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Send SMS">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
