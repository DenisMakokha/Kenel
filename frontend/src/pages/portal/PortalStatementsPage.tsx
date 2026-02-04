import { useEffect, useState } from 'react';
import { portalService } from '../../services/portalService';
import type { PortalLoanSummary } from '../../types/portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  FileText,
  Download,
  Receipt,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

interface PaymentReceipt {
  id: string;
  loanId: string;
  receiptNumber: string;
  loanNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: 'COMPLETED' | 'PENDING';
}

export default function PortalStatementsPage() {
  const [loans, setLoans] = useState<PortalLoanSummary[]>([]);
  const [loanId, setLoanId] = useState('');
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('3m');
  const [loading, setLoading] = useState(false);
  const [loansLoading, setLoansLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'statements' | 'receipts'>('statements');
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoansLoading(true);
        const result = await portalService.getLoans();
        setLoans(result);
        if (result.length > 0) {
          setLoanId(result[0].id);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load loans');
      } finally {
        setLoansLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadReceipts = async () => {
      if (activeTab !== 'receipts') return;
      if (!loanId) {
        setReceipts([]);
        return;
      }

      try {
        setReceiptsLoading(true);
        setError('');
        const txs: any[] = await portalService.getLoanTransactions(loanId);
        const loan = loans.find((l) => l.id === loanId);
        const mapped: PaymentReceipt[] = (txs || [])
          .filter((t) => Boolean(t.receiptNumber))
          .map((t) => ({
            id: t.id,
            loanId: loanId,
            receiptNumber: t.receiptNumber,
            loanNumber: loan?.loanNumber || '',
            amount: typeof t.amount === 'number' ? t.amount : t.amount?.toNumber?.() ?? Number(t.amount),
            paymentDate: t.transactionDate,
            paymentMethod: t.channel,
            status: 'COMPLETED',
          }));
        setReceipts(mapped);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load receipts');
        setReceipts([]);
      } finally {
        setReceiptsLoading(false);
      }
    };

    loadReceipts();
  }, [activeTab, loanId, loans]);

  const handleGenerate = async () => {
    if (!loanId || loading) return;
    try {
      setError('');
      setLoading(true);

      const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - months);

      const from = fromDate.toISOString();
      const to = toDate.toISOString();

      const blob = await portalService.downloadStatement(loanId, from, to);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const loan = loans.find((l) => l.id === loanId);
      a.href = url;
      a.download = `statement-${loan?.loanNumber || 'loan'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate statement');
    } finally {
      setLoading(false);
    }
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleViewReceipt = (receipt: PaymentReceipt) => {
    const viewWindow = window.open('', '_blank');
    if (!viewWindow) return;
    
    viewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${receipt.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; background: #f8fafc; }
            .receipt-card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #10b981; }
            .receipt-title { font-size: 18px; color: #64748b; margin-top: 10px; }
            .receipt-number { font-size: 14px; color: #94a3b8; }
            .details { margin: 30px 0; }
            .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
            .label { color: #64748b; }
            .value { font-weight: 600; }
            .amount { font-size: 28px; color: #10b981; text-align: center; margin: 30px 0; }
            .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; }
            .status { display: inline-block; padding: 4px 12px; background: #d1fae5; color: #059669; border-radius: 20px; font-size: 12px; }
            .actions { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .btn { padding: 10px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; margin: 0 8px; }
            .btn-primary { background: #10b981; color: white; }
            .btn-secondary { background: #f1f5f9; color: #475569; }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="header">
              <div class="logo">KENELS BUREAU</div>
              <div class="receipt-title">Payment Receipt</div>
              <div class="receipt-number">${receipt.receiptNumber}</div>
            </div>
            <div class="amount">
              <div style="font-size: 14px; color: #64748b;">Amount Paid</div>
              <div>KES ${receipt.amount.toLocaleString()}</div>
            </div>
            <div class="details">
              <div class="row">
                <span class="label">Loan Number</span>
                <span class="value">${receipt.loanNumber}</span>
              </div>
              <div class="row">
                <span class="label">Payment Date</span>
                <span class="value">${new Date(receipt.paymentDate).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="row">
                <span class="label">Payment Method</span>
                <span class="value">${receipt.paymentMethod}</span>
              </div>
              <div class="row">
                <span class="label">Status</span>
                <span class="status">Completed</span>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>For inquiries, contact support@kenels.co.ke</p>
            </div>
            <div class="actions">
              <button class="btn btn-primary" onclick="window.print()">Print</button>
              <button class="btn btn-secondary" onclick="window.close()">Close</button>
            </div>
          </div>
        </body>
      </html>
    `);
    viewWindow.document.close();
  };

  const handleDownloadReceipt = async (receipt: PaymentReceipt) => {
    try {
      setDownloadingId(receipt.id);
      const blob = await portalService.downloadReceipt(receipt.loanId, receipt.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receipt.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Statements & Receipts</h1>
        <p className="text-sm text-slate-500">Generate account statements and view payment receipts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('statements')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'statements'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          Statements
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'receipts'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="h-4 w-4" />
          Receipts
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">{receipts.length}</Badge>
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Statements Tab */}
      {activeTab === 'statements' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Generate Statement Card */}
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Generate Statement</CardTitle>
                  <CardDescription>Download a PDF statement for your loan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Select Loan</label>
                  <select
                    className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={loanId}
                    onChange={(e) => setLoanId(e.target.value)}
                  >
                    {loansLoading ? (
                      <option>Loading loans...</option>
                    ) : loans.length === 0 ? (
                      <option>No loans available</option>
                    ) : (
                      loans.map((loan) => (
                        <option key={loan.id} value={loan.id}>
                          {loan.loanNumber} – {loan.productName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Statement Period</label>
                  <select
                    className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                  >
                    <option value="3m">Last 3 months</option>
                    <option value="6m">Last 6 months</option>
                    <option value="12m">Last 12 months</option>
                  </select>
                </div>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading || loansLoading || loans.length === 0}
                onClick={handleGenerate}
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Download Statement (PDF)'}
              </Button>
              <p className="text-xs text-slate-500">
                Statements include all transactions, payments, and balances for the selected period.
              </p>
            </CardContent>
          </Card>

          {/* Statement Info Card */}
          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg">What's Included</CardTitle>
              <CardDescription>Your statement contains the following information</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Account Summary</p>
                    <p className="text-xs text-slate-500">Opening balance, total payments, and current balance</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Transaction History</p>
                    <p className="text-xs text-slate-500">All payments and charges during the period</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Payment Schedule</p>
                    <p className="text-xs text-slate-500">Upcoming payments and due dates</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Interest Breakdown</p>
                    <p className="text-xs text-slate-500">Principal vs interest allocation</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receipts Tab */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {receiptsLoading ? (
            <Card className="border-slate-200 bg-white">
              <CardContent className="py-12 text-center">
                <div className="h-8 w-32 bg-slate-100 rounded mx-auto animate-pulse" />
              </CardContent>
            </Card>
          ) : receipts.length === 0 ? (
            <Card className="border-slate-200 bg-white">
              <CardContent className="py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1">No Receipts Yet</h3>
                <p className="text-sm text-slate-500">
                  Payment receipts will appear here after you make payments.
                </p>
              </CardContent>
            </Card>
          ) : (
            receipts.map((receipt) => (
              <Card key={receipt.id} className="border-slate-200 bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Receipt className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900">{formatCurrency(receipt.amount)}</h3>
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {receipt.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 font-mono">{receipt.receiptNumber}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(receipt.paymentDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {receipt.paymentMethod}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {receipt.loanNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewReceipt(receipt)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleDownloadReceipt(receipt)}
                        disabled={downloadingId === receipt.id}
                      >
                        {downloadingId === receipt.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        {downloadingId === receipt.id ? 'Downloading...' : 'Download'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
