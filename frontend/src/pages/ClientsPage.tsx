import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { Client, KycStatus, RiskRating } from '../types/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
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
import { formatDate, cn } from '../lib/utils';
import {
  Download,
  Plus,
  Search,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { exportClientList } from '../lib/exportUtils';

const KYC_STATUS_CONFIG: Record<KycStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  UNVERIFIED: { label: 'Unverified', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icon: Clock },
  PENDING_REVIEW: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  VERIFIED: { label: 'Verified', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  RETURNED: { label: 'Returned', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: RotateCcw },
};

const RISK_CONFIG: Record<RiskRating, { label: string; color: string; bg: string; border: string }> = {
  LOW: { label: 'Low', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  MEDIUM: { label: 'Medium', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  HIGH: { label: 'High', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<KycStatus | ''>('');
  const [riskFilter, setRiskFilter] = useState<RiskRating | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadClients();
  }, [search, kycFilter, riskFilter, page]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await clientService.getClients({
        search: search || undefined,
        kycStatus: kycFilter || undefined,
        riskRating: riskFilter || undefined,
        page,
        limit: 20,
      });
      setClients(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const getKycBadge = (status: KycStatus) => {
    const statusKey = typeof status === 'string' ? status.toUpperCase() : status;
    const normalizedStatus = (statusKey as any) === 'RETURNED_TO_CLIENT' ? 'RETURNED' : statusKey;
    const config = (KYC_STATUS_CONFIG as any)[normalizedStatus];
    const StatusIcon = config?.icon || Clock;
    return (
      <Badge className={cn('font-medium border', config?.bg, config?.color, config?.border)}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {config?.label || (typeof normalizedStatus === 'string' ? normalizedStatus.replace(/_/g, ' ') : String(normalizedStatus))}
      </Badge>
    );
  };

  const getRiskBadge = (rating?: RiskRating) => {
    if (!rating) return <span className="text-slate-400">—</span>;
    const config = RISK_CONFIG[rating];
    return (
      <Badge className={cn('font-medium border', config?.bg, config?.color, config?.border)}>
        {config?.label}
      </Badge>
    );
  };

  const handleExport = () => {
    const exportData = clients.map((client) => ({
      clientCode: client.clientCode,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || '',
      phone: client.phonePrimary || '',
      nationalId: (client as any).nationalId || '',
      kycStatus: client.kycStatus,
      riskRating: client.riskRating || '',
      createdAt: client.createdAt || '',
    }));
    exportClientList(exportData, 'clients_list');
  };

  // Calculate stats
  const stats = {
    total: total,
    verified: clients.filter(c => c.kycStatus === 'VERIFIED').length,
    pending: clients.filter(c => c.kycStatus === 'PENDING_REVIEW').length,
    highRisk: clients.filter(c => c.riskRating === 'HIGH').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-600">Manage client profiles and KYC verification</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/clients/new')} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{stats.verified}</p>
            <p className="text-xs text-muted-foreground">KYC complete</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.highRisk}</p>
            <p className="text-xs text-muted-foreground">Needs attention</p>
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
              <CardTitle>Client Directory</CardTitle>
              <CardDescription>{total} clients registered</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-[180px]"
                />
              </div>
              <Select value={kycFilter} onValueChange={(v) => { setKycFilter(v as KycStatus | ''); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All KYC</SelectItem>
                  <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v as RiskRating | ''); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Risk</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading clients...</p>
          ) : clients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No clients found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Loans</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.firstName} {client.lastName}</p>
                            <p className="text-xs text-slate-500">{client.clientCode}</p>
                          </div>
                        </TableCell>
                        <TableCell>{client.phonePrimary}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{client.idNumber}</span>
                        </TableCell>
                        <TableCell>{getKycBadge(client.kycStatus)}</TableCell>
                        <TableCell>{getRiskBadge(client.riskRating)}</TableCell>
                        <TableCell>{client._count?.loans || 0}</TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDate(client.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/clients/${client.id}`)}
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
    </div>
  );
}
