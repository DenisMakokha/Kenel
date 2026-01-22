import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Wallet,
  Search,
  Plus,
  Receipt,
  Calendar,
  CreditCard,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { loanService } from '../services/loanService';
import { repaymentService } from '../services/repaymentService';
import type { Loan } from '../types/loan';
import { LoanStatus } from '../types/loan';
import type { Repayment, CreateRepaymentDto } from '../types/repayment';
import { formatCurrency, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  REVERSED: { label: 'Reversed', color: 'bg-slate-100 text-slate-700', icon: RotateCcw },
};

const CHANNEL_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'M-Pesa',
  CHEQUE: 'Cheque',
};

export default function RepaymentsPage() {
  const [searchParams] = useSearchParams();
  const preselectedLoanId = searchParams.get('loanId');

  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [repaymentsLoading, setRepaymentsLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [showPostDialog, setShowPostDialog] = useState(false);

  const [postForm, setPostForm] = useState<CreateRepaymentDto>({
    amount: 0,
    channel: 'MOBILE_MONEY',
    reference: '',
    valueDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState('');

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    if (preselectedLoanId && loans.length > 0) {
      const loan = loans.find((l) => l.id === preselectedLoanId);
      if (loan) {
        setSelectedLoan(loan);
      }
    }
  }, [preselectedLoanId, loans]);

  useEffect(() => {
    if (selectedLoan) {
      loadRepayments(selectedLoan.id);
    }
  }, [selectedLoan]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await loanService.getLoans({ status: LoanStatus.ACTIVE, page: 1, limit: 100 });
      setLoans(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const loadRepayments = async (loanId: string) => {
    try {
      setRepaymentsLoading(true);
      const response = await repaymentService.getRepayments(loanId, { page: 1, limit: 50 });
      setRepayments(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load repayments');
    } finally {
      setRepaymentsLoading(false);
    }
  };

  const handlePostRepayment = async () => {
    if (!selectedLoan) return;

    try {
      setPostLoading(true);
      setPostError('');
      await repaymentService.postRepayment(selectedLoan.id, postForm);
      setShowPostDialog(false);
      setPostForm({
        amount: 0,
        channel: 'MOBILE_MONEY',
        reference: '',
        valueDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      // Reload repayments and loan
      loadRepayments(selectedLoan.id);
      loadLoans();
    } catch (err: any) {
      setPostError(err.response?.data?.message || 'Failed to post repayment');
    } finally {
      setPostLoading(false);
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

  const totalCollected = repayments
    .filter((r) => r.status === 'APPROVED')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Repayment Management</h1>
          <p className="text-sm text-slate-600">Post and track loan repayments</p>
        </div>
        {selectedLoan && (
          <Button
            onClick={() => setShowPostDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post Repayment
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[350px,1fr]">
        {/* Loan Selection Panel */}
        <div className="space-y-4">
          <Card className="border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Loan</CardTitle>
              <CardDescription>Choose a loan to manage repayments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by loan # or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading loans...</p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredLoans.map((loan) => (
                    <button
                      key={loan.id}
                      onClick={() => setSelectedLoan(loan)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-colors',
                        selectedLoan?.id === loan.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium">{loan.loanNumber}</span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {loan.client?.firstName} {loan.client?.lastName}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-slate-500">Outstanding:</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(Number(loan.outstandingPrincipal) + Number(loan.outstandingInterest))}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Repayments Panel */}
        <div className="space-y-4">
          {selectedLoan ? (
            <>
              {/* Loan Summary */}
              <Card className="border-slate-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedLoan.loanNumber}</CardTitle>
                      <CardDescription>
                        {selectedLoan.client?.firstName} {selectedLoan.client?.lastName}
                      </CardDescription>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Principal</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(Number(selectedLoan.principalAmount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Outstanding</p>
                      <p className="text-lg font-semibold text-amber-600">
                        {formatCurrency(
                          Number(selectedLoan.outstandingPrincipal) +
                            Number(selectedLoan.outstandingInterest)
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Total Repaid</p>
                      <p className="text-lg font-semibold text-emerald-600">
                        {formatCurrency(Number(selectedLoan.totalRepaid))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Interest Rate</p>
                      <p className="text-lg font-semibold">{Number(selectedLoan.interestRate)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Repayments List */}
              <Card className="border-slate-100">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>
                        {repayments.length} payment{repayments.length !== 1 ? 's' : ''} recorded
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Total Collected</p>
                      <p className="text-lg font-semibold text-emerald-600">
                        {formatCurrency(totalCollected)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {repaymentsLoading ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Loading repayments...
                    </p>
                  ) : repayments.length === 0 ? (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No repayments recorded yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setShowPostDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Post First Repayment
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Receipt #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {repayments.map((repayment) => {
                            const statusConfig = STATUS_CONFIG[repayment.status];
                            const StatusIcon = statusConfig?.icon || Clock;
                            return (
                              <TableRow key={repayment.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-slate-400" />
                                    <code className="text-xs font-mono">
                                      {repayment.receiptNumber}
                                    </code>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    {formatDate(repayment.transactionDate)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-semibold text-emerald-600">
                                    {formatCurrency(Number(repayment.amount))}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm">
                                      {CHANNEL_LABELS[repayment.channel] || repayment.channel}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn('font-medium', statusConfig?.color)}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusConfig?.label || repayment.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-slate-500">
                                    {repayment.reference || '—'}
                                  </span>
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
            </>
          ) : (
            <Card className="border-slate-100">
              <CardContent className="py-16 text-center">
                <Wallet className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Loan</h3>
                <p className="text-sm text-slate-500">
                  Choose a loan from the list to view and manage repayments
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Post Repayment Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Post Repayment</DialogTitle>
            <DialogDescription>
              Record a new payment for loan {selectedLoan?.loanNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {postError && (
              <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {postError}
              </div>
            )}

            {selectedLoan && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Outstanding Balance:</span>
                  <span className="font-semibold text-amber-600">
                    {formatCurrency(
                      Number(selectedLoan.outstandingPrincipal) +
                        Number(selectedLoan.outstandingInterest)
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                value={postForm.amount || ''}
                onChange={(e) =>
                  setPostForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                }
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valueDate">Value Date</Label>
              <Input
                id="valueDate"
                type="date"
                value={postForm.valueDate}
                onChange={(e) =>
                  setPostForm((prev) => ({ ...prev, valueDate: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Payment Channel</Label>
              <Select
                value={postForm.channel}
                onValueChange={(value) =>
                  setPostForm((prev) => ({ ...prev, channel: value as CreateRepaymentDto['channel'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOBILE_MONEY">M-Pesa</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                value={postForm.reference}
                onChange={(e) =>
                  setPostForm((prev) => ({ ...prev, reference: e.target.value }))
                }
                placeholder="Transaction reference or receipt number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={postForm.notes}
                onChange={(e) =>
                  setPostForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePostRepayment}
              disabled={postLoading || !postForm.amount || postForm.amount <= 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {postLoading ? 'Posting...' : 'Post Repayment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
