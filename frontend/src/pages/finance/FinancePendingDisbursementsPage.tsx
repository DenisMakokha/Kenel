import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Banknote, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { loanService } from '../../services/loanService';
import { LoanStatus } from '../../types/loan';
import type { Loan } from '../../types/loan';
import { formatCurrency } from '../../lib/utils';

export default function FinancePendingDisbursementsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disbursing, setDisbursing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await loanService.getLoans({
        status: LoanStatus.PENDING_DISBURSEMENT,
        search: searchTerm.trim() || undefined,
        page,
        limit: 20,
      });

      setLoans(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load pending disbursements');
      setLoans([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  const openConfirm = (loan: Loan) => {
    setSelectedLoan(loan);
    setConfirmOpen(true);
  };

  const doDisburse = async () => {
    if (!selectedLoan) return;

    try {
      setDisbursing(true);
      setError('');
      await loanService.disburseLoan(selectedLoan.id);
      setConfirmOpen(false);
      setSelectedLoan(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to disburse loan');
      setConfirmOpen(false);
    } finally {
      setDisbursing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Disbursements</h1>
          <p className="text-sm text-slate-600">Loans approved and awaiting disbursement</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Queue
          </CardTitle>
          <CardDescription>Disburse approved loans to activate them</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by loan number or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : loans.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No loans pending disbursement</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div>
                            <code className="text-xs text-slate-500">{loan.loanNumber}</code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {loan.client?.firstName} {loan.client?.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{loan.client?.clientCode}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {formatCurrency(Number(loan.principalAmount || 0))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">PENDING_DISBURSEMENT</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/loans/${loan.id}`)}
                            >
                              View
                            </Button>
                            <Button size="sm" onClick={() => openConfirm(loan)}>
                              Disburse
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Disbursement</DialogTitle>
            <DialogDescription>
              This will activate the loan and allow repayments to be posted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Loan</span>
              <span className="font-mono">{selectedLoan?.loanNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Client</span>
              <span className="font-medium">
                {selectedLoan?.client?.firstName} {selectedLoan?.client?.lastName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Principal</span>
              <span className="font-semibold">
                {formatCurrency(Number(selectedLoan?.principalAmount || 0))}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={disbursing}>
              Cancel
            </Button>
            <Button onClick={doDisburse} disabled={disbursing}>
              {disbursing ? 'Disbursing...' : 'Confirm & Disburse'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
