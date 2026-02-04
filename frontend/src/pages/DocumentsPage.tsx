import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  FileText,
  Search,
  Upload,
  Download,
  Eye,
  Trash2,
  Image,
  File,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { formatDate, formatDateTime } from '../lib/utils';
import { cn } from '../lib/utils';
import { DateRangePicker, DateRange } from '../components/ui/date-range-picker';
import api from '../lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/auth';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  mimeType: string;
  size: number;
  url: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  clientId?: string;
  clientName?: string;
  loanId?: string;
  applicationId?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

const DOCUMENT_TYPES = [
  { value: 'ID_FRONT', label: 'ID Card (Front)' },
  { value: 'ID_BACK', label: 'ID Card (Back)' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'PAYSLIP', label: 'Payslip' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'UTILITY_BILL', label: 'Utility Bill' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'OTHER', label: 'Other' },
];

const DOCUMENT_CATEGORIES = [
  { value: 'KYC', label: 'KYC Documents' },
  { value: 'LOAN', label: 'Loan Documents' },
  { value: 'REPAYMENT', label: 'Repayment Proof' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  VERIFIED: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [uploadModal, setUploadModal] = useState(false);
  const [previewModal, setPreviewModal] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('KYC');
  const [uploadClientId, setUploadClientId] = useState<string>('');
  const [uploadApplicationId, setUploadApplicationId] = useState<string>('');
  const [uploadNotes, setUploadNotes] = useState<string>('');

  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  const canDelete = user?.role === UserRole.ADMIN;
  const canVerify = user?.role === UserRole.ADMIN || user?.role === UserRole.CREDIT_OFFICER;
  const canUpload = user?.role === UserRole.ADMIN || user?.role === UserRole.CREDIT_OFFICER;

  useEffect(() => {
    loadDocuments();
  }, [page, categoryFilter, typeFilter, statusFilter, dateRange]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateRange?.from) params.fromDate = dateRange.from.toISOString();
      if (dateRange?.to) params.toDate = dateRange.to.toISOString();

      const response = await api.get('/documents', { params });
      setDocuments(response.data.documents || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      toast.error(error?.response?.data?.message || 'Failed to load documents');
      setDocuments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!uploadType) {
      toast.error('Please select a document type');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('type', uploadType);
      formData.append('category', uploadCategory);
      if (uploadClientId) formData.append('clientId', uploadClientId);
      if (uploadApplicationId) formData.append('applicationId', uploadApplicationId);
      if (uploadNotes) formData.append('notes', uploadNotes);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadModal(false);
      resetUploadForm();
      loadDocuments();
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await api.get(doc.url, { responseType: 'blob' });
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || 'Download failed');
    }
  };

  const openPreview = async (doc: Document) => {
    try {
      if (previewBlobUrl) {
        window.URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }

      if (doc.mimeType.startsWith('image/')) {
        const response = await api.get(doc.url, { responseType: 'blob' });
        const url = window.URL.createObjectURL(response.data as Blob);
        setPreviewBlobUrl(url);
      }

      setPreviewModal(doc);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || 'Failed to load preview');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      loadDocuments();
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || 'Delete failed');
    }
  };

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => {
    try {
      await api.patch(`/documents/${id}/verify`, { status, notes });
      loadDocuments();
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || 'Verification failed');
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadType('');
    setUploadCategory('KYC');
    setUploadClientId('');
    setUploadApplicationId('');
    setUploadNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.name.toLowerCase().includes(term) ||
      doc.clientName?.toLowerCase().includes(term) ||
      doc.uploadedByName.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Document Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Upload, view, and manage client documents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <FolderOpen className="h-4 w-4" />
            <span>{total.toLocaleString()} documents</span>
          </div>
          {canUpload && (
            <Button onClick={() => setUploadModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by filename, client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker
              value={dateRange}
              onChange={(range) => { setDateRange(range); setPage(1); }}
              placeholder="Date range"
              className="w-full lg:w-[280px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => {
                    const FileIcon = getFileIcon(doc.mimeType);
                    const statusConfig = STATUS_CONFIG[doc.status];
                    const StatusIcon = statusConfig.icon;
                    return (
                      <TableRow key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                              <FileIcon className="h-5 w-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                                {doc.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {DOCUMENT_CATEGORIES.find((c) => c.value === doc.category)?.label}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label || doc.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          {doc.clientName ? (
                            <button
                              onClick={() => navigate(`/clients/${doc.clientId}`)}
                              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              {doc.clientName}
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('font-medium gap-1', statusConfig.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-slate-600 dark:text-slate-400">{formatDate(doc.createdAt)}</p>
                            <p className="text-xs text-slate-400">by {doc.uploadedByName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-500">{formatFileSize(doc.size)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openPreview(doc)}
                            >
                              <Eye className="h-4 w-4 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="h-4 w-4 text-slate-500" />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDelete(doc.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} documents
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
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

      {/* Upload Modal */}
      {canUpload && uploadModal && (
        <Dialog open={uploadModal} onOpenChange={setUploadModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="file">File</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                      uploadFile
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-300 hover:border-slate-400 dark:border-slate-600'
                    )}
                  >
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="h-8 w-8 text-emerald-600" />
                        <div className="text-left">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{uploadFile.name}</p>
                          <p className="text-sm text-slate-500">{formatFileSize(uploadFile.size)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          PDF, JPG, PNG, DOC, XLS (max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Document Type</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="clientId">Client ID (optional)</Label>
                <Input
                  id="clientId"
                  value={uploadClientId}
                  onChange={(e) => setUploadClientId(e.target.value)}
                  placeholder="Enter client ID to associate document"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="applicationId">Application ID (optional)</Label>
                <Input
                  id="applicationId"
                  value={uploadApplicationId}
                  onChange={(e) => setUploadApplicationId(e.target.value)}
                  placeholder="Enter application ID to associate document"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Add any notes about this document"
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setUploadModal(false); resetUploadForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadType || uploading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <Dialog open={!!previewModal} onOpenChange={() => setPreviewModal(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {previewModal.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Type</p>
                  <p className="font-medium">{DOCUMENT_TYPES.find((t) => t.value === previewModal.type)?.label}</p>
                </div>
                <div>
                  <p className="text-slate-500">Category</p>
                  <p className="font-medium">{DOCUMENT_CATEGORIES.find((c) => c.value === previewModal.category)?.label}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <Badge className={cn('font-medium', STATUS_CONFIG[previewModal.status].color)}>
                    {STATUS_CONFIG[previewModal.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-500">Size</p>
                  <p className="font-medium">{formatFileSize(previewModal.size)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Uploaded By</p>
                  <p className="font-medium">{previewModal.uploadedByName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Uploaded At</p>
                  <p className="font-medium">{formatDateTime(previewModal.createdAt)}</p>
                </div>
                {previewModal.clientName && (
                  <div>
                    <p className="text-slate-500">Client</p>
                    <p className="font-medium">{previewModal.clientName}</p>
                  </div>
                )}
                {previewModal.verifiedAt && (
                  <div>
                    <p className="text-slate-500">Verified At</p>
                    <p className="font-medium">{formatDateTime(previewModal.verifiedAt)}</p>
                  </div>
                )}
              </div>
              {previewModal.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Notes</p>
                  <p className="text-sm">{previewModal.notes}</p>
                </div>
              )}
              {previewModal.mimeType.startsWith('image/') && (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={previewBlobUrl || previewModal.url}
                    alt={previewModal.name}
                    className="w-full h-auto max-h-[400px] object-contain bg-slate-100"
                  />
                </div>
              )}
              {canVerify && previewModal.status === 'PENDING' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleVerify(previewModal.id, 'VERIFIED');
                      setPreviewModal(null);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Document
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const notes = prompt('Reason for rejection:');
                      if (notes) {
                        handleVerify(previewModal.id, 'REJECTED', notes);
                        setPreviewModal(null);
                      }
                    }}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Reject Document
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleDownload(previewModal)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPreviewModal(null);
                  if (previewBlobUrl) {
                    window.URL.revokeObjectURL(previewBlobUrl);
                    setPreviewBlobUrl(null);
                  }
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
