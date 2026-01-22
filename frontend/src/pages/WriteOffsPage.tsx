import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
  FileX,
  Search,
  AlertTriangle,
  Calendar,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { loanService } from '../services/loanService';
import type { Loan } from '../types/loan';
import { LoanStatus } from '../types/loan';
import { formatCurrency, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

interface WriteOff {
  id: string;
  loan: Loan;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

// Helper to calculate max days past due from loan schedules
function getMaxDaysPastDue(loan: Loan): number {
  if (!loan.schedules || loan.schedules.length === 0) return 0;
  return Math.max(...loan.schedules.filter(s => s.isOverdue).map(s => s.daysPastDue || 0), 0);
}

export default function WriteOffsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showWriteOffDialog, setShowWriteOffDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [writeOffForm, setWriteOffForm] = useState({
    reason: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get loans that are candidates for write-off (severely delinquent)
      const response = await loanService.getLoans({ status: LoanStatus.ACTIVE, page: 1, limit: 100 });
      
      // Filter to loans with significant arrears (90+ days overdue)
      const delinquentLoans = response.data.filter((loan) => {
        return getMaxDaysPastDue(loan) >= 90;
      });
      
      setLoans(delinquentLoans);
      setWriteOffs([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateWriteOff = (loan: Loan) => {
    setSelectedLoan(loan);
    setWriteOffForm({ reason: '', notes: '' });
    setShowWriteOffDialog(true);
  };

  const handleSubmitWriteOff = async () => {
    if (!selectedLoan || !writeOffForm.reason) return;

    try {
      setSubmitting(true);
      setError('Write-off requests are not available yet.');
      setShowWriteOffDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit write-off request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLoans = searchTerm
    ? loans.filter(
        (loan) =>
          loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.client?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.client?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : loans;

  const totalWriteOffAmount = writeOffs
    .filter((w) => w.status === 'APPROVED')
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingWriteOffs = writeOffs.filter((w) => w.status === 'PENDING').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Write-offs Management</h1>
          <p className="text-sm text-slate-600">
            Manage loan write-offs for severely delinquent accounts
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Eligible Loans</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loans.length}</p>
            <p className="text-xs text-muted-foreground">90+ days overdue</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{pendingWriteOffs}</p>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Written Off</CardTitle>
            <FileX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalWriteOffAmount)}
            </p>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">At Risk Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(
                loans.reduce(
                  (sum, l) =>
                    sum + Number(l.outstandingPrincipal) + Number(l.outstandingInterest),
                  0
                )
              )}
            </p>
            <p className="text-xs text-muted-foreground">Total outstanding</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Write-off Requests */}
      {writeOffs.length > 0 && (
        <Card className="border-slate-100">
          <CardHeader>
            <CardTitle>Write-off Requests</CardTitle>
            <CardDescription>Pending and processed write-off requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {writeOffs.map((writeOff) => {
                    const statusConfig = STATUS_CONFIG[writeOff.status];
                    const StatusIcon = statusConfig?.icon || Clock;
                    return (
                      <TableRow key={writeOff.id}>
                        <TableCell>
                          <code className="text-xs font-mono">
                            {writeOff.loan.loanNumber}
                          </code>
                        </TableCell>
                        <TableCell>
                          {writeOff.loan.client?.firstName} {writeOff.loan.client?.lastName}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(writeOff.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">{writeOff.reason}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('font-medium', statusConfig?.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {formatDate(writeOff.requestedAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Eligible Loans */}
      <Card className="border-slate-100">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Loans Eligible for Write-off</CardTitle>
              <CardDescription>
                Loans that are 90+ days past due and may be considered for write-off
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Loading eligible loans...
            </p>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No loans currently eligible for write-off
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <code className="text-xs font-mono">{loan.loanNumber}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>
                            {loan.client?.firstName} {loan.client?.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(
                            Number(loan.outstandingPrincipal) + Number(loan.outstandingInterest)
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {getMaxDaysPastDue(loan)} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-3 w-3" />
                          {loan.lastPaymentDate ? formatDate(loan.lastPaymentDate) : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInitiateWriteOff(loan)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <FileX className="h-4 w-4 mr-1" />
                          Write Off
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write-off Dialog */}
      <Dialog open={showWriteOffDialog} onOpenChange={setShowWriteOffDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Initiate Write-off</DialogTitle>
            <DialogDescription>
              Submit a write-off request for loan {selectedLoan?.loanNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedLoan && (
              <div className="rounded-lg bg-red-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Client:</span>
                  <span className="font-medium">
                    {selectedLoan.client?.firstName} {selectedLoan.client?.lastName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Outstanding Amount:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(
                      Number(selectedLoan.outstandingPrincipal) +
                        Number(selectedLoan.outstandingInterest)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Days Overdue:</span>
                  <span className="font-medium">{getMaxDaysPastDue(selectedLoan)} days</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Write-off *</Label>
              <Input
                id="reason"
                value={writeOffForm.reason}
                onChange={(e) =>
                  setWriteOffForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="e.g., Client deceased, Bankruptcy, Untraceable"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Input
                id="notes"
                value={writeOffForm.notes}
                onChange={(e) =>
                  setWriteOffForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Any additional information..."
              />
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Important</p>
                  <p>
                    This action requires approval from a senior officer. The loan will remain
                    active until the write-off is approved.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWriteOffDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitWriteOff}
              disabled={submitting || !writeOffForm.reason}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Submitting...' : 'Submit Write-off Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
