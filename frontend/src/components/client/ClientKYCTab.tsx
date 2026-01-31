import { useState, useEffect } from 'react';
import { Client, KycEvent, KycStatus, RiskRating } from '../../types/client';
import { clientService } from '../../services/clientService';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

interface ClientKYCTabProps {
  client: Client;
  onUpdate: () => void;
}

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

  const getStatusBadge = (status: KycStatus) => {
    const variants = {
      UNVERIFIED: 'outline',
      PENDING_REVIEW: 'warning',
      VERIFIED: 'success',
      REJECTED: 'destructive',
    } as const;

    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* KYC Status Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>KYC Status</CardTitle>
            {getStatusBadge(client.kycStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <p className="font-medium">{client.kycStatus.replace('_', ' ')}</p>
            </div>
            {client.kycVerifiedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Verified At</p>
                <p className="font-medium">{formatDate(client.kycVerifiedAt)}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {client.kycStatus === KycStatus.UNVERIFIED && (
              <div className="space-y-2 w-full">
                <Input
                  placeholder="Add notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button onClick={handleSubmitForReview} disabled={loading} className="w-full">
                  Submit for Review
                </Button>
              </div>
            )}

            {client.kycStatus === KycStatus.PENDING_REVIEW && canManageKyc && (
              <>
                <Button onClick={() => setShowApproveDialog(true)} disabled={loading} variant="default">
                  Approve KYC
                </Button>
                <Button onClick={() => setShowRejectDialog(true)} disabled={loading} variant="destructive">
                  Reject KYC
                </Button>
              </>
            )}

            {client.kycStatus === KycStatus.VERIFIED && canManageKyc && (
              <Button onClick={() => setShowRiskDialog(true)} variant="outline">
                Update Risk Rating
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Documents</CardTitle>
            {canManageKyc && (
              <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                Upload Document
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground">No documents uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex-1">
                    <p className="font-medium">{doc.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.documentType.replace('_', ' ')} • {(doc.sizeBytes / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                  {canDeleteDocuments && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!client.idNumber} readOnly />
              <span>ID Number Provided</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!client.dateOfBirth} readOnly />
              <span>Date of Birth Provided</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!client.phonePrimary} readOnly />
              <span>Phone Number Provided</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!client.residentialAddress} readOnly />
              <span>Address Provided</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={(client.nextOfKin?.length || 0) > 0} readOnly />
              <span>Next of Kin Added</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={(client.referees?.length || 0) > 0} readOnly />
              <span>Referees Added</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={documents.length > 0} readOnly />
              <span>Documents Uploaded</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC History */}
      <Card>
        <CardHeader>
          <CardTitle>KYC History</CardTitle>
        </CardHeader>
        <CardContent>
          {kycHistory.length === 0 ? (
            <p className="text-muted-foreground">No KYC history yet</p>
          ) : (
            <div className="space-y-4">
              {kycHistory.map((event) => (
                <div key={event.id} className="border-l-2 border-primary pl-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(event.toStatus)}
                    <span className="text-sm text-muted-foreground">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">
                    Changed from <strong>{event.fromStatus}</strong> to <strong>{event.toStatus}</strong>
                  </p>
                  {event.reason && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Reason:</strong> {event.reason}
                    </p>
                  )}
                  {event.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Notes:</strong> {event.notes}
                    </p>
                  )}
                </div>
              ))}
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
