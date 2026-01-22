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
  FileText,
  Search,
  Download,
  Printer,
  Mail,
  Calendar,
  User,
  Phone,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Eye,
  Building2,
  DollarSign,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { clientService } from '../../services/clientService';
import type { Client as ApiClient } from '../../types/client';
import { toast } from 'sonner';

interface Client {
  id: string;
  clientCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  totalLoans: number;
  activeLoans: number;
  totalDisbursed: number;
  totalRepaid: number;
  currentBalance: number;
}

interface Transaction {
  id: string;
  date: string;
  type: 'DISBURSEMENT' | 'REPAYMENT' | 'FEE' | 'PENALTY' | 'REVERSAL' | 'ADJUSTMENT';
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  loanNumber: string;
}

const TRANSACTION_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  DISBURSEMENT: { label: 'Disbursement', color: 'bg-blue-100 text-blue-700' },
  REPAYMENT: { label: 'Repayment', color: 'bg-emerald-100 text-emerald-700' },
  FEE: { label: 'Fee', color: 'bg-amber-100 text-amber-700' },
  PENALTY: { label: 'Penalty', color: 'bg-red-100 text-red-700' },
  REVERSAL: { label: 'Reversal', color: 'bg-purple-100 text-purple-700' },
  ADJUSTMENT: { label: 'Adjustment', color: 'bg-slate-100 text-slate-700' },
};

export default function FinanceStatementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient] = useState<Client | null>(null);
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [transactions] = useState<Transaction[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loanFilter, setLoanFilter] = useState<string>('ALL');
  const [loadingStatement] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setSearching(true);

      const response = await clientService.getClients({ search: searchTerm.trim(), page: 1, limit: 20 });

      const mapped: Client[] = response.data.map((c: ApiClient) => ({
        id: c.id,
        clientCode: c.clientCode,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phonePrimary,
        email: c.email ?? '',
        totalLoans: c._count?.loans ?? 0,
        activeLoans: 0,
        totalDisbursed: 0,
        totalRepaid: 0,
        currentBalance: 0,
      }));

      setClients(mapped);
    } finally {
      setSearching(false);
    }
  };

  const handleViewStatement = async () => {
    toast.error('Client statements are not available yet.');
  };

  const handlePrintStatement = () => {
    if (!selectedClient) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);
      const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
      const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;

      printWindow.document.write(`
        <html>
          <head>
            <title>Client Statement - ${selectedClient.clientCode}</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto; font-size: 12px; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #10b981; }
              .title { font-size: 18px; color: #1e293b; margin-top: 5px; }
              .statement-info { text-align: right; font-size: 11px; color: #64748b; }
              .client-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .client-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
              .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; }
              .info-value { font-weight: 600; color: #1e293b; margin-top: 2px; }
              .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
              .summary-card { padding: 12px; border-radius: 6px; text-align: center; }
              .summary-card.debit { background: #fef2f2; }
              .summary-card.credit { background: #f0fdf4; }
              .summary-card.balance { background: #eff6ff; }
              .summary-label { font-size: 10px; color: #64748b; text-transform: uppercase; }
              .summary-value { font-size: 16px; font-weight: bold; margin-top: 3px; }
              .summary-value.debit { color: #dc2626; }
              .summary-value.credit { color: #16a34a; }
              .summary-value.balance { color: #2563eb; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
              td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
              .text-right { text-align: right; }
              .debit { color: #dc2626; }
              .credit { color: #16a34a; }
              .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; }
              .badge-disbursement { background: #dbeafe; color: #1d4ed8; }
              .badge-repayment { background: #dcfce7; color: #16a34a; }
              .badge-fee { background: #fef3c7; color: #d97706; }
              .badge-penalty { background: #fee2e2; color: #dc2626; }
              .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
              @media print { body { padding: 15px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="logo">KENELS LMS</div>
                <div class="title">Client Account Statement</div>
              </div>
              <div class="statement-info">
                <p>Statement Date: ${formatDate(new Date().toISOString())}</p>
                <p>Period: ${dateFrom || 'All time'} to ${dateTo || 'Present'}</p>
              </div>
            </div>
            
            <div class="client-info">
              <div class="client-grid">
                <div><div class="info-label">Client Name</div><div class="info-value">${selectedClient.firstName} ${selectedClient.lastName}</div></div>
                <div><div class="info-label">Client Code</div><div class="info-value">${selectedClient.clientCode}</div></div>
                <div><div class="info-label">Phone</div><div class="info-value">${selectedClient.phone}</div></div>
                <div><div class="info-label">Email</div><div class="info-value">${selectedClient.email}</div></div>
                <div><div class="info-label">Total Loans</div><div class="info-value">${selectedClient.totalLoans}</div></div>
                <div><div class="info-label">Active Loans</div><div class="info-value">${selectedClient.activeLoans}</div></div>
              </div>
            </div>
            
            <div class="summary-cards">
              <div class="summary-card"><div class="summary-label">Transactions</div><div class="summary-value">${transactions.length}</div></div>
              <div class="summary-card debit"><div class="summary-label">Total Debits</div><div class="summary-value debit">${formatCurrency(totalDebits)}</div></div>
              <div class="summary-card credit"><div class="summary-label">Total Credits</div><div class="summary-value credit">${formatCurrency(totalCredits)}</div></div>
              <div class="summary-card balance"><div class="summary-label">Closing Balance</div><div class="summary-value balance">${formatCurrency(closingBalance)}</div></div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Loan #</th>
                  <th class="text-right">Debit</th>
                  <th class="text-right">Credit</th>
                  <th class="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map(t => `
                  <tr>
                    <td>${formatDate(t.date)}</td>
                    <td><span class="badge badge-${t.type.toLowerCase()}">${TRANSACTION_TYPE_CONFIG[t.type]?.label}</span></td>
                    <td>${t.description}</td>
                    <td style="font-family: monospace; font-size: 10px;">${t.reference}</td>
                    <td style="font-family: monospace; font-size: 10px;">${t.loanNumber}</td>
                    <td class="text-right ${t.debit > 0 ? 'debit' : ''}">${t.debit > 0 ? formatCurrency(t.debit) : '-'}</td>
                    <td class="text-right ${t.credit > 0 ? 'credit' : ''}">${t.credit > 0 ? formatCurrency(t.credit) : '-'}</td>
                    <td class="text-right" style="font-weight: 600;">${formatCurrency(t.balance)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>This is a computer-generated statement and does not require a signature.</p>
              <p>For queries, contact: support@kenels.co.ke | +254 700 000 000</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleEmailStatement = () => {
    if (selectedClient) {
      window.location.href = `mailto:${selectedClient.email}?subject=Account Statement - ${selectedClient.clientCode}&body=Dear ${selectedClient.firstName} ${selectedClient.lastName},%0D%0A%0D%0APlease find attached your account statement.%0D%0A%0D%0ACurrent Balance: ${formatCurrency(selectedClient.currentBalance)}%0D%0A%0D%0AThank you for your continued business.`;
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (loanFilter !== 'ALL' && t.loanNumber !== loanFilter) return false;
    return true;
  });

  const uniqueLoans = [...new Set(transactions.map((t) => t.loanNumber))];
  const totalDebits = filteredTransactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredits = filteredTransactions.reduce((sum, t) => sum + t.credit, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-emerald-600" />
          Client Statements
        </h1>
        <p className="text-sm text-slate-600">
          Generate and view client account statements
        </p>
      </div>

      {/* Search */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-slate-500" />
            Find Client
          </CardTitle>
          <CardDescription>
            Search by client code, name, phone number, or email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Enter client code, name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} className="bg-emerald-600 hover:bg-emerald-700">
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Client Results */}
      {clients.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>Found {clients.length} client(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold text-center">Loans</TableHead>
                    <TableHead className="font-semibold text-right">Total Disbursed</TableHead>
                    <TableHead className="font-semibold text-right">Total Repaid</TableHead>
                    <TableHead className="font-semibold text-right">Balance</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium">{client.firstName} {client.lastName}</p>
                            <code className="text-xs text-slate-500">{client.clientCode}</code>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {client.phone}
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-0.5">
                          <Badge variant="outline">{client.activeLoans} Active</Badge>
                          <p className="text-xs text-slate-500">{client.totalLoans} Total</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{formatCurrency(client.totalDisbursed)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-emerald-600">{formatCurrency(client.totalRepaid)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-semibold', client.currentBalance > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                          {formatCurrency(client.currentBalance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={handleViewStatement}>
                          <Eye className="h-4 w-4 mr-1" />
                          Statement
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {clients.length === 0 && searchTerm && !searching && (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No clients found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Statement Dialog */}
      <Dialog open={showStatementDialog} onOpenChange={setShowStatementDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-white">Account Statement</DialogTitle>
                <p className="text-emerald-100 text-sm mt-1">
                  {selectedClient?.firstName} {selectedClient?.lastName} ({selectedClient?.clientCode})
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </DialogHeader>

          {selectedClient && (
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Client Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                    <CreditCard className="h-3 w-3" />
                    Total Disbursed
                  </div>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedClient.totalDisbursed)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1">
                    <ArrowDownRight className="h-3 w-3" />
                    Total Repaid
                  </div>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(selectedClient.totalRepaid)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
                    <DollarSign className="h-3 w-3" />
                    Current Balance
                  </div>
                  <p className="text-lg font-bold text-amber-700">{formatCurrency(selectedClient.currentBalance)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-600 text-xs mb-1">
                    <Building2 className="h-3 w-3" />
                    Active Loans
                  </div>
                  <p className="text-lg font-bold text-blue-700">{selectedClient.activeLoans}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-4 items-end">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">From Date</label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">To Date</label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Loan</label>
                    <Select value={loanFilter} onValueChange={setLoanFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Loans" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Loans</SelectItem>
                        {uniqueLoans.map((loan) => (
                          <SelectItem key={loan} value={loan}>{loan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Summary Row */}
              <div className="flex items-center justify-between bg-slate-100 rounded-lg px-4 py-3">
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-slate-600">{filteredTransactions.length} transactions</span>
                  <span className="flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                    Debits: <span className="font-semibold text-red-600">{formatCurrency(totalDebits)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                    Credits: <span className="font-semibold text-emerald-600">{formatCurrency(totalCredits)}</span>
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              {loadingStatement ? (
                <div className="text-center py-12">
                  <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-slate-500">Loading statement...</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Loan #</TableHead>
                        <TableHead className="font-semibold text-right">Debit</TableHead>
                        <TableHead className="font-semibold text-right">Credit</TableHead>
                        <TableHead className="font-semibold text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-700">No statement transactions available</p>
                              <p className="text-xs text-slate-500">
                                Statements require the accounting/ledger backend to be implemented.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredTransactions.map((txn) => {
                        const typeConfig = TRANSACTION_TYPE_CONFIG[txn.type];
                        return (
                          <TableRow key={txn.id}>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {formatDate(txn.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('font-medium', typeConfig?.color)}>
                                {typeConfig?.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{txn.description}</p>
                                <code className="text-xs text-slate-400">{txn.reference}</code>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs font-mono">{txn.loanNumber}</code>
                            </TableCell>
                            <TableCell className="text-right">
                              {txn.debit > 0 ? (
                                <span className="font-medium text-red-600">{formatCurrency(txn.debit)}</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {txn.credit > 0 ? (
                                <span className="font-medium text-emerald-600">{formatCurrency(txn.credit)}</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold">{formatCurrency(txn.balance)}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handlePrintStatement}
                  disabled={transactions.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Statement
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleEmailStatement}
                  disabled={transactions.length === 0}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email to Client
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
