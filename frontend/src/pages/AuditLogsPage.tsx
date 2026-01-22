import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
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
import { Button } from '../components/ui/button';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Activity,
  Download,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Banknote,
  RotateCcw,
  Info,
  Eye,
  X,
} from 'lucide-react';
import { auditLogService } from '../services/auditLogService';
import type { AuditLog } from '../types/audit';
import { formatDateTime } from '../lib/utils';
import { cn } from '../lib/utils';
import { exportToCSV } from '../lib/exportUtils';

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CREATE: { label: 'Created', color: 'bg-emerald-100 text-emerald-700', icon: Plus },
  UPDATE: { label: 'Updated', color: 'bg-blue-100 text-blue-700', icon: Edit },
  DELETE: { label: 'Deleted', color: 'bg-red-100 text-red-700', icon: Trash2 },
  APPROVE: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJECT: { label: 'Rejected', color: 'bg-amber-100 text-amber-700', icon: XCircle },
  DISBURSE: { label: 'Disbursed', color: 'bg-purple-100 text-purple-700', icon: Banknote },
  REVERSE: { label: 'Reversed', color: 'bg-orange-100 text-orange-700', icon: RotateCcw },
  LOGIN: { label: 'Logged In', color: 'bg-slate-100 text-slate-700', icon: User },
  LOGOUT: { label: 'Logged Out', color: 'bg-slate-100 text-slate-700', icon: User },
};

const ENTITY_LABELS: Record<string, string> = {
  clients: 'Client',
  loans: 'Loan',
  loan_applications: 'Application',
  repayments: 'Repayment',
  loan_products: 'Product',
  users: 'User',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailsModal, setDetailsModal] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [page, entityFilter, actionFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { page, limit: 20 };
      if (entityFilter !== 'all') {
        params.entity = entityFilter;
      }
      if (actionFilter !== 'all') {
        params.action = actionFilter;
      }
      const response = await auditLogService.getLogs(params);
      setLogs(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = searchTerm
    ? logs.filter(
        (log) =>
          log.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.entityId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : logs;

  const getChangeSummary = (log: AuditLog): string => {
    if (log.action === 'CREATE') return 'New record created';
    if (log.action === 'DELETE') return 'Record deleted';
    
    if (log.oldValue && log.newValue) {
      const changes: string[] = [];
      const oldObj = typeof log.oldValue === 'string' ? JSON.parse(log.oldValue) : log.oldValue;
      const newObj = typeof log.newValue === 'string' ? JSON.parse(log.newValue) : log.newValue;
      
      for (const key of Object.keys(newObj)) {
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
          changes.push(key);
        }
      }
      
      if (changes.length === 0) return 'No changes detected';
      if (changes.length === 1) return `Changed ${changes[0]}`;
      if (changes.length <= 3) return `Changed ${changes.join(', ')}`;
      return `Changed ${changes.length} fields`;
    }
    
    return '—';
  };

  const handleExport = () => {
    const exportData = filteredLogs.map((log) => ({
      timestamp: formatDateTime(log.createdAt),
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown',
      email: log.user?.email || '',
      action: ACTION_CONFIG[log.action]?.label || log.action,
      entity: ENTITY_LABELS[log.entity] || log.entity,
      entityId: log.entityId,
      changes: getChangeSummary(log),
      ipAddress: log.ipAddress || '',
    }));

    exportToCSV({
      filename: `audit_logs_${new Date().toISOString().split('T')[0]}`,
      columns: [
        { key: 'timestamp', header: 'Timestamp' },
        { key: 'user', header: 'User' },
        { key: 'email', header: 'Email' },
        { key: 'action', header: 'Action' },
        { key: 'entity', header: 'Entity' },
        { key: 'entityId', header: 'Entity ID' },
        { key: 'changes', header: 'Changes' },
        { key: 'ipAddress', header: 'IP Address' },
      ],
      data: exportData,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-600">
            Track all system activities and changes for compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Activity className="h-4 w-4" />
            <span>{total.toLocaleString()} total events</span>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by user, entity ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Created</SelectItem>
                <SelectItem value="UPDATE">Updated</SelectItem>
                <SelectItem value="DELETE">Deleted</SelectItem>
                <SelectItem value="APPROVE">Approved</SelectItem>
                <SelectItem value="REJECT">Rejected</SelectItem>
                <SelectItem value="DISBURSE">Disbursed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="clients">Clients</SelectItem>
                <SelectItem value="loans">Loans</SelectItem>
                <SelectItem value="loan_applications">Applications</SelectItem>
                <SelectItem value="repayments">Repayments</SelectItem>
                <SelectItem value="loan_products">Products</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {total} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading audit logs...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No audit logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-600 whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">
                              {log.user?.firstName} {log.user?.lastName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {log.user?.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const config = ACTION_CONFIG[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-700', icon: Info };
                          const Icon = config.icon;
                          return (
                            <Badge className={cn('font-medium gap-1', config.color)}>
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-700">
                            {ENTITY_LABELS[log.entity] || log.entity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code 
                          className="text-xs bg-slate-100 px-2 py-1 rounded font-mono cursor-pointer hover:bg-slate-200"
                          title={log.entityId}
                          onClick={() => navigator.clipboard.writeText(log.entityId)}
                        >
                          {log.entityId.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600 max-w-[150px] truncate block" title={getChangeSummary(log)}>
                          {getChangeSummary(log)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {log.ipAddress || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailsModal(log)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setDetailsModal(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-slate-900">Audit Log Details</h3>
              <button
                onClick={() => setDetailsModal(null)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Timestamp</p>
                  <p className="text-sm font-medium">{formatDateTime(detailsModal.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Action</p>
                  <Badge className={cn('font-medium', ACTION_CONFIG[detailsModal.action]?.color || 'bg-slate-100')}>
                    {ACTION_CONFIG[detailsModal.action]?.label || detailsModal.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">User</p>
                  <p className="text-sm font-medium">
                    {detailsModal.user?.firstName} {detailsModal.user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{detailsModal.user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">IP Address</p>
                  <p className="text-sm font-medium">{detailsModal.ipAddress || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Entity</p>
                  <p className="text-sm font-medium">{ENTITY_LABELS[detailsModal.entity] || detailsModal.entity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Entity ID</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono block mt-1">
                    {detailsModal.entityId}
                  </code>
                </div>
              </div>

              {(detailsModal.oldValue || detailsModal.newValue) && (
                <div className="border-t pt-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Changes</p>
                  <div className="grid grid-cols-2 gap-4">
                    {detailsModal.oldValue && (
                      <div>
                        <p className="text-xs font-medium text-red-600 mb-1">Before</p>
                        <pre className="text-xs bg-red-50 p-3 rounded overflow-x-auto max-h-48">
                          {JSON.stringify(
                            typeof detailsModal.oldValue === 'string' 
                              ? JSON.parse(detailsModal.oldValue) 
                              : detailsModal.oldValue,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                    {detailsModal.newValue && (
                      <div>
                        <p className="text-xs font-medium text-green-600 mb-1">After</p>
                        <pre className="text-xs bg-green-50 p-3 rounded overflow-x-auto max-h-48">
                          {JSON.stringify(
                            typeof detailsModal.newValue === 'string' 
                              ? JSON.parse(detailsModal.newValue) 
                              : detailsModal.newValue,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailsModal.userAgent && (
                <div className="border-t pt-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">User Agent</p>
                  <p className="text-xs text-slate-600 break-all">{detailsModal.userAgent}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t">
              <Button variant="outline" onClick={() => setDetailsModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
