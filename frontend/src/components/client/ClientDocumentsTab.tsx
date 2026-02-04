import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';
import { openAuthenticatedFile } from '../../lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Eye,
  Image,
  File,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Landmark,
  Briefcase,
  Home,
  FolderOpen,
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import type { Client, ClientDocument } from '../../types/client';
import { DocumentType } from '../../types/client';
import { formatDate } from '../../lib/utils';

interface ClientDocumentsTabProps {
  client: Client;
  onUpdate: () => void;
}

const DOCUMENT_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  ID_FRONT: { label: 'ID Card (Front)', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  ID_BACK: { label: 'ID Card (Back)', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  PASSPORT_PHOTO: { label: 'Passport Photo', icon: Image, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  NATIONAL_ID: { label: 'National ID', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  PASSPORT: { label: 'Passport', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  PAYSLIP: { label: 'Payslip', icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  BANK_STATEMENT: { label: 'Bank Statement', icon: Landmark, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  EMPLOYMENT_LETTER: { label: 'Employment Letter', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  EMPLOYMENT_CONTRACT: { label: 'Employment Contract', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  CONTRACT: { label: 'Contract', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  PROOF_OF_RESIDENCE: { label: 'Proof of Residence', icon: Home, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  KRA_PIN: { label: 'KRA PIN Certificate', icon: FileText, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  OTHER: { label: 'Other Document', icon: FolderOpen, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
};

const SCAN_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending: { label: 'Scanning', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300', icon: Clock },
  clean: { label: 'Verified', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', icon: CheckCircle },
  infected: { label: 'Infected', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', icon: AlertTriangle },
};

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith('image/')) return Image;
  if (mimeType?.includes('pdf')) return FileText;
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return FileSpreadsheet;
  return File;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientDocumentsTab({ client, onUpdate }: ClientDocumentsTabProps) {
  const { user } = useAuthStore();
  const canManageDocuments = user && (user.role === UserRole.ADMIN || user.role === UserRole.CREDIT_OFFICER);
  const canDeleteDocuments = user?.role === UserRole.ADMIN;

  const [documents, setDocuments] = useState<ClientDocument[]>(client.documents || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await clientService.getDocuments(client.id);
      setDocuments(docs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Only JPEG, PNG, PDF, and DOC files are allowed');
        return;
      }
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) return;

    try {
      setUploadLoading(true);
      setUploadError('');
      await clientService.uploadDocument(client.id, selectedFile, documentType);
      setShowUploadDialog(false);
      setSelectedFile(null);
      setDocumentType('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadDocuments();
      onUpdate();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setDeletingId(documentId);
      await clientService.deleteDocument(client.id, documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = (doc: ClientDocument) => {
    openAuthenticatedFile(`/documents/c_${doc.id}/download`);
  };

  const activeDocuments = documents.filter((d) => !d.isDeleted);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Documents</p>
              <p className="text-2xl font-bold text-blue-700">{activeDocuments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-emerald-600 font-medium">Verified</p>
              <p className="text-2xl font-bold text-emerald-700">
                {activeDocuments.filter((d) => d.virusScanStatus === 'clean').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-600 font-medium">Pending Scan</p>
              <p className="text-2xl font-bold text-amber-700">
                {activeDocuments.filter((d) => !d.virusScanStatus || d.virusScanStatus === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Card */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                Uploaded Documents
              </CardTitle>
              <CardDescription>{activeDocuments.length} document(s) on file</CardDescription>
            </div>
            {canManageDocuments && (
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3 animate-spin" />
              <p className="text-slate-500">Loading documents...</p>
            </div>
          ) : activeDocuments.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No documents uploaded</p>
              <p className="text-sm text-slate-500 mt-1">Upload client documents for KYC verification</p>
              {canManageDocuments && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeDocuments.map((doc) => {
                const typeConfig = DOCUMENT_TYPE_CONFIG[doc.documentType] || DOCUMENT_TYPE_CONFIG.OTHER;
                const TypeIcon = typeConfig.icon;
                const scanConfig = SCAN_STATUS_CONFIG[doc.virusScanStatus || 'pending'];
                const ScanIcon = scanConfig?.icon || Clock;
                const FileIcon = getFileIcon(doc.mimeType);

                return (
                  <div
                    key={doc.id}
                    className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${typeConfig.bg} ${typeConfig.border}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${typeConfig.bg} border ${typeConfig.border}`}>
                        <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                      </div>
                      <Badge className={`${scanConfig.bg} ${scanConfig.color} border ${scanConfig.border}`}>
                        <ScanIcon className="h-3 w-3 mr-1" />
                        {scanConfig.label}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <p className={`text-sm font-semibold ${typeConfig.color}`}>{typeConfig.label}</p>
                      <p className="text-xs text-slate-600 truncate mt-1" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <FileIcon className="h-3 w-3" />
                        {formatFileSize(doc.sizeBytes)}
                      </span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(doc)}
                        className="flex-1 h-8"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {canDeleteDocuments && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          disabled={deletingId === doc.id}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for {client.firstName} {client.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {uploadError && (
              <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {uploadError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select
                value={documentType}
                onValueChange={(value) => setDocumentType(value as DocumentType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ID_FRONT">ID Card (Front)</SelectItem>
                  <SelectItem value="ID_BACK">ID Card (Back)</SelectItem>
                  <SelectItem value="PASSPORT_PHOTO">Passport Photo</SelectItem>
                  <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                  <SelectItem value="PASSPORT">Passport</SelectItem>
                  <SelectItem value="PAYSLIP">Payslip</SelectItem>
                  <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                  <SelectItem value="EMPLOYMENT_LETTER">Employment Letter</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="PROOF_OF_RESIDENCE">Proof of Residence</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <File className="h-10 w-10 text-emerald-500 mx-auto" />
                    <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 text-slate-400 mx-auto" />
                    <p className="text-sm text-slate-600">
                      <button
                        type="button"
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Click to upload
                      </button>{' '}
                      or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">
                      JPEG, PNG, PDF, DOC up to 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadLoading || !selectedFile || !documentType}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {uploadLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-[500px] border rounded-lg"
                title="Document Preview"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewUrl(null)}>
              Close
            </Button>
            {previewUrl && (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <a href={previewUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
