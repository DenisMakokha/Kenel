import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { portalService } from '../../services/portalService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, Upload, RotateCcw, AlertTriangle, FileWarning, ArrowRight, Loader2, Edit3, DollarSign, Calendar, User, Briefcase } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

interface ReturnedItem {
  type: string; // 'document' | 'field' | 'amount' | 'term' | 'purpose' | 'personal_info' | 'employment' | 'other'
  documentType?: string;
  field?: string;
  message: string;
}

const getReturnedItemIcon = (type: string) => {
  switch (type) {
    case 'document': return FileWarning;
    case 'amount': return DollarSign;
    case 'term': return Calendar;
    case 'personal_info': return User;
    case 'employment': return Briefcase;
    default: return AlertTriangle;
  }
};

const getReturnedItemLabel = (item: ReturnedItem) => {
  if (item.type === 'document' && item.documentType) {
    return item.documentType.replace(/_/g, ' ');
  }
  if (item.field) {
    return item.field;
  }
  switch (item.type) {
    case 'amount': return 'Requested Amount';
    case 'term': return 'Loan Term';
    case 'purpose': return 'Loan Purpose';
    case 'personal_info': return 'Personal Information';
    case 'employment': return 'Employment Details';
    default: return 'Issue';
  }
};

interface ApplicationDetail {
  id: string;
  applicationNumber: string;
  status: string;
  requestedAmount: number;
  requestedTermMonths: number;
  purpose?: string;
  productName: string;
  productVersionId?: string;
  submittedAt?: string;
  approvedPrincipal?: number;
  approvedTermMonths?: number;
  approvedInterestRate?: number;
  rejectionReason?: string;
  rejectionNotes?: string;
  // Return to client fields
  returnReason?: string;
  returnedAt?: string;
  returnedItems?: ReturnedItem[];
  documents?: Array<{
    id: string;
    documentType: string;
    fileName: string;
    uploadedAt: string;
    reviewStatus: string;
    reviewNotes?: string;
  }>;
  checklistItems?: Array<{
    id: string;
    itemKey: string;
    itemLabel: string;
    status: string;
  }>;
}

const DOCUMENT_TYPES = [
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'KRA_PIN', label: 'KRA PIN Certificate' },
  { value: 'PAYSLIP', label: 'Payslip' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'EMPLOYMENT_LETTER', label: 'Employment Letter' },
  { value: 'EMPLOYMENT_CONTRACT', label: 'Employment Contract' },
  { value: 'PROOF_OF_RESIDENCE', label: 'Proof of Residence' },
  { value: 'OTHER', label: 'Other Document' },
];

export default function PortalApplicationDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  // searchParams available for future use (e.g., notification deep links)
  const [searchParams] = useSearchParams();
  void searchParams; // Suppress unused warning - kept for notification link handling
  
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Document upload state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  
  // Resubmit state
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!applicationId) return;
      try {
        setLoading(true);
        const data = await portalService.getLoanApplicationDetail(applicationId);
        setApplication(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load application');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applicationId]);

  const getStatusConfig = (status: string) => {
    const statusKey = (status || '').toUpperCase();
    const normalizedStatus = statusKey === 'RETURNED_TO_CLIENT' ? 'RETURNED' : statusKey;
    switch (normalizedStatus) {
      case 'DRAFT':
        return { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Draft' };
      case 'SUBMITTED':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Submitted' };
      case 'UNDER_REVIEW':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Under Review' };
      case 'APPROVED':
        return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Approved' };
      case 'REJECTED':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' };
      case 'RETURNED':
        return { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Returned' };
      default:
        return {
          icon: FileText,
          color: 'text-slate-500',
          bg: 'bg-slate-100',
          label: normalizedStatus ? normalizedStatus.replace(/_/g, ' ') : status,
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const refreshApplication = async () => {
    if (!applicationId) return;
    try {
      const data = await portalService.getLoanApplicationDetail(applicationId);
      setApplication(data);
    } catch (err: any) {
      toast.error('Failed to refresh application');
    }
  };

  const handleUploadDocument = async () => {
    if (!applicationId || !selectedFile || !documentType) return;
    try {
      setUploading(true);
      await portalService.uploadLoanApplicationDocument(applicationId, {
        file: selectedFile,
        type: documentType,
      });
      toast.success('Document uploaded successfully');
      setShowUploadDialog(false);
      setSelectedFile(null);
      setDocumentType('');
      await refreshApplication();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = async () => {
    if (!applicationId) return;
    try {
      setResubmitting(true);
      await portalService.submitLoanApplication(applicationId);
      toast.success('Application resubmitted successfully!');
      await refreshApplication();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resubmit application');
    } finally {
      setResubmitting(false);
    }
  };

  // Check if application is in RETURNED status (normalize the check)
  const isApplicationReturned = application?.status?.toUpperCase() === 'RETURNED' || 
    application?.status?.toUpperCase() === 'RETURNED_TO_CLIENT';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/portal/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Application not found'}
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(application.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/portal/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Loan Application
            </h1>
            <p className="text-sm text-slate-500">
              {application.applicationNumber} • {application.productName}
            </p>
          </div>
        </div>
        <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0 px-3 py-1`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Status Banner */}
      {application.status === 'APPROVED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <div>
              <h3 className="font-semibold text-emerald-800">Application Approved!</h3>
              <p className="text-sm text-emerald-700">
                Your loan has been approved for {formatCurrency(application.approvedPrincipal || 0)} over {application.approvedTermMonths} months at {application.approvedInterestRate}% interest.
              </p>
            </div>
          </div>
        </div>
      )}

      {application.status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Application Rejected</h3>
              {application.rejectionReason && (
                <p className="text-sm text-red-700">Reason: {application.rejectionReason}</p>
              )}
              {application.rejectionNotes && (
                <p className="text-sm text-red-600 mt-1">{application.rejectionNotes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {(application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Application Under Review</h3>
              <p className="text-sm text-blue-700">
                Your application is being reviewed by our team. We'll notify you once a decision is made.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RETURNED Status Banner - Action Required */}
      {isApplicationReturned && (
        <div className="rounded-lg border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-orange-900">Action Required</h3>
              </div>
              <p className="text-sm text-orange-800 font-medium mb-2">
                Your loan application needs correction
              </p>
              {application.returnReason && (
                <p className="text-sm text-orange-700 mb-3">{application.returnReason}</p>
              )}
              
              {/* Returned Items List */}
              {application.returnedItems && application.returnedItems.length > 0 && (
                <div className="bg-white/60 rounded-md p-3 mb-3">
                  <p className="text-xs font-medium text-orange-800 mb-2">Items needing attention:</p>
                  <ul className="space-y-2">
                    {application.returnedItems.map((item, index) => {
                      const ItemIcon = getReturnedItemIcon(item.type);
                      const isDocumentIssue = item.type === 'document';
                      return (
                        <li key={index} className={`flex items-start gap-2 text-sm p-2 rounded ${isDocumentIssue ? 'bg-red-50' : 'bg-amber-50'}`}>
                          <ItemIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDocumentIssue ? 'text-red-600' : 'text-amber-600'}`} />
                          <span className={isDocumentIssue ? 'text-red-700' : 'text-amber-700'}>
                            <strong>{getReturnedItemLabel(item)}:</strong>{' '}
                            {item.message}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {/* Show Edit Application button if there are non-document issues */}
                {application.returnedItems?.some(item => item.type !== 'document') && (
                  <Button
                    onClick={() => navigate(`/portal/apply?continue=${application.id}`)}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Application
                  </Button>
                )}
                {/* Show Upload Documents button if there are document issues */}
                {application.returnedItems?.some(item => item.type === 'document') && (
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Documents
                  </Button>
                )}
                {/* Always show Upload if no specific returned items */}
                {(!application.returnedItems || application.returnedItems.length === 0) && (
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                )}
                <Button
                  onClick={handleResubmit}
                  disabled={resubmitting}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  {resubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resubmitting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Resubmit Application
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Requested Amount</p>
                <p className="font-semibold text-lg">{formatCurrency(application.requestedAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Term</p>
                <p className="font-semibold text-lg">{application.requestedTermMonths} months</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Purpose</p>
                <p className="font-medium">{application.purpose || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Submitted</p>
                <p className="font-medium">{formatDate(application.submittedAt)}</p>
              </div>
            </div>

            {application.approvedPrincipal && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-emerald-700 mb-2">Approved Terms</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Principal</p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(application.approvedPrincipal)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Term</p>
                    <p className="font-semibold">{application.approvedTermMonths} months</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Interest Rate</p>
                    <p className="font-semibold">{application.approvedInterestRate}%</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Documents submitted with this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            {application.documents && application.documents.length > 0 ? (
              <div className="space-y-2">
                {application.documents.map((doc) => {
                  const isRejected = doc.reviewStatus === 'REJECTED';
                  const isVerified = doc.reviewStatus === 'VERIFIED';
                  return (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-lg border ${
                        isRejected 
                          ? 'bg-red-50 border-red-200' 
                          : isVerified 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className={`h-5 w-5 ${isRejected ? 'text-red-400' : isVerified ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <div>
                            <p className="font-medium text-sm">{doc.documentType.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-slate-500">{doc.fileName}</p>
                          </div>
                        </div>
                        <Badge
                          variant={isVerified ? 'default' : isRejected ? 'destructive' : 'secondary'}
                          className={isVerified ? 'bg-emerald-600' : isRejected ? 'bg-red-600' : ''}
                        >
                          {doc.reviewStatus || 'PENDING'}
                        </Badge>
                      </div>
                      {/* Show rejection reason for rejected documents */}
                      {isRejected && doc.reviewNotes && (
                        <div className="mt-2 text-sm text-red-700 bg-red-100 p-2 rounded">
                          <strong>Reason:</strong> {doc.reviewNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No documents uploaded</p>
            )}
            
            {/* Upload button for RETURNED applications */}
            {isApplicationReturned && (
              <Button
                onClick={() => setShowUploadDialog(true)}
                variant="outline"
                className="w-full mt-4 border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Replacement Document
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Checklist Status */}
      {application.checklistItems && application.checklistItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {application.checklistItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    item.status === 'COMPLETED'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  {item.status === 'COMPLETED' ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-600" />
                  )}
                  <span className={`text-sm ${item.status === 'COMPLETED' ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {item.itemLabel}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {application.status === 'DRAFT' && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/portal/apply?continue=${application.id}`)}
          >
            Continue Application
          </Button>
        </div>
      )}

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a replacement document to fix the issues identified by our team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-sm text-slate-500">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setSelectedFile(null);
                setDocumentType('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={uploading || !selectedFile || !documentType}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
