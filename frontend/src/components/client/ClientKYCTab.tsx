import { useState, useEffect } from 'react';
import { Client, KycEvent, KycStatus, RiskRating } from '../../types/client';
import { clientService } from '../../services/clientService';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatDate } from '../../lib/utils';
import { downloadAuthenticatedFile, openAuthenticatedFile } from '../../lib/api';
import { toast } from 'sonner';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Image,
  File,
  Upload,
  Trash2,
  Eye,
  Download,
  User,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  CreditCard,
  Building,
  FileCheck,
  History,
} from 'lucide-react';

interface ClientKYCTabProps {
  client: Client;
  onUpdate: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'NATIONAL_ID', label: 'National ID', icon: CreditCard, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'PASSPORT', label: 'Passport', icon: FileText, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'KRA_PIN', label: 'KRA PIN Certificate', icon: FileCheck, color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement', icon: Building, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { value: 'EMPLOYMENT_CONTRACT', label: 'Employment Contract', icon: Briefcase, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'EMPLOYMENT_LETTER', label: 'Employment Letter', icon: Briefcase, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'PROOF_OF_RESIDENCE', label: 'Proof of Residence', icon: MapPin, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'PAYSLIP', label: 'Payslip', icon: FileText, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'PASSPORT_PHOTO', label: 'Passport Photo', icon: Image, color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'OTHER', label: 'Other Document', icon: File, color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const getDocumentTypeConfig = (type: string) => {
  return DOCUMENT_TYPES.find((dt) => dt.value === type) || DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];
};

export default function ClientKYCTab({ client, onUpdate }: ClientKYCTabProps) {
  const { user } = useAuthStore();
  const [kycHistory, setKycHistory] = useState<KycEvent[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const canManageKyc = user && (user.role === UserRole.ADMIN || user.role === UserRole.CREDIT_OFFICER);
  const canDeleteDocuments = user?.role === UserRole.ADMIN;
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [riskRating, setRiskRating] = useState<RiskRating>(client.riskRating || RiskRating.LOW);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('NATIONAL_ID');

  useEffect(() => {
    loadKycHistory();
    loadDocuments();
  }, [client.id]);

  const loadKycHistory = async () => {
    try {
      const history = await clientService.getKycHistory(client.id);
      setKycHistory(history);
    } catch (error) {
      toast.error('Failed to load KYC history');
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await clientService.getDocuments(client.id);
      setDocuments(docs);
    } catch (error) {
      toast.error('Failed to load documents');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setLoading(true);
      await clientService.uploadDocument(client.id, selectedFile, documentType);
      setShowUploadDialog(false);
      setSelectedFile(null);
      setDocumentType('NATIONAL_ID');
      loadDocuments();
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await clientService.deleteDocument(client.id, documentId);
      loadDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setLoading(true);
      await clientService.submitForKyc(client.id, { notes });
      setNotes('');
      onUpdate();
      loadKycHistory();
      toast.success('Submitted for review');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit for review');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await clientService.approveKyc(client.id, { notes });
      setShowApproveDialog(false);
      setNotes('');
      onUpdate();
      loadKycHistory();
      toast.success('KYC approved');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      setLoading(true);
      await clientService.rejectKyc(client.id, { reason, notes });
      setShowRejectDialog(false);
      setReason('');
      setNotes('');
      onUpdate();
      loadKycHistory();
      toast.success('KYC rejected');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRiskRating = async () => {
    try {
      setLoading(true);
      await clientService.updateRiskRating(client.id, { riskRating, notes });
      setShowRiskDialog(false);
      setNotes('');
      onUpdate();
      toast.success('Risk rating updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update risk rating');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: KycStatus) => {
    switch (status) {
      case KycStatus.VERIFIED:
        return { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Verified' };
      case KycStatus.PENDING_REVIEW:
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pending Review' };
      case KycStatus.REJECTED:
        return { icon: ShieldX, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Rejected' };
      case KycStatus.RETURNED:
        return { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Returned' };
      default:
        return { icon: Shield, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Unverified' };
    }
  };

  const statusConfig = getStatusConfig(client.kycStatus);
  const StatusIcon = statusConfig.icon;

  const hasDoc = (type: string) => documents.some((d) => d.documentType === type);

  const checklistItems = [
    { label: 'ID Number', value: client.idNumber, checked: !!client.idNumber, icon: CreditCard },
    { label: 'Date of Birth', value: client.dateOfBirth ? formatDate(client.dateOfBirth) : null, checked: !!client.dateOfBirth, icon: Calendar },
    { label: 'Phone Number', value: client.phonePrimary, checked: !!client.phonePrimary, icon: Phone },
    { label: 'Address', value: client.residentialAddress, checked: !!client.residentialAddress, icon: MapPin },
    { label: 'Employment', value: client.employerName, checked: !!client.employerName, icon: Briefcase },
    { label: 'Next of Kin', value: `${client.nextOfKin?.length || 0} contact(s)`, checked: (client.nextOfKin?.length || 0) > 0, icon: Users },
    { label: 'Referees', value: `${client.referees?.length || 0} referee(s)`, checked: (client.referees?.length || 0) >= 2, icon: User },
  ];

  const documentChecklist = [
    { type: 'NATIONAL_ID', label: 'National ID', required: true },
    { type: 'KRA_PIN', label: 'KRA PIN', required: true },
    { type: 'BANK_STATEMENT', label: 'Bank Statement', required: true },
    { type: 'EMPLOYMENT_CONTRACT', label: 'Employment Doc', required: true, alt: ['EMPLOYMENT_LETTER'] },
    { type: 'PROOF_OF_RESIDENCE', label: 'Proof of Residence', required: true },
  ];

  const completedChecklist = checklistItems.filter((i) => i.checked).length;
  const completedDocs = documentChecklist.filter((d) => hasDoc(d.type) || (d.alt && d.alt.some(hasDoc))).length;
  const totalRequired = checklistItems.length + documentChecklist.length;
  const totalCompleted = completedChecklist + completedDocs;
  const progressPercent = Math.round((totalCompleted / totalRequired) * 100);

  return (
    <div className="space-y-6">
      {/* KYC Status Header */}
      <div className={`rounded-xl p-6 ${statusConfig.bg} border ${statusConfig.border}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-full ${statusConfig.bg} border-2 ${statusConfig.border} flex items-center justify-center`}>
              <StatusIcon className={`h-7 w-7 ${statusConfig.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">KYC Status</h2>
              <p className={`text-lg font-semibold ${statusConfig.color}`}>{statusConfig.label}</p>
              {client.kycVerifiedAt && (
                <p className="text-sm text-slate-600">Verified on {formatDate(client.kycVerifiedAt)}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-sm text-slate-600">KYC Completion</p>
              <p className="text-2xl font-bold text-slate-900">{progressPercent}%</p>
            </div>
            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {client.kycStatus === KycStatus.PENDING_REVIEW && canManageKyc && (
          <div className="mt-6 pt-4 border-t border-slate-200 flex gap-3">
            <Button onClick={() => setShowApproveDialog(true)} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve KYC
            </Button>
            <Button onClick={() => setShowRejectDialog(true)} disabled={loading} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Reject KYC
            </Button>
          </div>
        )}

        {client.kycStatus === KycStatus.UNVERIFIED && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Add notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSubmitForReview} disabled={loading}>
                Submit for Review
              </Button>
            </div>
          </div>
        )}

        {client.kycStatus === KycStatus.VERIFIED && canManageKyc && (
          <div className="mt-6 pt-4 border-t border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Risk Rating:</span>
              <Badge variant={client.riskRating === 'HIGH' ? 'destructive' : client.riskRating === 'MEDIUM' ? 'warning' : 'success'}>
                {client.riskRating || 'LOW'}
              </Badge>
            </div>
            <Button onClick={() => setShowRiskDialog(true)} variant="outline" size="sm">
              Update Risk Rating
            </Button>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information Checklist */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-slate-600" />
              Personal Information
            </CardTitle>
            <CardDescription>{completedChecklist}/{checklistItems.length} completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklistItems.map((item, index) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      item.checked ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      item.checked ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      {item.checked ? <CheckCircle className="h-4 w-4" /> : <ItemIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.checked ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {item.label}
                      </p>
                      {item.value && (
                        <p className="text-xs text-slate-500 truncate">{item.value}</p>
                      )}
                    </div>
                    {item.checked ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Document Checklist */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Required Documents
                </CardTitle>
                <CardDescription>{completedDocs}/{documentChecklist.length} uploaded</CardDescription>
              </div>
              {canManageKyc && (
                <Button size="sm" variant="outline" onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documentChecklist.map((item) => {
                const uploaded = hasDoc(item.type) || (item.alt && item.alt.some(hasDoc));
                const docConfig = getDocumentTypeConfig(item.type);
                const DocIcon = docConfig.icon;
                return (
                  <div
                    key={item.type}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      uploaded ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      uploaded ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {uploaded ? <CheckCircle className="h-4 w-4" /> : <DocIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${uploaded ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {uploaded ? 'Uploaded' : 'Required'}
                      </p>
                    </div>
                    {uploaded ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Documents Gallery */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Uploaded Documents</CardTitle>
              <CardDescription>{documents.length} document(s) on file</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No documents uploaded yet</p>
              <p className="text-sm text-slate-500 mt-1">Upload documents to complete KYC verification</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => {
                const docConfig = getDocumentTypeConfig(doc.documentType);
                const DocIcon = docConfig.icon;
                return (
                  <div
                    key={doc.id}
                    className={`rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${docConfig.color}`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${docConfig.color}`}>
                          <DocIcon className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className={docConfig.color}>
                          {docConfig.label}
                        </Badge>
                      </div>
                      <p className="font-medium text-slate-900 text-sm truncate" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(doc.sizeBytes / 1024).toFixed(1)} KB • {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                    <div className="px-4 py-3 bg-white/50 border-t flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => openAuthenticatedFile(`/documents/c_${doc.id}/download`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => downloadAuthenticatedFile(`/documents/c_${doc.id}/download`, doc.fileName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      {canDeleteDocuments && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteDocument(doc.id)}
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

      {/* KYC History Timeline */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            KYC History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kycHistory.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No KYC history yet</p>
          ) : (
            <div className="space-y-4">
              {kycHistory.map((event, index) => {
                const eventConfig = getStatusConfig(event.toStatus);
                const EventIcon = eventConfig.icon;
                return (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${eventConfig.bg} ${eventConfig.border}`}>
                        <EventIcon className={`h-5 w-5 ${eventConfig.color}`} />
                      </div>
                      {index < kycHistory.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 my-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`${eventConfig.bg} ${eventConfig.color} border ${eventConfig.border}`}>
                          {eventConfig.label}
                        </Badge>
                        <span className="text-xs text-slate-500">{formatDate(event.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-700">
                        Status changed from <span className="font-medium">{event.fromStatus.replace('_', ' ')}</span> to{' '}
                        <span className="font-medium">{event.toStatus.replace('_', ' ')}</span>
                      </p>
                      {event.reason && (
                        <p className="text-sm text-slate-600 mt-1 bg-slate-50 rounded p-2">
                          <span className="font-medium">Reason:</span> {event.reason}
                        </p>
                      )}
                      {event.notes && (
                        <p className="text-sm text-slate-500 mt-1">{event.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve KYC</DialogTitle>
            <DialogDescription>
              Confirm that you have verified all client documents and information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-notes">Notes (Optional)</Label>
              <Input
                id="approve-notes"
                placeholder="Add approval notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              Approve KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this client's KYC.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Reason *</Label>
              <Input
                id="reject-reason"
                placeholder="e.g., ID document is unclear"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="reject-notes">Additional Notes (Optional)</Label>
              <Input
                id="reject-notes"
                placeholder="Add additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              Reject KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Risk Rating Dialog */}
      <Dialog open={showRiskDialog} onOpenChange={setShowRiskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Risk Rating</DialogTitle>
            <DialogDescription>
              Set the risk rating for this client based on their profile and history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="risk-rating">Risk Rating</Label>
              <select
                id="risk-rating"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={riskRating}
                onChange={(e) => setRiskRating(e.target.value as RiskRating)}
              >
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>
            </div>
            <div>
              <Label htmlFor="risk-notes">Notes (Optional)</Label>
              <Input
                id="risk-notes"
                placeholder="Reason for this rating..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRiskDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRiskRating} disabled={loading}>
              Update Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for this client's KYC verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-type">Document Type *</Label>
              <select
                id="doc-type"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="NATIONAL_ID">National ID</option>
                <option value="PASSPORT">Passport</option>
                <option value="PASSPORT_PHOTO">Passport Photo</option>
                <option value="PROOF_OF_RESIDENCE">Proof of Residence</option>
                <option value="PAYSLIP">Payslip</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
                <option value="EMPLOYMENT_LETTER">Employment Letter</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="doc-file">File *</Label>
              <Input
                id="doc-file"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB. Accepted: JPG, PNG, PDF, DOC, DOCX
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={loading || !selectedFile}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
