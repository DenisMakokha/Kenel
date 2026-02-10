import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { openAuthenticatedFile } from '../lib/api';
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
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react';
import { clientService } from '../services/clientService';
import type { Client, KycStatus } from '../types/client';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const KYC_STATUS_CONFIG: Record<KycStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  UNVERIFIED: { label: 'Unverified', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icon: Clock },
  PENDING_REVIEW: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  VERIFIED: { label: 'Verified', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  RETURNED: { label: 'Returned', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: RotateCcw },
};

interface ReturnedItem {
  type: 'document' | 'field';
  documentType?: string;
  field?: string;
  message: string;
}

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

  // KYC Stats
  const [kycStats, setKycStats] = useState<{ pendingReview: number; verifiedToday: number; rejectedToday: number; totalUnverified: number; totalRejected: number; totalReturned: number } | null>(null);

  // Review dialog state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Return to client dialog state
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnedItems, setReturnedItems] = useState<ReturnedItem[]>([]);
  const [newItemType, setNewItemType] = useState<'document' | 'field'>('document');
  const [newItemDocType, setNewItemDocType] = useState('');
  const [newItemField, setNewItemField] = useState('');
  const [newItemMessage, setNewItemMessage] = useState('');

  useEffect(() => {
    loadClients();
    loadKycStats();
  }, [page, statusFilter]);

  const loadKycStats = async () => {
    try {
      const stats = await clientService.getKycStats();
      setKycStats(stats);
    } catch (err) {
      console.error('Failed to load KYC stats', err);
    }
  };

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

  const handleReview = async (client: Client, action: 'approve' | 'reject') => {
    setSelectedClient(client);
    setReviewAction(action);
    setReviewNotes('');
    setClientDocuments([]);
    setShowReviewDialog(true);
    
    // Load client documents
    try {
      setLoadingDocs(true);
      const docs = await clientService.getDocuments(client.id);
      setClientDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleReturnToClient = async (client: Client) => {
    setSelectedClient(client);
    setReturnReason('');
    setReturnedItems([]);
    setClientDocuments([]);
    setShowReturnDialog(true);
    
    // Load client documents for reference
    try {
      setLoadingDocs(true);
      const docs = await clientService.getDocuments(client.id);
      setClientDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleAddReturnItem = () => {
    if (!newItemMessage) return;
    const item: ReturnedItem = {
      type: newItemType,
      message: newItemMessage,
      ...(newItemType === 'document' && newItemDocType ? { documentType: newItemDocType } : {}),
      ...(newItemType === 'field' && newItemField ? { field: newItemField } : {}),
    };
    setReturnedItems([...returnedItems, item]);
    setNewItemMessage('');
    setNewItemDocType('');
    setNewItemField('');
  };

  const handleRemoveReturnItem = (index: number) => {
    setReturnedItems(returnedItems.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = async () => {
    if (!selectedClient || !returnReason || returnedItems.length === 0) return;

    try {
      setSubmitting(true);
      await clientService.returnKyc(selectedClient.id, { reason: returnReason, returnedItems });
      setShowReturnDialog(false);
      setSelectedClient(null);
      loadClients();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to return KYC to client');
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-sm text-slate-600">Review and verify client KYC documents</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{kycStats?.pendingReview ?? 0}</p>
            <p className="text-xs text-muted-foreground">Needs action</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Verified Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{kycStats?.verifiedToday ?? 0}</p>
            <p className="text-xs text-muted-foreground">Approved today</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{kycStats?.totalRejected ?? 0}</p>
            <p className="text-xs text-muted-foreground">{kycStats?.rejectedToday ?? 0} today</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
            <RotateCcw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{kycStats?.totalReturned ?? 0}</p>
            <p className="text-xs text-muted-foreground">Awaiting client</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Unverified</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kycStats?.totalUnverified ?? 0}</p>
            <p className="text-xs text-muted-foreground">Not started</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 bg-slate-50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Queue</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-700">{(kycStats?.pendingReview ?? 0) + (kycStats?.totalUnverified ?? 0) + (kycStats?.totalReturned ?? 0)}</p>
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
              <CardTitle>KYC Review Queue</CardTitle>
              <CardDescription>{total} clients matching filters</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 w-[180px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending</SelectItem>
                  <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading clients...</p>
          ) : clients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No clients pending review</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>Docs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => {
                      const rawStatus = (client as any).kycStatus;
                      const statusKey = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : rawStatus;
                      const normalizedStatus = statusKey === 'RETURNED_TO_CLIENT' ? 'RETURNED' : statusKey;
                      const statusConfig = (KYC_STATUS_CONFIG as any)[normalizedStatus];
                      const StatusIcon = statusConfig?.icon || Clock;
                      const statusLabel = statusConfig?.label || (typeof normalizedStatus === 'string' ? normalizedStatus.replace(/_/g, ' ') : String(normalizedStatus));
                      const docCount = client.documents?.length || 0;
                      
                      return (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{client.firstName} {client.lastName}</p>
                              <p className="text-xs text-slate-500">{client.clientCode}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{client.idNumber}</span>
                          </TableCell>
                          <TableCell>{docCount}</TableCell>
                          <TableCell>
                            <Badge className={cn(statusConfig?.bg, statusConfig?.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {formatDate(client.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/clients/${client.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {client.kycStatus === 'PENDING_REVIEW' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReview(client, 'approve')}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReturnToClient(client)}
                                    className="text-orange-600 hover:bg-orange-50"
                                    title="Return to client for corrections"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReview(client, 'reject')}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4" />
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
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
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
                  <span>{clientDocuments.length || 0} uploaded</span>
                </div>
              </div>
            )}

            {/* Document Preview Section */}
            <div className="space-y-2">
              <Label>Uploaded Documents</Label>
              {loadingDocs ? (
                <p className="text-sm text-muted-foreground">Loading documents...</p>
              ) : clientDocuments.length === 0 ? (
                <p className="text-sm text-amber-600">No documents uploaded</p>
              ) : (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {clientDocuments.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium">{doc.documentType?.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-500">{doc.fileName}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAuthenticatedFile(`/documents/c_${doc.id}/download`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

      {/* Return to Client Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              Return KYC to Client
            </DialogTitle>
            <DialogDescription>
              Specify what needs to be corrected. The client will receive a notification with these details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedClient && (
              <div className="rounded-lg bg-orange-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Client:</span>
                  <span className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">ID Number:</span>
                  <span className="font-mono">{selectedClient.idNumber}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="return-reason">Overall Reason *</Label>
              <Input
                id="return-reason"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g., Some documents need to be re-uploaded"
              />
            </div>

            <div className="space-y-2">
              <Label>Items Needing Correction *</Label>
              <div className="border rounded-lg p-3 space-y-3">
                {/* Add new item */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select value={newItemType} onValueChange={(v) => setNewItemType(v as 'document' | 'field')}>
                      <SelectTrigger className="w-[130px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="field">Field</SelectItem>
                      </SelectContent>
                    </Select>
                    {newItemType === 'document' ? (
                      <Select value={newItemDocType} onValueChange={setNewItemDocType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select document type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                          <SelectItem value="ID_FRONT">ID Front</SelectItem>
                          <SelectItem value="ID_BACK">ID Back</SelectItem>
                          <SelectItem value="PASSPORT">Passport</SelectItem>
                          <SelectItem value="PASSPORT_PHOTO">Passport Photo</SelectItem>
                          <SelectItem value="KRA_PIN">KRA PIN Certificate</SelectItem>
                          <SelectItem value="PAYSLIP">Payslip</SelectItem>
                          <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                          <SelectItem value="EMPLOYMENT_LETTER">Employment Letter</SelectItem>
                          <SelectItem value="EMPLOYMENT_CONTRACT">Employment Contract</SelectItem>
                          <SelectItem value="PROOF_OF_RESIDENCE">Proof of Residence</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="w-full"
                        placeholder="Field name"
                        value={newItemField}
                        onChange={(e) => setNewItemField(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="What needs to be fixed..."
                      value={newItemMessage}
                      onChange={(e) => setNewItemMessage(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddReturnItem}
                      disabled={!newItemMessage}
                      className="shrink-0 h-9 w-9 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* List of items */}
                {returnedItems.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    {returnedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 rounded p-2 text-sm">
                        <div>
                          <span className="font-medium text-orange-600">
                            {item.type === 'document' ? item.documentType?.replace(/_/g, ' ') : item.field}:
                          </span>{' '}
                          {item.message}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveReturnItem(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {returnedItems.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-2">
                    Add at least one item that needs correction
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReturn}
              disabled={submitting || !returnReason || returnedItems.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? 'Sending...' : 'Return to Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
