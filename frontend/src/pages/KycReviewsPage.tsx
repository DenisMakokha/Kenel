import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import {
  ClipboardCheck,
  Search,
  User,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clientService } from '../services/clientService';
import type { Client, KycStatus } from '../types/client';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const KYC_STATUS_CONFIG: Record<KycStatus, { label: string; color: string; icon: any }> = {
  UNVERIFIED: { label: 'Unverified', color: 'bg-slate-100 text-slate-700', icon: Clock },
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  VERIFIED: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function KycReviewsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Review dialog state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClients();
  }, [page, statusFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await clientService.getClients({
        page,
        limit: 20,
        kycStatus: statusFilter === 'ALL' ? undefined : statusFilter as KycStatus,
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

  const handleReview = (client: Client, action: 'approve' | 'reject') => {
    setSelectedClient(client);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedClient) return;

    try {
      setSubmitting(true);
      if (reviewAction === 'approve') {
        await clientService.approveKyc(selectedClient.id, { notes: reviewNotes || undefined });
      } else {
        await clientService.rejectKyc(selectedClient.id, { reason: reviewNotes || 'KYC verification failed' });
      }
      setShowReviewDialog(false);
      setSelectedClient(null);
      loadClients();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats are calculated from the total count returned by the API when filtering by status

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KYC Reviews</h1>
          <p className="text-sm text-slate-600">
            Review and verify client KYC documents
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{total}</p>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Verified Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">—</p>
            <p className="text-xs text-muted-foreground">Not available</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">—</p>
            <p className="text-xs text-muted-foreground">Not available</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Review Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Hours to complete</p>
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
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

      {/* Reviews Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>KYC Review Queue</CardTitle>
          <CardDescription>
            {total} client(s) matching current filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Loading clients...
            </p>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No clients pending KYC review
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => {
                      const statusConfig = KYC_STATUS_CONFIG[client.kycStatus];
                      const StatusIcon = statusConfig?.icon || Clock;
                      const docCount = client.documents?.length || 0;
                      
                      return (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-slate-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {client.firstName} {client.lastName}
                                </p>
                                <p className="text-xs text-slate-500">{client.clientCode}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                              {client.idNumber}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-slate-400" />
                              <span className="text-sm">
                                {docCount} document{docCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('font-medium', statusConfig?.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(client.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/clients/${client.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {client.kycStatus === 'PENDING_REVIEW' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReview(client, 'approve')}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReview(client, 'reject')}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
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

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve KYC' : 'Reject KYC'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? 'Confirm that all KYC documents have been verified.'
                : 'Provide a reason for rejecting this KYC application.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedClient && (
              <div className={cn(
                'rounded-lg p-4 space-y-2',
                reviewAction === 'approve' ? 'bg-emerald-50' : 'bg-red-50'
              )}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Client:</span>
                  <span className="font-medium">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">ID Number:</span>
                  <span className="font-mono">{selectedClient.idNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Documents:</span>
                  <span>{selectedClient.documents?.length || 0} uploaded</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">
                {reviewAction === 'approve' ? 'Notes (Optional)' : 'Rejection Reason *'}
              </Label>
              <Input
                id="notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Any additional notes...'
                    : 'e.g., ID document expired, photo unclear...'
                }
              />
            </div>

            {reviewAction === 'approve' && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="text-sm text-emerald-800">
                    <p className="font-medium">Verification Checklist</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>✓ ID document is valid and not expired</li>
                      <li>✓ Photo matches the ID document</li>
                      <li>✓ All required documents are uploaded</li>
                      <li>✓ Information matches application data</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting || (reviewAction === 'reject' && !reviewNotes)}
              className={reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {submitting
                ? 'Processing...'
                : reviewAction === 'approve'
                ? 'Confirm Approval'
                : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
