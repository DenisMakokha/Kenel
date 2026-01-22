import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanApplicationService } from '../services/loanApplicationService';
import {
  LoanApplication,
  LoanApplicationStatus,
  QueryLoanApplicationsDto,
} from '../types/loan-application';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { formatDate } from '../lib/utils';
import { Download, FileText } from 'lucide-react';
import { exportToExcel, exportToPdf } from '../lib/exportUtils';
import { DateRangePicker, DateRange } from '../components/ui/date-range-picker';
import { BulkActionsBar, LOAN_APPLICATION_BULK_ACTIONS } from '../components/ui/bulk-actions';
import { Checkbox } from '../components/ui/checkbox';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/auth';
import { BulkApproveModal, BulkRejectModal } from '../components/ui/bulk-action-modal';

const STATUS_OPTIONS: { value: '' | LoanApplicationStatus; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: LoanApplicationStatus.DRAFT, label: 'Draft' },
  { value: LoanApplicationStatus.SUBMITTED, label: 'Submitted' },
  { value: LoanApplicationStatus.UNDER_REVIEW, label: 'Under Review' },
  { value: LoanApplicationStatus.APPROVED, label: 'Approved' },
  { value: LoanApplicationStatus.REJECTED, label: 'Rejected' },
];

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

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateRange, page]);

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
    const variants: Record<LoanApplicationStatus, any> = {
      DRAFT: 'outline',
      SUBMITTED: 'warning',
      UNDER_REVIEW: 'secondary',
      APPROVED: 'success',
      REJECTED: 'destructive',
    };

    const labels: Record<LoanApplicationStatus, string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Loan Applications</h1>
          <p className="text-muted-foreground">
            Manage the lifecycle of loan applications from draft to approval
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={() => navigate('/loan-applications/new')}>+ New Application</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by application #, client name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="h-10 px-3 rounded-md border border-input bg-background"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as LoanApplicationStatus | '');
                  setPage(1);
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <DateRangePicker
                value={dateRange}
                onChange={(range) => {
                  setDateRange(range);
                  setPage(1);
                }}
              />
              <Button type="submit">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Applications</CardTitle>
            <span className="text-sm text-muted-foreground">{total} total</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No applications found</div>
          ) : (
            <>
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
                    <TableHead>Requested</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow 
                      key={app.id}
                      className={selectedIds.has(app.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
                    >
                      <TableCell className="w-[40px]">
                        <Checkbox
                          checked={selectedIds.has(app.id)}
                          onCheckedChange={(checked) => handleSelectRow(app.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{app.applicationNumber}</TableCell>
                      <TableCell>
                        {app.client ? (
                          <div>
                            <div className="font-medium">
                              {app.client.firstName} {app.client.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {app.client.clientCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.productVersion?.loanProduct ? (
                          <div>
                            <div className="font-medium">
                              {app.productVersion.loanProduct.name}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {app.productVersion.loanProduct.code} v{app.productVersion.versionNumber}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {app.requestedAmount} / {app.requestedTermMonths}m
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(app.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/loan-applications/${app.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
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
