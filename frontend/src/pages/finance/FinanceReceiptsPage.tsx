import { useState } from 'react';
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
  Search,
  Eye,
  Download,
  Printer,
  CheckCircle,
  Calendar,
  Receipt,
  XCircle,
  Mail,
  Phone,
  Building2,
  FileText,
  CreditCard,
  Hash,
  User,
  Clock,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { repaymentService } from '../../services/repaymentService';
import type { Repayment } from '../../types/repayment';

interface ReceiptData {
  id: string;
  receiptNumber: string;
  date: string;
  time: string;
  loanNumber: string;
  loanProduct: string;
  clientName: string;
  clientCode: string;
  clientPhone: string;
  clientEmail: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  feesPaid: number;
  penaltiesPaid: number;
  channel: string;
  referenceNumber: string;
  postedBy: string;
  balanceBefore: number;
  balanceAfter: number;
  status: 'VALID' | 'CANCELLED';
}

const CHANNEL_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  MPESA: { label: 'M-Pesa', color: 'bg-green-100 text-green-700', icon: '📱' },
  BANK_TRANSFER: { label: 'Bank Transfer', color: 'bg-blue-100 text-blue-700', icon: '🏦' },
  CASH: { label: 'Cash', color: 'bg-slate-100 text-slate-700', icon: '💵' },
  CHEQUE: { label: 'Cheque', color: 'bg-amber-100 text-amber-700', icon: '📝' },
};

export default function FinanceReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searching, setSearching] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim() && !dateFrom && !dateTo) return;

    try {
      setSearching(true);

      const typedSearch = searchTerm.trim();
      const search = typedSearch ? typedSearch : undefined;

      const response = await repaymentService.getAllRepayments({
        search,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: 1,
        limit: 50,
      });

      const mapped: ReceiptData[] = response.data.map((repayment: Repayment) => {
        const dt = new Date(repayment.transactionDate);
        const clientName = repayment.loan?.client
          ? `${repayment.loan.client.firstName} ${repayment.loan.client.lastName}`
          : 'Unknown Client';

        const principalPaid = repayment.allocation ? Number(repayment.allocation.principalAmount) : 0;
        const interestPaid = repayment.allocation ? Number(repayment.allocation.interestAmount) : 0;
        const feesPaid = repayment.allocation ? Number(repayment.allocation.feesAmount) : 0;
        const penaltiesPaid = repayment.allocation ? Number(repayment.allocation.penaltiesAmount) : 0;

        return {
          id: repayment.id,
          receiptNumber: repayment.receiptNumber,
          date: dt.toISOString().slice(0, 10),
          time: dt.toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          loanNumber: repayment.loan?.loanNumber || repayment.loanId,
          loanProduct: 'N/A',
          clientName,
          clientCode: repayment.loan?.client?.clientCode || 'N/A',
          clientPhone: repayment.loan?.client?.phonePrimary || 'N/A',
          clientEmail: repayment.loan?.client?.email || 'N/A',
          amount: Number(repayment.amount),
          principalPaid,
          interestPaid,
          feesPaid,
          penaltiesPaid,
          channel: repayment.channel === 'MOBILE_MONEY' ? 'MPESA' : repayment.channel,
          referenceNumber: repayment.reference || repayment.receiptNumber,
          postedBy: repayment.postedBy,
          balanceBefore: 0,
          balanceAfter: 0,
          status: repayment.status === 'REVERSED' ? 'CANCELLED' : 'VALID',
        };
      });

      setReceipts(
        searchType === 'all'
          ? mapped
          : mapped.filter((r) => {
              const term = (typedSearch || '').toLowerCase();
              if (!term) return true;
              if (searchType === 'receipt') return r.receiptNumber.toLowerCase().includes(term);
              if (searchType === 'loan') return r.loanNumber.toLowerCase().includes(term);
              if (searchType === 'client') return r.clientName.toLowerCase().includes(term);
              if (searchType === 'reference') return r.referenceNumber.toLowerCase().includes(term);
              return true;
            }),
      );
    } finally {
      setSearching(false);
    }
  };

  const handleViewReceipt = (receipt: ReceiptData) => {
    setSelectedReceipt(receipt);
    setShowReceiptDialog(true);
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById('receipt-print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${selectedReceipt?.receiptNumber}</title>
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 15px; }
                .logo { font-size: 24px; font-weight: bold; color: #10b981; }
                .subtitle { color: #64748b; font-size: 12px; }
                .section { margin: 15px 0; padding: 10px 0; border-bottom: 1px dashed #e2e8f0; }
                .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 13px; }
                .label { color: #64748b; }
                .value { font-weight: 500; }
                .amount { font-size: 20px; font-weight: bold; color: #10b981; text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px; margin: 15px 0; }
                .breakdown { background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 12px; }
                .breakdown-row { display: flex; justify-content: space-between; margin: 3px 0; }
                .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; }
                .cancelled { background: #fef2f2; color: #dc2626; text-align: center; padding: 10px; font-weight: bold; border-radius: 6px; margin: 10px 0; }
                .qr-placeholder { text-align: center; padding: 20px; border: 1px dashed #e2e8f0; margin: 15px 0; color: #94a3b8; font-size: 11px; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleEmailReceipt = () => {
    if (selectedReceipt) {
      window.location.href = `mailto:${selectedReceipt.clientEmail}?subject=Payment Receipt ${selectedReceipt.receiptNumber}&body=Dear ${selectedReceipt.clientName},%0D%0A%0D%0APlease find attached your payment receipt for ${formatCurrency(selectedReceipt.amount)}.%0D%0A%0D%0AReceipt Number: ${selectedReceipt.receiptNumber}%0D%0ALoan Number: ${selectedReceipt.loanNumber}%0D%0ADate: ${formatDate(selectedReceipt.date)}%0D%0A%0D%0AThank you for your payment.`;
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedReceipt) return;

    const blob = await repaymentService.downloadReceiptGlobal(selectedReceipt.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${selectedReceipt.receiptNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-emerald-600" />
            Receipt Lookup
          </h1>
          <p className="text-sm text-slate-600">
            Search, view, and print payment receipts
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FileText className="h-4 w-4" />
          <span>{receipts.length} receipt(s) found</span>
        </div>
      </div>

      {/* Search */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-slate-500" />
            Search Receipts
          </CardTitle>
          <CardDescription>
            Find receipts by receipt number, loan number, client name, or transaction reference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-2">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="receipt">Receipt #</SelectItem>
                  <SelectItem value="loan">Loan #</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Enter search term..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
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
              <Button onClick={handleSearch} disabled={searching} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {receipts.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  Found {receipts.length} receipt(s) matching your search
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Receipt #</TableHead>
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Loan</TableHead>
                    <TableHead className="font-semibold text-right">Amount</TableHead>
                    <TableHead className="font-semibold">Channel</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => {
                    const channelConfig = CHANNEL_CONFIG[receipt.channel] || CHANNEL_CONFIG.CASH;

                    return (
                      <TableRow key={receipt.id} className="hover:bg-slate-50">
                        <TableCell>
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded font-medium">
                            {receipt.receiptNumber}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {formatDate(receipt.date)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {receipt.time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm">{receipt.clientName}</p>
                            <code className="text-xs text-slate-500">{receipt.clientCode}</code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <code className="text-xs font-mono text-slate-700">{receipt.loanNumber}</code>
                            <p className="text-xs text-slate-500">{receipt.loanProduct}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(receipt.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('font-medium', channelConfig.color)}>
                            <span className="mr-1">{channelConfig.icon}</span>
                            {channelConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              'font-medium',
                              receipt.status === 'VALID'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {receipt.status === 'VALID' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {receipt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReceipt(receipt)}
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
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {receipts.length === 0 && searchTerm && !searching && (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No receipts found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Professional Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-white">Payment Receipt</DialogTitle>
                <p className="text-emerald-100 text-sm mt-1">
                  {selectedReceipt?.receiptNumber}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="p-6 space-y-5">
              {/* Hidden print content */}
              <div id="receipt-print-content" className="hidden">
                <div className="header">
                  <div className="logo">Kenels LMS</div>
                  <div className="subtitle">Official Payment Receipt</div>
                </div>
                <div className="section">
                  <div className="row"><span className="label">Receipt No:</span><span className="value">{selectedReceipt.receiptNumber}</span></div>
                  <div className="row"><span className="label">Date:</span><span className="value">{formatDate(selectedReceipt.date)} {selectedReceipt.time}</span></div>
                </div>
                <div className="section">
                  <div className="row"><span className="label">Client:</span><span className="value">{selectedReceipt.clientName}</span></div>
                  <div className="row"><span className="label">Client Code:</span><span className="value">{selectedReceipt.clientCode}</span></div>
                  <div className="row"><span className="label">Phone:</span><span className="value">{selectedReceipt.clientPhone}</span></div>
                </div>
                <div className="section">
                  <div className="row"><span className="label">Loan No:</span><span className="value">{selectedReceipt.loanNumber}</span></div>
                  <div className="row"><span className="label">Product:</span><span className="value">{selectedReceipt.loanProduct}</span></div>
                </div>
                <div className="amount">Amount Paid: {formatCurrency(selectedReceipt.amount)}</div>
                <div className="breakdown">
                  <div className="breakdown-row"><span>Principal:</span><span>{formatCurrency(selectedReceipt.principalPaid)}</span></div>
                  <div className="breakdown-row"><span>Interest:</span><span>{formatCurrency(selectedReceipt.interestPaid)}</span></div>
                  <div className="breakdown-row"><span>Fees:</span><span>{formatCurrency(selectedReceipt.feesPaid)}</span></div>
                  <div className="breakdown-row"><span>Penalties:</span><span>{formatCurrency(selectedReceipt.penaltiesPaid)}</span></div>
                </div>
                <div className="section">
                  <div className="row"><span className="label">Channel:</span><span className="value">{CHANNEL_CONFIG[selectedReceipt.channel]?.label}</span></div>
                  <div className="row"><span className="label">Reference:</span><span className="value">{selectedReceipt.referenceNumber}</span></div>
                  <div className="row"><span className="label">Balance Before:</span><span className="value">{formatCurrency(selectedReceipt.balanceBefore)}</span></div>
                  <div className="row"><span className="label">Balance After:</span><span className="value">{formatCurrency(selectedReceipt.balanceAfter)}</span></div>
                </div>
                <div className="section">
                  <div className="row"><span className="label">Posted By:</span><span className="value">{selectedReceipt.postedBy}</span></div>
                </div>
                {selectedReceipt.status === 'CANCELLED' && <div className="cancelled">⚠️ THIS RECEIPT HAS BEEN CANCELLED</div>}
                <div className="qr-placeholder">[QR Code for verification]</div>
                <div className="footer">
                  <p>Thank you for your payment</p>
                  <p>This is a computer-generated receipt and is valid without signature</p>
                  <p>For queries, contact: support@kenels.co.ke | +254 700 000 000</p>
                </div>
              </div>

              {/* Visible receipt content */}
              {selectedReceipt.status === 'CANCELLED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">This receipt has been cancelled</span>
                </div>
              )}

              {/* Client Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Client Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-medium">{selectedReceipt.clientName}</p>
                      <p className="text-xs text-slate-500">{selectedReceipt.clientCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{selectedReceipt.clientPhone}</span>
                  </div>
                </div>
              </div>

              {/* Loan Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Loan Number</p>
                    <p className="font-mono font-medium">{selectedReceipt.loanNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Product</p>
                    <p className="font-medium">{selectedReceipt.loanProduct}</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">Amount Paid</p>
                <p className="text-3xl font-bold text-emerald-700">{formatCurrency(selectedReceipt.amount)}</p>
              </div>

              {/* Breakdown */}
              <div className="border rounded-lg divide-y">
                <div className="px-4 py-2 flex justify-between text-sm">
                  <span className="text-slate-600">Principal</span>
                  <span className="font-medium">{formatCurrency(selectedReceipt.principalPaid)}</span>
                </div>
                <div className="px-4 py-2 flex justify-between text-sm">
                  <span className="text-slate-600">Interest</span>
                  <span className="font-medium">{formatCurrency(selectedReceipt.interestPaid)}</span>
                </div>
                <div className="px-4 py-2 flex justify-between text-sm">
                  <span className="text-slate-600">Fees</span>
                  <span className="font-medium">{formatCurrency(selectedReceipt.feesPaid)}</span>
                </div>
                <div className="px-4 py-2 flex justify-between text-sm">
                  <span className="text-slate-600">Penalties</span>
                  <span className="font-medium">{formatCurrency(selectedReceipt.penaltiesPaid)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Payment Channel</p>
                    <Badge className={cn('mt-1', CHANNEL_CONFIG[selectedReceipt.channel]?.color)}>
                      {CHANNEL_CONFIG[selectedReceipt.channel]?.icon} {CHANNEL_CONFIG[selectedReceipt.channel]?.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Reference</p>
                    <code className="text-xs font-mono">{selectedReceipt.referenceNumber}</code>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Balance Before</p>
                    <p className="font-semibold text-slate-700">{formatCurrency(selectedReceipt.balanceBefore)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Balance After</p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(selectedReceipt.balanceAfter)}</p>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(selectedReceipt.date)} {selectedReceipt.time}
                </div>
                <div>Posted by: {selectedReceipt.postedBy}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={handlePrintReceipt}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleEmailReceipt}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleDownloadPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
