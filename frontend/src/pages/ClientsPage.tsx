import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { Client, KycStatus, RiskRating } from '../types/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { formatDate } from '../lib/utils';
import { Download } from 'lucide-react';
import { exportClientList } from '../lib/exportUtils';

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
    const variants = {
      UNVERIFIED: 'outline',
      PENDING_REVIEW: 'warning',
      VERIFIED: 'success',
      REJECTED: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getRiskBadge = (rating?: RiskRating) => {
    if (!rating) return <span className="text-muted-foreground">-</span>;

    const variants = {
      LOW: 'success',
      MEDIUM: 'warning',
      HIGH: 'destructive',
    } as const;

    return <Badge variant={variants[rating]}>{rating}</Badge>;
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

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage client profiles and KYC verification
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/clients/new')}>
            Add New Client
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-100 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name, code, phone, or ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={kycFilter}
                onChange={(e) => {
                  setKycFilter(e.target.value as KycStatus | '');
                  setPage(1);
                }}
              >
                <option value="">All KYC Status</option>
                <option value="UNVERIFIED">Unverified</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value as RiskRating | '');
                  setPage(1);
                }}
              >
                <option value="">All Risk Ratings</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-slate-100 bg-white shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Client List</CardTitle>
            <span className="text-sm text-muted-foreground">
              {total} total clients
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clients found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Risk Rating</TableHead>
                    <TableHead>Loans</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-mono font-medium">
                        {client.clientCode}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {client.firstName} {client.lastName}
                          </div>
                          {client.otherNames && (
                            <div className="text-sm text-muted-foreground">
                              {client.otherNames}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{client.phonePrimary}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {client.idNumber}
                      </TableCell>
                      <TableCell>{getKycBadge(client.kycStatus)}</TableCell>
                      <TableCell>{getRiskBadge(client.riskRating)}</TableCell>
                      <TableCell>
                        {client._count?.loans || 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(client.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
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
    </div>
  );
}
