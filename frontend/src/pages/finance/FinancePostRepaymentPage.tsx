import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Wallet,
  Search,
  CheckCircle,
  AlertTriangle,
  User,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { loanService } from '../../services/loanService';
import { repaymentService } from '../../services/repaymentService';
import { LoanStatus } from '../../types/loan';
import type { Loan } from '../../types/loan';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

const PAYMENT_CHANNELS = [
  { value: 'MOBILE_MONEY', label: 'M-Pesa', icon: '📱' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
  { value: 'CASH', label: 'Cash', icon: '💵' },
  { value: 'CHEQUE', label: 'Cheque', icon: '📝' },
];

export default function FinancePostRepaymentPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    channel: 'MOBILE_MONEY',
    referenceNumber: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setSearching(true);
      setError('');
      const response = await loanService.getLoans({
        status: LoanStatus.ACTIVE,
        search: searchTerm.trim(),
        page: 1,
        limit: 10,
      });

      setSearchResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search loans');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleSubmitPayment = async () => {
    if (!selectedLoan || !paymentForm.amount) return;

    try {
      setSubmitting(true);
      setError('');

      await repaymentService.postRepayment(selectedLoan.id, {
        amount: parseFloat(paymentForm.amount),
        channel: paymentForm.channel,
        reference: paymentForm.referenceNumber || undefined,
        valueDate: paymentForm.paymentDate,
        notes: paymentForm.notes || undefined,
      });

      // Refresh the selected loan to get updated balances
      const refreshedLoan = await loanService.getLoan(selectedLoan.id);
      setSelectedLoan(refreshedLoan);

      setSuccess(true);
      setShowConfirmDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post repayment');
      setShowConfirmDialog(false);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedLoan(null);
    setPaymentForm({
      amount: '',
      channel: 'MOBILE_MONEY',
      referenceNumber: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setSuccess(false);
    setError('');
  };

  const getNextDueAmount = (loan: Loan): number => {
    if (!loan.schedules) return 0;
    // Find the first unpaid schedule
    const nextDue = loan.schedules.find((s) => !s.isPaid);
    if (!nextDue) return 0;
    return Number(nextDue.principalDue || 0) + Number(nextDue.interestDue || 0) + Number(nextDue.feesDue || 0) - Number(nextDue.principalPaid || 0) - Number(nextDue.interestPaid || 0) - Number(nextDue.feesPaid || 0);
  };

  const getTotalOutstanding = (loan: Loan): number => {
    return Number(loan.outstandingPrincipal || 0) + 
           Number(loan.outstandingInterest || 0) + 
           Number(loan.outstandingFees || 0) + 
           Number(loan.outstandingPenalties || 0);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-4 md:px-6 py-4">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-800">Payment Posted Successfully!</h2>
                <p className="text-sm text-emerald-700 mt-1">
                  {formatCurrency(parseFloat(paymentForm.amount))} has been posted to loan {selectedLoan?.loanNumber}
                </p>
                {selectedLoan && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500">New Outstanding Balance</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(getTotalOutstanding(selectedLoan))}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Post Another Payment
                </Button>
                {selectedLoan && getTotalOutstanding(selectedLoan) > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPaymentForm({
                        amount: '',
                        channel: 'MOBILE_MONEY',
                        referenceNumber: '',
                        paymentDate: new Date().toISOString().slice(0, 10),
                        notes: '',
                      });
                      setSuccess(false);
                    }}
                  >
                    Pay Same Loan
                  </Button>
                )}
                <Button
                  onClick={() => navigate(`/loans/${selectedLoan?.id}`)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  View Loan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Post Repayment</h1>
        <p className="text-sm text-slate-600">
          Record a loan repayment from a client
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Loan Search & Selection */}
        <div className="space-y-6">
          {/* Search */}
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Loan
              </CardTitle>
              <CardDescription>
                Search by loan number, client name, or phone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Enter loan number or client name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {searchResults.map((loan) => (
                    <div
                      key={loan.id}
                      onClick={() => handleSelectLoan(loan)}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {loan.client?.firstName} {loan.client?.lastName}
                          </p>
                          <code className="text-xs text-slate-500">{loan.loanNumber}</code>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-600">
                            {formatCurrency(Number(loan.outstandingPrincipal || 0))}
                          </p>
                          <p className="text-xs text-slate-500">Outstanding</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Loan Details */}
          {selectedLoan && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Selected Loan</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLoan(null)}>
                    Change
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedLoan.client?.firstName} {selectedLoan.client?.lastName}
                    </p>
                    <code className="text-xs text-slate-500">{selectedLoan.loanNumber}</code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-white">
                    <p className="text-xs text-slate-500">Outstanding Balance</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(getTotalOutstanding(selectedLoan))}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white">
                    <p className="text-xs text-slate-500">Next Due Amount</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(getNextDueAmount(selectedLoan))}
                    </p>
                  </div>
                </div>

                {selectedLoan.schedules?.some((s) => s.isOverdue) && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-100 text-amber-800 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    This loan has overdue payments
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Payment Form */}
        <Card className={cn('border-slate-100', !selectedLoan && 'opacity-50 pointer-events-none')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Enter the repayment information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (KES) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="pl-9 text-lg font-semibold"
                />
              </div>
              {selectedLoan && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentForm({ ...paymentForm, amount: getNextDueAmount(selectedLoan).toString() })}
                  >
                    Next Due: {formatCurrency(getNextDueAmount(selectedLoan))}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentForm({ ...paymentForm, amount: getTotalOutstanding(selectedLoan).toString() })}
                  >
                    Full Balance
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Channel *</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_CHANNELS.map((channel) => (
                  <div
                    key={channel.value}
                    onClick={() => setPaymentForm({ ...paymentForm, channel: channel.value })}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all',
                      paymentForm.channel === channel.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span className="text-xl">{channel.icon}</span>
                    <span className="font-medium text-sm">{channel.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={paymentForm.referenceNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                placeholder="e.g., M-Pesa transaction code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Optional notes..."
              />
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
              disabled={!selectedLoan || !paymentForm.amount}
              onClick={() => setShowConfirmDialog(true)}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Post Payment
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Please verify the payment details before posting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-4 rounded-lg bg-slate-50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Loan Number</span>
                <span className="font-mono">{selectedLoan?.loanNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Client</span>
                <span className="font-medium">
                  {selectedLoan?.client?.firstName} {selectedLoan?.client?.lastName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Amount</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(parseFloat(paymentForm.amount || '0'))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Channel</span>
                <span>{PAYMENT_CHANNELS.find((c) => c.value === paymentForm.channel)?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Date</span>
                <span>{paymentForm.paymentDate}</span>
              </div>
              {paymentForm.referenceNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Reference</span>
                  <span className="font-mono">{paymentForm.referenceNumber}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Posting...' : 'Confirm & Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
