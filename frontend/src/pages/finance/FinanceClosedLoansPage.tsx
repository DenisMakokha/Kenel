import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  CheckCircle2,
  Search,
  Eye,
  Download,
  FileText,
  Calendar,
  User,
  Phone,
  Mail,
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { exportToExcel } from '../../lib/exportUtils';
import { loanService } from '../../services/loanService';
import { LoanStatus } from '../../types/loan';

interface ClosedLoan {
  id: string;
  loanNumber: string;
  clientName: string;
  clientCode: string;
  clientPhone: string;
  clientEmail: string;
  loanProduct: string;
  disbursedAmount: number;
  totalRepaid: number;
  principalRepaid: number;
  interestRepaid: number;
  feesRepaid: number;
  penaltiesRepaid: number;
  disbursementDate: string;
  closureDate: string;
  closureType: 'FULLY_PAID' | 'EARLY_SETTLEMENT' | 'WRITTEN_OFF' | 'RESTRUCTURED';
  tenure: number;
  actualTenure: number;
  interestRate: number;
  totalPayments: number;
}

const CLOSURE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  FULLY_PAID: { label: 'Fully Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  EARLY_SETTLEMENT: { label: 'Early Settlement', color: 'bg-blue-100 text-blue-700', icon: TrendingUp },
  WRITTEN_OFF: { label: 'Written Off', color: 'bg-red-100 text-red-700', icon: FileText },
  RESTRUCTURED: { label: 'Restructured', color: 'bg-amber-100 text-amber-700', icon: Building2 },
};

export default function FinanceClosedLoansPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<ClosedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [closureTypeFilter, setClosureTypeFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState<ClosedLoan | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    loadClosedLoans();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, closureTypeFilter, dateFrom, dateTo]);

  const loadClosedLoans = async () => {
    try {
      setLoading(true);
      setError('');

      const [closedRes, writtenOffRes, restructuredRes] = await Promise.all([
        loanService.getLoans({ status: LoanStatus.CLOSED, page: 1, limit: 1000 }),
        loanService.getLoans({ status: LoanStatus.WRITTEN_OFF, page: 1, limit: 1000 }),
        loanService.getLoans({ status: LoanStatus.RESTRUCTURED, page: 1, limit: 1000 }),
      ]);

      const all = [...closedRes.data, ...writtenOffRes.data, ...restructuredRes.data];

      const mapped: ClosedLoan[] = all.map((loan) => {
        const principalAmount = Number(loan.principalAmount) || 0;
        const totalAmount = Number(loan.totalAmount) || 0;

        const outstandingPrincipal = Number(loan.outstandingPrincipal) || 0;
        const outstandingInterest = Number(loan.outstandingInterest) || 0;
        const outstandingFees = Number(loan.outstandingFees) || 0;
        const outstandingPenalties = Number(loan.outstandingPenalties) || 0;

        const totalOutstanding =
          outstandingPrincipal + outstandingInterest + outstandingFees + outstandingPenalties;

        const totalRepaid = totalOutstanding > 0 ? Math.max(0, totalAmount - totalOutstanding) : totalAmount;

        const disbursementDate = loan.disbursedAt ? loan.disbursedAt.slice(0, 10) : '';
        const closureDate = (loan.closedAt || loan.updatedAt).slice(0, 10);

        const clientName = loan.client ? `${loan.client.firstName} ${loan.client.lastName}` : 'Unknown Client';

        const closureType: ClosedLoan['closureType'] =
          loan.status === LoanStatus.WRITTEN_OFF
            ? 'WRITTEN_OFF'
            : loan.status === LoanStatus.RESTRUCTURED
              ? 'RESTRUCTURED'
              : 'FULLY_PAID';

        return {
          id: loan.id,
          loanNumber: loan.loanNumber,
          clientName,
          clientCode: loan.client?.clientCode || '',
          clientPhone: '',
          clientEmail: '',
          loanProduct: '',
          disbursedAmount: principalAmount,
          totalRepaid,
          principalRepaid: principalAmount,
          interestRepaid: Number(loan.totalInterest) || 0,
          feesRepaid: 0,
          penaltiesRepaid: 0,
          disbursementDate,
          closureDate,
          closureType,
          tenure: loan.termMonths,
          actualTenure: loan.termMonths,
          interestRate: Number(loan.interestRate) || 0,
          totalPayments: 0,
        };
      });

      setLoans(mapped);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to load closed loans. Please try again.',
      );
      setLoans([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLoan = (loan: ClosedLoan) => {
    setSelectedLoan(loan);
    setShowDetailDialog(true);
  };

  const handlePrintCertificate = () => {
    if (!selectedLoan) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Loan Closure Certificate - ${selectedLoan.loanNumber}</title>
            <style>
              body { font-family: 'Georgia', serif; padding: 40px; max-width: 700px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 3px double #10b981; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #10b981; letter-spacing: 2px; }
              .title { font-size: 22px; margin-top: 15px; color: #1e293b; }
              .certificate-no { font-size: 12px; color: #64748b; margin-top: 5px; }
              .content { line-height: 1.8; font-size: 14px; }
              .highlight { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
              .detail-item { padding: 10px; background: #f8fafc; border-radius: 6px; }
              .detail-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
              .detail-value { font-size: 14px; font-weight: 600; color: #1e293b; margin-top: 3px; }
              .amount-box { text-align: center; padding: 25px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 10px; margin: 25px 0; }
              .amount-label { font-size: 12px; opacity: 0.9; }
              .amount-value { font-size: 32px; font-weight: bold; margin-top: 5px; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
              .signature-line { margin-top: 50px; display: flex; justify-content: space-between; }
              .signature { text-align: center; width: 200px; }
              .signature-line-inner { border-top: 1px solid #1e293b; margin-bottom: 5px; }
              .signature-name { font-size: 12px; color: #64748b; }
              .seal { text-align: center; margin-top: 30px; padding: 15px; border: 2px solid #10b981; border-radius: 50%; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin-left: auto; margin-right: auto; }
              .seal-text { font-size: 10px; color: #10b981; font-weight: bold; }
              .disclaimer { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 30px; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">KENELS LMS</div>
              <div class="title">LOAN CLOSURE CERTIFICATE</div>
              <div class="certificate-no">Certificate No: CERT-${selectedLoan.loanNumber}-${Date.now()}</div>
            </div>

            <div class="content">
              <p>This is to certify that the loan facility detailed below has been <strong>fully settled</strong> and closed in our records.</p>
              
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-label">Borrower Name</div>
                  <div class="detail-value">${selectedLoan.clientName}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Client Code</div>
                  <div class="detail-value">${selectedLoan.clientCode}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Loan Number</div>
                  <div class="detail-value">${selectedLoan.loanNumber}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Loan Product</div>
                  <div class="detail-value">${selectedLoan.loanProduct}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Disbursement Date</div>
                  <div class="detail-value">${formatDate(selectedLoan.disbursementDate)}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Closure Date</div>
                  <div class="detail-value">${formatDate(selectedLoan.closureDate)}</div>
                </div>
              </div>
              
              <div class="amount-box">
                <div class="amount-label">TOTAL AMOUNT REPAID</div>
                <div class="amount-value">${formatCurrency(selectedLoan.totalRepaid)}</div>
              </div>
              
              <div class="highlight">
                <strong>Payment Summary:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                  <li>Principal Repaid: ${formatCurrency(selectedLoan.principalRepaid)}</li>
                  <li>Interest Repaid: ${formatCurrency(selectedLoan.interestRepaid)}</li>
                  <li>Fees Repaid: ${formatCurrency(selectedLoan.feesRepaid)}</li>
                  <li>Penalties Repaid: ${formatCurrency(selectedLoan.penaltiesRepaid)}</li>
                </ul>
              </div>
              
              <p>The borrower has fulfilled all obligations under the loan agreement. There are <strong>no outstanding amounts</strong> due on this account.</p>
            </div>
            
            <div class="footer">
              <div class="signature-line">
                <div class="signature">
                  <div class="signature-line-inner"></div>
                  <div class="signature-name">Authorized Signatory</div>
                </div>
                <div class="seal">
                  <div class="seal-text">OFFICIAL<br/>SEAL</div>
                </div>
                <div class="signature">
                  <div class="signature-line-inner"></div>
                  <div class="signature-name">Date</div>
                </div>
              </div>
            </div>
            
            <div class="disclaimer">
              This certificate is computer-generated and is valid without physical signature when verified through our online portal.
              <br/>For verification, contact: support@kenels.co.ke | +254 700 000 000
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch = !searchTerm ||
      loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.clientCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = closureTypeFilter === 'ALL' || loan.closureType === closureTypeFilter;

    const closureDateValue = loan.closureDate ? new Date(loan.closureDate).getTime() : null;
    const fromValue = dateFrom ? new Date(dateFrom).getTime() : null;
    const toValue = dateTo ? new Date(dateTo).getTime() : null;
    const matchesDateFrom = fromValue === null || (closureDateValue !== null && closureDateValue >= fromValue);
    const matchesDateTo = toValue === null || (closureDateValue !== null && closureDateValue <= toValue);

    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });

  const pageSize = 20;
  const pagedLoans = filteredLoans.slice((page - 1) * pageSize, page * pageSize);
  const computedTotalPages = Math.ceil(filteredLoans.length / pageSize) || 1;

  useEffect(() => {
    setTotalPages(computedTotalPages);
    if (page > computedTotalPages) {
      setPage(computedTotalPages);
    }
  }, [computedTotalPages, page]);

  // Stats
  const totalClosed = filteredLoans.length;
  const totalDisbursed = filteredLoans.reduce((sum, l) => sum + l.disbursedAmount, 0);
  const totalCollected = filteredLoans.reduce((sum, l) => sum + l.totalRepaid, 0);
  const fullyPaidCount = filteredLoans.filter((l) => l.closureType === 'FULLY_PAID').length;

  const handleExport = () => {
    exportToExcel({
      filename: 'closed_loans_report',
      columns: [
        { key: 'loanNumber', header: 'Loan Number' },
        { key: 'clientName', header: 'Client Name' },
        { key: 'clientCode', header: 'Client Code' },
        { key: 'loanProduct', header: 'Product' },
        { key: 'disbursedAmount', header: 'Disbursed', formatter: (v) => v?.toFixed(2) || '0.00' },
        { key: 'totalRepaid', header: 'Total Repaid', formatter: (v) => v?.toFixed(2) || '0.00' },
        { key: 'disbursementDate', header: 'Disbursement Date', formatter: (v) => v ? formatDate(v) : '' },
        { key: 'closureDate', header: 'Closure Date', formatter: (v) => v ? formatDate(v) : '' },
        { key: 'closureType', header: 'Closure Type', formatter: (v) => CLOSURE_TYPE_CONFIG[v]?.label || v },
        { key: 'tenure', header: 'Tenure (Days)' },
        { key: 'actualTenure', header: 'Actual Tenure (Days)' },
      ],
      data: filteredLoans,
      title: 'Closed Loans Report',
      subtitle: `Generated on ${formatDate(new Date())}`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            Closed Loans
          </h1>
          <p className="text-sm text-slate-600">
            View and manage fully repaid and settled loans
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Closed</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClosed}</p>
            <p className="text-xs text-muted-foreground">Loans settled</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDisbursed)}</p>
            <p className="text-xs text-muted-foreground">Original loan amounts</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCollected)}</p>
            <p className="text-xs text-muted-foreground">Including interest & fees</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Fully Paid</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fullyPaidCount}</p>
            <p className="text-xs text-muted-foreground">
              {totalClosed > 0 ? Math.round((fullyPaidCount / totalClosed) * 100) : 0}% of closed loans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by loan number, client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="md:col-span-2">
              <Select value={closureTypeFilter} onValueChange={setClosureTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Closure Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="FULLY_PAID">Fully Paid</SelectItem>
                  <SelectItem value="EARLY_SETTLEMENT">Early Settlement</SelectItem>
                  <SelectItem value="WRITTEN_OFF">Written Off</SelectItem>
                  <SelectItem value="RESTRUCTURED">Restructured</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Input
                type="date"
                placeholder="From"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                type="date"
                placeholder="To"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Button variant="outline" className="w-full" onClick={loadClosedLoans}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Closed Loans</CardTitle>
          <CardDescription>
            {filteredLoans.length} loan(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-slate-500">Loading...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No closed loans found</h3>
              <p className="text-sm text-slate-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold">Loan #</TableHead>
                      <TableHead className="font-semibold">Client</TableHead>
                      <TableHead className="font-semibold">Product</TableHead>
                      <TableHead className="font-semibold text-right">Disbursed</TableHead>
                      <TableHead className="font-semibold text-right">Total Repaid</TableHead>
                      <TableHead className="font-semibold">Closure Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedLoans.map((loan) => {
                      const closureConfig = CLOSURE_TYPE_CONFIG[loan.closureType];
                      const ClosureIcon = closureConfig?.icon || CheckCircle2;

                      return (
                        <TableRow key={loan.id} className="hover:bg-slate-50">
                          <TableCell>
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded font-medium">
                              {loan.loanNumber}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium text-sm">{loan.clientName}</p>
                              <code className="text-xs text-slate-500">{loan.clientCode}</code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{loan.loanProduct}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium">{formatCurrency(loan.disbursedAmount)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-emerald-600">
                              {formatCurrency(loan.totalRepaid)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {formatDate(loan.closureDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('font-medium', closureConfig?.color)}>
                              <ClosureIcon className="h-3 w-3 mr-1" />
                              {closureConfig?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewLoan(loan)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
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

      {/* Loan Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-white">Closed Loan Details</DialogTitle>
                <p className="text-emerald-100 text-sm mt-1">
                  {selectedLoan?.loanNumber}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </DialogHeader>

          {selectedLoan && (
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Client Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-medium">{selectedLoan.clientName}</p>
                      <p className="text-xs text-slate-500">{selectedLoan.clientCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{selectedLoan.clientPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{selectedLoan.clientEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>{selectedLoan.loanProduct}</span>
                  </div>
                </div>
              </div>

              {/* Loan Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">Disbursed Amount</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(selectedLoan.disbursedAmount)}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">Total Repaid</p>
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(selectedLoan.totalRepaid)}</p>
                </div>
              </div>

              {/* Repayment Breakdown */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Repayment Breakdown</h4>
                <div className="border rounded-lg divide-y">
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-slate-600">Principal Repaid</span>
                    <span className="font-medium">{formatCurrency(selectedLoan.principalRepaid)}</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-slate-600">Interest Repaid</span>
                    <span className="font-medium">{formatCurrency(selectedLoan.interestRepaid)}</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-slate-600">Fees Repaid</span>
                    <span className="font-medium">{formatCurrency(selectedLoan.feesRepaid)}</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-slate-600">Penalties Repaid</span>
                    <span className="font-medium">{formatCurrency(selectedLoan.penaltiesRepaid)}</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between text-sm bg-slate-50 font-semibold">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatCurrency(selectedLoan.totalRepaid)}</span>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Disbursement Date</p>
                  <p className="font-medium">{formatDate(selectedLoan.disbursementDate)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Closure Date</p>
                  <p className="font-medium">{formatDate(selectedLoan.closureDate)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Closure Type</p>
                  <Badge className={cn('mt-1', CLOSURE_TYPE_CONFIG[selectedLoan.closureType]?.color)}>
                    {CLOSURE_TYPE_CONFIG[selectedLoan.closureType]?.label}
                  </Badge>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Interest Rate</p>
                  <p className="font-medium">{selectedLoan.interestRate}% p.a.</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Tenure</p>
                  <p className="font-medium">{selectedLoan.actualTenure} / {selectedLoan.tenure} months</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Total Payments</p>
                  <p className="font-medium">{selectedLoan.totalPayments} payments</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handlePrintCertificate}>
                  <Award className="h-4 w-4 mr-2" />
                  Print Closure Certificate
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate(`/loans/${selectedLoan.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Full History
                </Button>
                <Button variant="outline" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
