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
  Users,
  Search,
  Eye,
  Plus,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import type { Client, KycStatus } from '../../types/client';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { exportClientList } from '../../lib/exportUtils';

const KYC_STATUS_CONFIG: Record<KycStatus, { label: string; color: string; icon: any }> = {
  UNVERIFIED: { label: 'Unverified', color: 'bg-slate-100 text-slate-700', icon: Clock },
  PENDING_REVIEW: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  VERIFIED: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function CreditClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [kycFilter, setKycFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadClients();
  }, [page, kycFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getClients({
        page,
        limit: 20,
        kycStatus: kycFilter === 'ALL' ? undefined : kycFilter as KycStatus,
        search: searchTerm || undefined,
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

  const handleSearch = () => {
    setPage(1);
    loadClients();
  };

  const stats = {
    total: total,
    verified: clients.filter(c => c.kycStatus === 'VERIFIED').length,
    pending: clients.filter(c => c.kycStatus === 'PENDING_REVIEW').length,
    unverified: clients.filter(c => c.kycStatus === 'UNVERIFIED').length,
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
    exportClientList(exportData, 'my_clients');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Clients</h1>
          <p className="text-sm text-slate-600">
            Manage your assigned clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => navigate('/clients/new')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
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
            <p className="text-xs text-muted-foreground">Assigned to you</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">KYC Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{stats.verified}</p>
            <p className="text-xs text-muted-foreground">Ready for loans</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Unverified</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.unverified}</p>
            <p className="text-xs text-muted-foreground">Need KYC submission</p>
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
                placeholder="Search by name, ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={kycFilter} onValueChange={(v) => { setKycFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
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

      {/* Clients Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            {total} client(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No clients found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => {
                      const kycConfig = KYC_STATUS_CONFIG[client.kycStatus];
                      const KycIcon = kycConfig?.icon || Clock;
                      return (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-emerald-700 font-semibold text-sm">
                                  {client.firstName?.[0]}{client.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {client.firstName} {client.lastName}
                                </p>
                                <code className="text-xs text-slate-500">{client.clientCode}</code>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {client.phonePrimary}
                              </div>
                              {client.email && (
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Mail className="h-3 w-3" />
                                  {client.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                              {client.idNumber}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('font-medium', kycConfig?.color)}>
                              <KycIcon className="h-3 w-3 mr-1" />
                              {kycConfig?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {formatDate(client.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/clients/${client.id}`)}
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
