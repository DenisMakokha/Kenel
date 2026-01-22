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
  User,
  Calendar,
  ArrowRight,
  Plus,
  Download,
} from 'lucide-react';
import { loanApplicationService } from '../../services/loanApplicationService';
import type { LoanApplication } from '../../types/loan-application';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { exportToExcel } from '../../lib/exportUtils';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  DISBURSED: { label: 'Disbursed', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
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

  // Group by status for pipeline view
  const pipelineStages = [
    { key: 'DRAFT', label: 'Draft', items: filteredApplications.filter(a => a.status === 'DRAFT') },
    { key: 'SUBMITTED', label: 'Submitted', items: filteredApplications.filter(a => a.status === 'SUBMITTED') },
    { key: 'UNDER_REVIEW', label: 'Under Review', items: filteredApplications.filter(a => a.status === 'UNDER_REVIEW') },
    { key: 'APPROVED', label: 'Approved', items: filteredApplications.filter(a => a.status === 'APPROVED') },
  ];

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
        { key: 'status', header: 'Status', formatter: (v) => STATUS_CONFIG[v]?.label || v },
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
    <div className="max-w-7xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Pipeline</h1>
          <p className="text-sm text-slate-600">
            Track and manage your loan applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => navigate('/loan-applications/new')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FolderKanban className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">In your pipeline</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Ready for disbursement</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Pipeline Kanban View */}
      <div className="grid gap-4 md:grid-cols-4">
        {pipelineStages.map((stage) => {
          const config = STATUS_CONFIG[stage.key];
          const StageIcon = config?.icon || FileText;
          return (
            <Card key={stage.key} className="border-slate-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <StageIcon className="h-4 w-4" />
                    {stage.label}
                  </CardTitle>
                  <Badge variant="outline">{stage.items.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                ) : stage.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No applications</p>
                ) : (
                  stage.items.slice(0, 5).map((app) => (
                    <div
                      key={app.id}
                      onClick={() => navigate(`/loan-applications/${app.id}`)}
                      className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <code className="text-xs font-mono text-slate-600">
                          {app.applicationNumber}
                        </code>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </div>
                      <p className="font-medium text-sm mb-1">
                        {app.client?.firstName} {app.client?.lastName}
                      </p>
                      <p className="text-sm text-emerald-600 font-semibold">
                        {formatCurrency(Number(app.requestedAmount))}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDate(app.createdAt)}
                      </p>
                    </div>
                  ))
                )}
                {stage.items.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate('/loan-applications')}
                  >
                    View all {stage.items.length} applications
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Applications Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>
            Your latest loan applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.slice(0, 10).map((app) => {
                    const statusConfig = STATUS_CONFIG[app.status];
                    const StatusIcon = statusConfig?.icon || FileText;
                    return (
                      <TableRow key={app.id}>
                        <TableCell>
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                            {app.applicationNumber}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {app.client?.firstName} {app.client?.lastName}
                              </p>
                              <p className="text-xs text-slate-500">{app.client?.clientCode}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(Number(app.requestedAmount))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('font-medium', statusConfig?.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Calendar className="h-3 w-3" />
                            {formatDate(app.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/loan-applications/${app.id}`)}
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
