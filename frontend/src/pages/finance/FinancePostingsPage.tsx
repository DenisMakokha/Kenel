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
  Receipt,
  Search,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { exportCollectionsReport } from '../../lib/exportUtils';
import { repaymentService } from '../../services/repaymentService';
import type { Repayment } from '../../types/repayment';

interface Posting {
  id: string;
  time: string;
  loanNumber: string;
  clientName: string;
  amount: number;
  channel: string;
  referenceNumber?: string;
  status: 'COMPLETED' | 'PENDING' | 'REVERSED';
  postedBy: string;
}

const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  MPESA: { label: 'M-Pesa', color: 'bg-green-100 text-green-700' },
  BANK_TRANSFER: { label: 'Bank Transfer', color: 'bg-blue-100 text-blue-700' },
  CASH: { label: 'Cash', color: 'bg-slate-100 text-slate-700' },
  CHEQUE: { label: 'Cheque', color: 'bg-amber-100 text-amber-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  REVERSED: { label: 'Reversed', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function FinancePostingsPage() {
  const navigate = useNavigate();
  const [postings, setPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadPostings();
  }, [page, channelFilter, dateFilter]);

  const loadPostings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await repaymentService.getAllRepayments({
        dateFrom: dateFilter,
        dateTo: dateFilter,
        page,
        limit: 20,
        search: searchTerm?.trim() ? searchTerm.trim() : undefined,
        channel:
          channelFilter === 'ALL'
            ? undefined
            : channelFilter === 'MPESA'
              ? 'MOBILE_MONEY'
              : (channelFilter as any),
      });

      const mapped: Posting[] = response.data.map((repayment: Repayment) => {
        const dt = new Date(repayment.transactionDate);
        const clientName = repayment.loan?.client
          ? `${repayment.loan.client.firstName} ${repayment.loan.client.lastName}`
          : 'Unknown Client';
        const channel = repayment.channel === 'MOBILE_MONEY' ? 'MPESA' : repayment.channel;
        const status =
          repayment.status === 'APPROVED'
            ? 'COMPLETED'
            : repayment.status === 'REVERSED'
              ? 'REVERSED'
              : 'PENDING';

        return {
          id: repayment.id,
          time: dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
          loanNumber: repayment.loan?.loanNumber || repayment.loanId,
          clientName,
          amount: Number(repayment.amount),
          channel,
          referenceNumber: repayment.reference || repayment.receiptNumber,
          status,
          postedBy: repayment.postedBy,
        };
      });

      setPostings(mapped);
      setTotalPages(response.meta.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load postings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadPostings();
  };

  const filteredPostings = postings;

  const totalAmount = filteredPostings.reduce((sum, p) => sum + p.amount, 0);
  const completedCount = filteredPostings.filter((p) => p.status === 'COMPLETED').length;

  const handleExport = () => {
    const exportData = filteredPostings.map((posting) => ({
      date: dateFilter,
      receiptNumber: posting.referenceNumber || '',
      loanNumber: posting.loanNumber,
      clientName: posting.clientName,
      amount: posting.amount,
      channel: CHANNEL_CONFIG[posting.channel]?.label || posting.channel,
      reference: posting.referenceNumber || '',
      postedBy: posting.postedBy,
    }));
    exportCollectionsReport(exportData, `postings_${dateFilter}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Today's Postings</h1>
          <p className="text-sm text-slate-600">
            View and manage payment postings for {formatDate(dateFilter)}
          </p>
        </div>
        <Button
          onClick={() => navigate('/finance/post-repayment')}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Receipt className="h-4 w-4 mr-2" />
          Post New Payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Posted</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-muted-foreground">Today's collections</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredPostings.length}</p>
            <p className="text-xs text-muted-foreground">Total postings</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Successful postings</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(filteredPostings.length > 0 ? totalAmount / filteredPostings.length : 0)}
            </p>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="border-slate-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by loan number, client, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-40">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              />
            </div>
            <div className="w-full md:w-40">
              <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Channels</SelectItem>
                  <SelectItem value="MPESA">M-Pesa</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Postings Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Payment Postings</CardTitle>
          <CardDescription>
            {filteredPostings.length} posting(s) for {formatDate(dateFilter)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : filteredPostings.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No postings found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Loan / Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPostings.map((posting) => {
                      const channelConfig = CHANNEL_CONFIG[posting.channel] || CHANNEL_CONFIG.CASH;
                      const statusConfig = STATUS_CONFIG[posting.status];
                      const StatusIcon = statusConfig?.icon || CheckCircle;

                      return (
                        <TableRow key={posting.id}>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Clock className="h-3 w-3" />
                              {posting.time}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{posting.clientName}</p>
                              <code className="text-xs text-slate-500">{posting.loanNumber}</code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-emerald-600">
                              {formatCurrency(posting.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('font-medium', channelConfig.color)}>
                              {channelConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                              {posting.referenceNumber || '-'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('font-medium', statusConfig?.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
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
