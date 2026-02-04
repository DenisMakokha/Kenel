import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanApplicationService } from '../services/loanApplicationService';
import {
  LoanApplication,
  LoanApplicationStatus,
  QueryLoanApplicationsDto,
} from '../types/loan-application';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { formatDate, formatCurrency, cn } from '../lib/utils';
import {
  Download,
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  FileClock,
  RotateCcw,
} from 'lucide-react';
import { exportToExcel, exportToPdf } from '../lib/exportUtils';
import { DateRangePicker, DateRange } from '../components/ui/date-range-picker';
import { BulkActionsBar, LOAN_APPLICATION_BULK_ACTIONS } from '../components/ui/bulk-actions';
import { Checkbox } from '../components/ui/checkbox';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/auth';
import { BulkApproveModal, BulkRejectModal } from '../components/ui/bulk-action-modal';

const STATUS_CONFIG: Record<LoanApplicationStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icon: FileText },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: FileClock },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  APPROVED: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  RETURNED: { label: 'Returned', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: RotateCcw },
};

export default function LoanApplicationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanApplicationStatus | ''>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk action modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Stats from backend
  const [stats, setStats] = useState<{
    total: number;
    draft: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    returned: number;
  } | null>(null);

  useEffect(() => {
    loadApplications();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateRange, page]);

  const loadStats = async () => {
    try {
      const data = await loanApplicationService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const params: QueryLoanApplicationsDto = {
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: 20,
      };
      // Clear selection when loading new data
      setSelectedIds(new Set());
      const response = await loanApplicationService.getApplications(params);
      setApplications(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load loan applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadApplications();
  };

  const getStatusBadge = (status: LoanApplicationStatus) => {
    const config = STATUS_CONFIG[status];
    const StatusIcon = config?.icon || FileText;
    return (
      <Badge className={cn('font-medium border', config?.bg, config?.color, config?.border)}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {config?.label}
      </Badge>
    );
  };


  const getExportData = () => {
    const dataToExport = selectedIds.size > 0
      ? applications.filter(app => selectedIds.has(app.id))
      : applications;
    return dataToExport.map((app) => ({
      applicationNumber: app.applicationNumber,
      clientName: `${app.client?.firstName || ''} ${app.client?.lastName || ''}`.trim(),
      requestedAmount: Number(app.requestedAmount || 0),
      status: app.status,
      submittedAt: app.submittedAt || '',
      createdAt: app.createdAt || '',
    }));
  };

  const exportColumns = [
    { key: 'applicationNumber', header: 'Application #' },
    { key: 'clientName', header: 'Client Name' },
    { key: 'requestedAmount', header: 'Requested Amount', formatter: (v: any) => v?.toFixed(2) || '0.00' },
    { key: 'status', header: 'Status' },
    { key: 'submittedAt', header: 'Submitted Date', formatter: (v: any) => v ? formatDate(v) : '' },
    { key: 'createdAt', header: 'Created Date', formatter: (v: any) => v ? formatDate(v) : '' },
  ];

  const handleExportExcel = () => {
    exportToExcel({
      filename: 'loan_applications',
      columns: exportColumns,
      data: getExportData(),
      title: 'Loan Applications',
    });
  };

  const handleExportPdf = () => {
    exportToPdf({
      filename: 'loan_applications',
      columns: exportColumns,
      data: getExportData(),
      title: 'Loan Applications',
    });
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(applications.map(app => app.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async (actionId: string) => {
    if (actionId === 'approve') {
      if (user?.role !== UserRole.ADMIN) {
        toast.error('Not allowed', 'Only Admin can approve applications.');
        return;
      }
      if (selectedIds.size === 0) {
        toast.error('No selection', 'Select at least one application.');
        return;
      }
      setShowApproveModal(true);
      return;
    }

    if (actionId === 'reject') {
      if (user?.role !== UserRole.ADMIN) {
        toast.error('Not allowed', 'Only Admin can reject applications.');
        return;
      }
      if (selectedIds.size === 0) {
        toast.error('No selection', 'Select at least one application.');
        return;
      }
      setShowRejectModal(true);
      return;
    }

    if (actionId === 'export') {
      handleExportExcel();
      return;
    }
  };

  const handleBulkApproveConfirm = async (data: {
    approvedPrincipal: number;
    approvedTermMonths: number;
    approvedInterestRate: number;
    decisionNotes?: string;
  }) => {
    try {
      await loanApplicationService.bulkApprove({
        ids: Array.from(selectedIds),
        ...data,
      });
      toast.success('Done', 'Bulk approve completed.');
      setSelectedIds(new Set());
      await loadApplications();
    } catch (error) {
      toast.error('Action failed', 'Failed to bulk approve. Please try again.');
    }
  };

  const handleBulkRejectConfirm = async (data: { reason: string; notes?: string }) => {
    try {
      await loanApplicationService.bulkReject({
        ids: Array.from(selectedIds),
        ...data,
      });
      toast.success('Done', 'Bulk reject completed.');
      setSelectedIds(new Set());
      await loadApplications();
    } catch (error) {
      toast.error('Action failed', 'Failed to bulk reject. Please try again.');
    }
  };

  const isAllSelected = applications.length > 0 && selectedIds.size === applications.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < applications.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loan Applications</h1>
          <p className="text-sm text-slate-600">Manage loan applications from draft to approval</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={() => navigate('/loan-applications/new')} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FolderKanban className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <FileClock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats?.submitted ?? 0}</p>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats?.underReview ?? 0}</p>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{stats?.approved ?? 0}</p>
            <p className="text-xs text-muted-foreground">Ready for disbursement</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats?.rejected ?? 0}</p>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
            <RotateCcw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{stats?.returned ?? 0}</p>
            <p className="text-xs text-muted-foreground">Needs correction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-100">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by application #, client name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as LoanApplicationStatus | ''); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value={LoanApplicationStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={LoanApplicationStatus.SUBMITTED}>Submitted</SelectItem>
                  <SelectItem value={LoanApplicationStatus.UNDER_REVIEW}>Under Review</SelectItem>
                  <SelectItem value={LoanApplicationStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={LoanApplicationStatus.REJECTED}>Rejected</SelectItem>
                  <SelectItem value={LoanApplicationStatus.RETURNED}>Returned</SelectItem>
                </SelectContent>
              </Select>
              <DateRangePicker
                value={dateRange}
                onChange={(range) => {
                  setDateRange(range);
                  setPage(1);
                }}
              />
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>{total} applications found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No applications found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Application #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow 
                        key={app.id}
                        className={cn(selectedIds.has(app.id) && 'bg-emerald-50')}
                      >
                        <TableCell className="w-[40px]">
                          <Checkbox
                            checked={selectedIds.has(app.id)}
                            onCheckedChange={(checked) => handleSelectRow(app.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{app.applicationNumber}</span>
                        </TableCell>
                        <TableCell>
                          {app.client ? (
                            <div>
                              <p className="font-medium">{app.client.firstName} {app.client.lastName}</p>
                              <p className="text-xs text-slate-500">{app.client.clientCode}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {app.productVersion?.loanProduct ? (
                            <div>
                              <p className="font-medium">{app.productVersion.loanProduct.name}</p>
                              <p className="text-xs text-slate-500">{app.productVersion.loanProduct.code}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-emerald-600">{formatCurrency(Number(app.requestedAmount) || 0)}</span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDate(app.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/loan-applications/${app.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        totalCount={applications.length}
        onSelectAll={() => setSelectedIds(new Set(applications.map(app => app.id)))}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={
          user?.role === UserRole.ADMIN
            ? LOAN_APPLICATION_BULK_ACTIONS
            : LOAN_APPLICATION_BULK_ACTIONS.filter((a) => a.id === 'export')
        }
        onAction={handleBulkAction}
        isAllSelected={isAllSelected}
      />

      {/* Bulk Approve Modal */}
      <BulkApproveModal
        open={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        selectedCount={selectedIds.size}
        onConfirm={handleBulkApproveConfirm}
      />

      {/* Bulk Reject Modal */}
      <BulkRejectModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        selectedCount={selectedIds.size}
        onConfirm={handleBulkRejectConfirm}
      />
    </div>
  );
}
