import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

interface BulkApproveModalProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (data: {
    approvedPrincipal: number;
    approvedTermMonths: number;
    approvedInterestRate: number;
    decisionNotes?: string;
  }) => Promise<void>;
}

export function BulkApproveModal({
  open,
  onClose,
  selectedCount,
  onConfirm,
}: BulkApproveModalProps) {
  const [principal, setPrincipal] = useState('');
  const [term, setTerm] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!principal || !term || !rate) return;
    setLoading(true);
    try {
      await onConfirm({
        approvedPrincipal: Number(principal),
        approvedTermMonths: Number(term),
        approvedInterestRate: Number(rate),
        decisionNotes: notes || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPrincipal('');
    setTerm('');
    setRate('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Approve Applications</DialogTitle>
          <DialogDescription>
            Approve {selectedCount} selected application{selectedCount > 1 ? 's' : ''}.
            The same terms will be applied to all.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="principal">Approved Principal *</Label>
            <Input
              id="principal"
              type="number"
              placeholder="e.g. 50000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term">Term (months) *</Label>
            <Input
              id="term"
              type="number"
              placeholder="e.g. 12"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Interest Rate (% per year) *</Label>
            <Input
              id="rate"
              type="number"
              step="0.1"
              placeholder="e.g. 18.0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Decision Notes (optional)</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="Add any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!principal || !term || !rate || loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? 'Processing...' : `Approve ${selectedCount} Application${selectedCount > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BulkRejectModalProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (data: { reason: string; notes?: string }) => Promise<void>;
}

export function BulkRejectModal({
  open,
  onClose,
  selectedCount,
  onConfirm,
}: BulkRejectModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await onConfirm({
        reason,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Reject Applications</DialogTitle>
          <DialogDescription>
            Reject {selectedCount} selected application{selectedCount > 1 ? 's' : ''}.
            The same reason will be applied to all.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Input
              id="reason"
              placeholder="e.g. Insufficient documentation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reject-notes">Additional Notes (optional)</Label>
            <textarea
              id="reject-notes"
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="Add any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || loading}
          >
            {loading ? 'Processing...' : `Reject ${selectedCount} Application${selectedCount > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
