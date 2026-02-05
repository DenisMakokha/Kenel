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
  FolderKanban,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  RotateCcw,
  Plus,
  Download,
} from 'lucide-react';
import { loanApplicationService } from '../../services/loanApplicationService';
import type { LoanApplication } from '../../types/loan-application';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { exportToExcel } from '../../lib/exportUtils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icon: FileText },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  APPROVED: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  RETURNED: { label: 'Returned', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: RotateCcw },
  DISBURSED: { label: 'Disbursed', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: CheckCircle },
};

export default function CreditPipelinePage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await loanApplicationService.getApplications({
        page: 1,
        limit: 100,
      });
      setApplications(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = searchTerm
    ? applications.filter(
        (app) =>
          app.applicationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.client?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.client?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : applications;

  const stats = {
    total: applications.length,
    pending: applications.filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length,
    approved: applications.filter(a => a.status === 'APPROVED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  };

  const handleExport = () => {
    exportToExcel({
      filename: 'pipeline_applications',
      columns: [
        { key: 'applicationNumber', header: 'Application #' },
        { key: 'clientName', header: 'Client Name' },
        { key: 'product', header: 'Product' },
        { key: 'requestedAmount', header: 'Requested Amount', formatter: (v) => v?.toFixed(2) || '0.00' },
        { key: 'status', header: 'Status', formatter: (v) => {
          const statusKey = typeof v === 'string' ? v.toUpperCase() : v;
          const normalizedStatus = statusKey === 'RETURNED_TO_CLIENT' ? 'RETURNED' : statusKey;
          return STATUS_CONFIG[normalizedStatus]?.label || (typeof normalizedStatus === 'string' ? normalizedStatus.replace(/_/g, ' ') : String(normalizedStatus));
        } },
        { key: 'submittedDate', header: 'Submitted Date', formatter: (v) => v ? formatDate(v) : '' },
        { key: 'createdAt', header: 'Created Date', formatter: (v) => v ? formatDate(v) : '' },
      ],
      data: filteredApplications.map((app) => ({
        applicationNumber: app.applicationNumber,
        clientName: `${app.client?.firstName || ''} ${app.client?.lastName || ''}`.trim(),
        product: (app as any).product?.name || '',
        requestedAmount: Number(app.requestedAmount || 0),
        status: app.status,
        submittedDate: app.submittedAt || '',
        createdAt: app.createdAt || '',
      })),
      title: 'Pipeline Applications',
      subtitle: `Exported on ${formatDate(new Date())}`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Pipeline</h1>
          <p className="text-sm text-slate-600">Track loan applications through each stage</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/loan-applications/new')} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FolderKanban className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Applications</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Ready</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Applications</CardTitle>
              <CardDescription>{filteredApplications.length} applications</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading applications...</p>
          ) : filteredApplications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No applications found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.slice(0, 10).map((app) => {
                    const rawStatus = (app as any).status;
                    const statusKey = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : rawStatus;
                    const normalizedStatus = statusKey === 'RETURNED_TO_CLIENT' ? 'RETURNED' : statusKey;
                    const statusConfig = (STATUS_CONFIG as any)[normalizedStatus];
                    const StatusIcon = statusConfig?.icon || FileText;
                    const statusLabel = statusConfig?.label || (typeof normalizedStatus === 'string' ? normalizedStatus.replace(/_/g, ' ') : String(normalizedStatus));
                    return (
                      <TableRow key={app.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell>
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {app.applicationNumber}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                              {app.client?.firstName?.[0]}{app.client?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-slate-900">
                                {app.client?.firstName} {app.client?.lastName}
                              </p>
                              <p className="text-xs text-slate-500">{app.client?.clientCode}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(Number(app.requestedAmount))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('font-medium border', statusConfig?.bg, statusConfig?.color, statusConfig?.border)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDate(app.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/loan-applications/${app.id}`)}
                            className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                          >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
