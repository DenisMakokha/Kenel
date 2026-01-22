import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { portalService } from '../../services/portalService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from 'sonner';

export default function PortalLoanDetailPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();

  const [loan, setLoan] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loanId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [loanRes, schedRes, txRes] = await Promise.all([
          portalService.getLoan(loanId),
          portalService.getLoanSchedule(loanId),
          portalService.getLoanTransactions(loanId),
        ]);
        setLoan(loanRes);
        setSchedule(schedRes);
        setTransactions(txRes);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load loan details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loanId]);

  const handleDownloadReceipt = async (repaymentId: string, receiptNumber: string) => {
    if (!loanId) return;
    try {
      const blob = await portalService.downloadReceipt(loanId, repaymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to download receipt');
    }
  };

  if (loading) {
    return <p className="text-xs text-muted-foreground">Loading loan...</p>;
  }

  if (error || !loan) {
    return (
      <div className="space-y-2">
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded text-xs">
            {error}
          </div>
        )}
        <Button size="sm" variant="outline" onClick={() => navigate('/portal/loans')}>
          Back to My Loans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">
            Loan {loan.loanNumber} – {loan.productName}
          </h1>
          <p className="text-xs text-muted-foreground">Status: {loan.status}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate('/portal/loans')}>
          Back to My Loans
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1">
          <div>Principal disbursed: {loan.principal.toLocaleString('en-KE')} KES</div>
          <div>Outstanding: {loan.outstanding.toLocaleString('en-KE')} KES</div>
          {loan.disbursedAt && (
            <div>Disbursed on: {new Date(loan.disbursedAt).toLocaleDateString('en-KE')}</div>
          )}
          {loan.nextDueDate && (
            <div>Next payment due: {new Date(loan.nextDueDate).toLocaleDateString('en-KE')}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <p className="text-xs text-muted-foreground">No schedule available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.installmentNumber}</TableCell>
                    <TableCell>{new Date(s.dueDate).toLocaleDateString('en-KE')}</TableCell>
                    <TableCell>{Number(s.principalDue).toLocaleString('en-KE')}</TableCell>
                    <TableCell>{Number(s.interestDue).toLocaleString('en-KE')}</TableCell>
                    <TableCell>{Number(s.totalDue).toLocaleString('en-KE')}</TableCell>
                    <TableCell>{s.isPaid ? 'PAID' : s.isOverdue ? 'OVERDUE' : 'PENDING'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Repayments</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No repayments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {new Date(tx.transactionDate).toLocaleDateString('en-KE')}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const dec: any = tx.amount;
                        const num =
                          typeof dec === 'number' ? dec : dec.toNumber?.() ?? Number(dec);
                        return num.toLocaleString('en-KE');
                      })()}{' '}
                      KES
                    </TableCell>
                    <TableCell>{tx.channel}</TableCell>
                    <TableCell>{tx.reference || '-'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadReceipt(tx.id, tx.receiptNumber)}
                      >
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
