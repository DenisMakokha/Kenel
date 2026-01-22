import { useState, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
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
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import type { Client, ClientDocument } from '../../types/client';
import { DocumentType } from '../../types/client';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface ClientDocumentsTabProps {
  client: Client;
  onUpdate: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  ID_FRONT: 'ID Card (Front)',
  ID_BACK: 'ID Card (Back)',
  PASSPORT_PHOTO: 'Passport Photo',
  NATIONAL_ID: 'National ID',
  PASSPORT: 'Passport',
  PAYSLIP: 'Payslip',
  BANK_STATEMENT: 'Bank Statement',
  EMPLOYMENT_LETTER: 'Employment Letter',
  CONTRACT: 'Contract',
  PROOF_OF_RESIDENCE: 'Proof of Residence',
  OTHER: 'Other Document',
};

const SCAN_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Scanning...', color: 'bg-amber-100 text-amber-700', icon: Clock },
  clean: { label: 'Clean', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  infected: { label: 'Infected', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientDocumentsTab({ client, onUpdate }: ClientDocumentsTabProps) {
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
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    setPreviewUrl(`${baseUrl}/clients/${client.id}/documents/${doc.id}/download`);
  };

  const activeDocuments = documents.filter((d) => !d.isDeleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
          <p className="text-sm text-slate-500">
            {activeDocuments.length} document{activeDocuments.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <Button
          onClick={() => setShowUploadDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Documents Grid */}
      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading documents...</p>
      ) : activeDocuments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-900 mb-2">No Documents</h4>
            <p className="text-sm text-slate-500 mb-4">
              Upload client documents for KYC verification
            </p>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-100">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDocuments.map((doc) => {
                  const FileIcon = getFileIcon(doc.mimeType);
                  const scanConfig = SCAN_STATUS_CONFIG[doc.virusScanStatus || 'pending'];
                  const ScanIcon = scanConfig?.icon || Clock;

                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <FileIcon className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                              {doc.fileName}
                            </span>
                            <span className="text-xs text-slate-500">{doc.mimeType}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatFileSize(doc.sizeBytes)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatDate(doc.uploadedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('font-medium', scanConfig?.color)}>
                          <ScanIcon className="h-3 w-3 mr-1" />
                          {scanConfig?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(doc)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                            disabled={deletingId === doc.id}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
