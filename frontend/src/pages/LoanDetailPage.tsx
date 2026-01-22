import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loanService } from '../services/loanService';
import { repaymentService } from '../services/repaymentService';
import { auditLogService } from '../services/auditLogService';
import type { Loan, LoanSchedule } from '../types/loan';
import { LoanStatus } from '../types/loan';
import type { Repayment } from '../types/repayment';
import { RepaymentChannel, RepaymentStatus } from '../types/repayment';
import type { AuditLog } from '../types/audit';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { formatCurrency, formatDate } from '../lib/utils';

export default function LoanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disbursing, setDisbursing] = useState(false);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [repaymentsLoading, setRepaymentsLoading] = useState(false);
  const [repaymentError, setRepaymentError] = useState('');
  const [postingRepayment, setPostingRepayment] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [showReverseDialog, setShowReverseDialog] = useState(false);
  const [repaymentToReverse, setRepaymentToReverse] = useState<Repayment | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reversing, setReversing] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [repaymentForm, setRepaymentForm] = useState({
    valueDate: today,
    amount: '',
    channel: RepaymentChannel.CASH,
    reference: '',
    notes: '',
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await loanService.getLoan(id);
        setLoan(data);

        try {
          setRepaymentsLoading(true);
          const list = await repaymentService.getRepayments(id, { page: 1, limit: 20 });
          setRepayments(list.data);
        } catch (err: any) {
          // Do not override main error; keep local to repayments
          setRepaymentError(err.response?.data?.message || 'Failed to load repayments');
        } finally {
          setRepaymentsLoading(false);
        }

        try {
          setAuditLoading(true);
          const logs = await auditLogService.getForLoan(id, { page: 1, limit: 50 });
          setAuditLogs(logs.data);
        } catch (err: any) {
          setAuditError(err.response?.data?.message || 'Failed to load audit logs');
        } finally {
          setAuditLoading(false);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load loan');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const getStatusBadge = (status: LoanStatus) => {
    const variants: Record<LoanStatus, any> = {
      PENDING_DISBURSEMENT: 'warning',
      ACTIVE: 'success',
      DUE: 'warning',
      IN_ARREARS: 'destructive',
      CLOSED: 'outline',
      WRITTEN_OFF: 'destructive',
      RESTRUCTURED: 'secondary',
    };

    const labels: Record<LoanStatus, string> = {
      PENDING_DISBURSEMENT: 'Pending Disbursement',
      ACTIVE: 'Active',
      DUE: 'Due',
      IN_ARREARS: 'In Arrears',
      CLOSED: 'Closed',
      WRITTEN_OFF: 'Written Off',
      RESTRUCTURED: 'Restructured',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const handleDisburse = async () => {
    if (!loan) return;
    try {
      setError('');
      setDisbursing(true);
      await loanService.disburseLoan(loan.id);
      const updated = await loanService.getLoan(loan.id);
      setLoan(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disburse loan');
    } finally {
      setDisbursing(false);
    }
  };

  const handleRepaymentChange = (
    field: 'valueDate' | 'amount' | 'channel' | 'reference' | 'notes',
    value: string,
  ) => {
    setRepaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePostRepayment = async () => {
    if (!loan) return;
    const amountNumber = Number(repaymentForm.amount || 0);
    if (!amountNumber || amountNumber <= 0) {
      setRepaymentError('Amount must be greater than zero');
      return;
    }
    try {
      setRepaymentError('');
      setPostingRepayment(true);
      await repaymentService.postRepayment(loan.id, {
        valueDate: repaymentForm.valueDate,
        amount: amountNumber,
        channel: repaymentForm.channel,
        reference: repaymentForm.reference || undefined,
        notes: repaymentForm.notes || undefined,
      });

      const updatedLoan = await loanService.getLoan(loan.id);
      setLoan(updatedLoan);
      const list = await repaymentService.getRepayments(loan.id, { page: 1, limit: 20 });
      setRepayments(list.data);
      setRepaymentForm((prev) => ({
        ...prev,
        amount: '',
        reference: '',
        notes: '',
      }));
    } catch (err: any) {
      setRepaymentError(err.response?.data?.message || 'Failed to post repayment');
    } finally {
      setPostingRepayment(false);
    }
  };

  const handleDownloadReceipt = async (repayment: Repayment) => {
    if (!loan) return;
    try {
      const blob = await repaymentService.downloadReceipt(loan.id, repayment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${repayment.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setRepaymentError(err.response?.data?.message || 'Failed to download receipt');
    }
  };

  const openReverseDialog = (repayment: Repayment) => {
    setRepaymentError('');
    setRepaymentToReverse(repayment);
    setReverseReason('');
    setShowReverseDialog(true);
  };

  const handleConfirmReverse = async () => {
    if (!loan || !repaymentToReverse) return;
    if (!reverseReason.trim()) {
      setRepaymentError('Reversal reason is required');
      return;
    }
    try {
      setReversing(true);
      setRepaymentError('');
      await repaymentService.reverseRepayment(loan.id, repaymentToReverse.id, reverseReason.trim());
      const updatedLoan = await loanService.getLoan(loan.id);
      setLoan(updatedLoan);
      const list = await repaymentService.getRepayments(loan.id, { page: 1, limit: 20 });
      setRepayments(list.data);
      setShowReverseDialog(false);
      setRepaymentToReverse(null);
      setReverseReason('');
    } catch (err: any) {
      setRepaymentError(err.response?.data?.message || 'Failed to reverse repayment');
    } finally {
      setReversing(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-6">Loading loan...</div>;
  }

  if (!loan) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Loan</h1>
          <Button variant="outline" size="sm" onClick={() => navigate('/loans')}>
            Back to Loans
          </Button>
        </div>
        <p className="text-destructive">{error || 'Loan not found'}</p>
      </div>
    );
  }

  const schedules: LoanSchedule[] = loan.schedules || [];

  const canDisburse =
    user &&
    (user.role === UserRole.ADMIN || user.role === UserRole.FINANCE_OFFICER) &&
    loan.status === LoanStatus.PENDING_DISBURSEMENT;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Loan {loan.loanNumber}</h1>
          <p className="text-muted-foreground text-sm">
            Client:{' '}
            {loan.client
              ? `${loan.client.firstName} ${loan.client.lastName} (${loan.client.clientCode})`
              : loan.clientId}
          </p>
          <p className="text-muted-foreground text-sm">
            From Application: {loan.application?.applicationNumber || loan.applicationId}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(loan.status)}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/loans')}>
              Back to Loans
            </Button>
            {canDisburse && (
              <Button size="sm" onClick={handleDisburse} disabled={disbursing}>
                {disbursing ? 'Disbursing...' : 'Disburse Loan'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="repayments">Repayments</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Principal</p>
                  <p className="font-semibold">{loan.principalAmount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-semibold">{loan.interestRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Term</p>
                  <p className="font-semibold">{loan.termMonths} months</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Interest</p>
                  <p className="font-semibold">{loan.totalInterest}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">{loan.totalAmount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Outstanding Principal</p>
                  <p className="font-semibold">{loan.outstandingPrincipal}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <p className="text-sm text-muted-foreground">Loading audit logs...</p>
              ) : auditError ? (
                <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded text-sm">
                  {auditError}
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit events for this loan yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      let summary = '';
                      const oldVal = log.oldValue as any;
                      const newVal = log.newValue as any;

                      if (log.entity === 'repayments') {
                        if (newVal?.status === 'REVERSED') {
                          summary = 'Repayment reversed';
                          if (newVal.reversalReason) {
                            summary += ` - ${newVal.reversalReason}`;
                          }
                        }
                      }

                      if (!summary && log.entity === 'loans') {
                        if (oldVal?.status && newVal?.status && oldVal.status !== newVal.status) {
                          summary = `Loan status ${oldVal.status} -> ${newVal.status}`;
                        }
                      }

                      if (!summary && (log.entity === 'loan_schedules' || log.entity === 'loan_schedule')) {
                        const oldPaid = oldVal?.isPaid;
                        const newPaid = newVal?.isPaid;
                        if (oldPaid === false && newPaid === true) {
                          const inst = newVal?.installmentNumber ?? oldVal?.installmentNumber;
                          summary = inst
                            ? `Installment #${inst} marked PAID`
                            : 'Installment marked PAID';
                        }
                      }

                      if (!summary && log.entity === 'loan_applications') {
                        if (oldVal?.status && newVal?.status && oldVal.status !== newVal.status) {
                          summary = `Application status ${oldVal.status} -> ${newVal.status}`;
                        }
                      }

                      if (!summary && oldVal?.status && newVal?.status && oldVal.status !== newVal.status) {
                        summary = `Status ${oldVal.status} -> ${newVal.status}`;
                      }

                      if (!summary && log.action === 'CREATE') {
                        summary = `Created ${log.entity}`;
                      }

                      if (!summary && log.action === 'DELETE') {
                        summary = `Deleted ${log.entity}`;
                      }

                      return (
                        <TableRow key={log.id}>
                          <TableCell>{formatDate(log.createdAt)}</TableCell>
                          <TableCell>{log.entity}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>
                            {log.user
                              ? `${log.user.firstName} ${log.user.lastName}`
                              : log.performedBy.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {summary || `ID: ${log.entityId.slice(0, 8)}...`}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Repayment Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground">No schedule found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Principal Due</TableHead>
                      <TableHead className="text-right">Interest Due</TableHead>
                      <TableHead className="text-right">Fees Due</TableHead>
                      <TableHead className="text-right">Total Due</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.installmentNumber}</TableCell>
                        <TableCell>{formatDate(s.dueDate)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(s.principalDue), undefined)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(s.interestDue), undefined)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(s.feesDue), undefined)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(s.totalDue), undefined)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(s.balance), undefined)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {s.isPaid
                            ? 'PAID'
                            : s.isOverdue
                            ? `OVERDUE (${s.daysPastDue} days)`
                            : 'PENDING'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repayments" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Post Repayment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {repaymentError && (
                  <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded">
                    {repaymentError}
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-muted-foreground">Outstanding</p>
                  <p className="font-semibold">
                    Principal: {loan.outstandingPrincipal} • Interest: {loan.outstandingInterest}{' '}
                    • Fees: {loan.outstandingFees}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Value Date</p>
                    <input
                      type="date"
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      value={repaymentForm.valueDate}
                      onChange={(e) => handleRepaymentChange('valueDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                    <input
                      type="number"
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      value={repaymentForm.amount}
                      onChange={(e) => handleRepaymentChange('amount', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Channel</p>
                    <select
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      value={repaymentForm.channel}
                      onChange={(e) =>
                        handleRepaymentChange('channel', e.target.value as RepaymentChannel)
                      }
                    >
                      <option value={RepaymentChannel.CASH}>Cash</option>
                      <option value={RepaymentChannel.BANK_TRANSFER}>Bank Transfer</option>
                      <option value={RepaymentChannel.MOBILE_MONEY}>Mobile Money</option>
                      <option value={RepaymentChannel.CHEQUE}>Cheque</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reference</p>
                    <input
                      type="text"
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      value={repaymentForm.reference}
                      onChange={(e) => handleRepaymentChange('reference', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <textarea
                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                    value={repaymentForm.notes}
                    onChange={(e) => handleRepaymentChange('notes', e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This payment will be allocated according to product rules order
                  (penalties → fees → interest → principal).
                </p>
                {(user?.role === UserRole.ADMIN || user?.role === UserRole.FINANCE_OFFICER) ? (
                  <div className="flex justify-end">
                    <Button onClick={handlePostRepayment} disabled={postingRepayment} size="sm">
                      {postingRepayment ? 'Posting...' : 'Post & Generate Receipt'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    You do not have permission to post repayments on this loan.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Repayment History</CardTitle>
              </CardHeader>
              <CardContent>
                {repaymentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading repayments...</p>
                ) : repayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No repayments posted yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repayments.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{formatDate(r.transactionDate)}</TableCell>
                          <TableCell>{r.amount}</TableCell>
                          <TableCell>{r.channel}</TableCell>
                          <TableCell>{r.reference || '-'}</TableCell>
                          <TableCell className="text-xs">
                            {r.status}
                            {r.status === RepaymentStatus.REVERSED && (
                              <div className="mt-1 text-[11px] text-muted-foreground">
                                {r.reversedAt && <>On {formatDate(r.reversedAt)} </>}
                                {r.reversedBy && <>• by {r.reversedBy.slice(0, 8)}</>}
                                {r.reversalReason && (
                                  <>
                                    <br />
                                    Reason: {r.reversalReason}
                                  </>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{r.receiptNumber}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadReceipt(r)}
                              >
                                Receipt
                              </Button>
                              {user?.role === UserRole.ADMIN &&
                                r.status === RepaymentStatus.APPROVED && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openReverseDialog(r)}
                                  >
                                    Reverse
                                  </Button>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={showReverseDialog}
        onOpenChange={(open) => {
          setShowReverseDialog(open);
          if (!open) {
            setRepaymentToReverse(null);
            setReverseReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reverse repayment</DialogTitle>
            <DialogDescription>
              This will mark the receipt as reversed and recompute the loan schedule and balances.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {repaymentToReverse && (
              <>
                <p>
                  Receipt{' '}
                  <span className="font-mono">{repaymentToReverse.receiptNumber}</span>
                </p>
                <p>
                  Date: {formatDate(repaymentToReverse.transactionDate)} • Amount:{' '}
                  {repaymentToReverse.amount}
                </p>
              </>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reversal reason</p>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReverseDialog(false)}
              disabled={reversing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmReverse}
              disabled={reversing}
            >
              {reversing ? 'Reversing...' : 'Confirm Reversal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
