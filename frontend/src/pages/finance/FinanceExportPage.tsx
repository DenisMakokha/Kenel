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
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Download,
  FileSpreadsheet,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  History,
  Filter,
  Play,
  Pause,
  Trash2,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import {
  exportToQuickBooks,
  exportToSage,
  exportToXero,
  exportToExcel,
  exportToCSV,
} from '../../lib/exportUtils';
import { repaymentService } from '../../services/repaymentService';
import { toast } from 'sonner';

interface ExportJob {
  id: string;
  name: string;
  type: 'DISBURSEMENTS' | 'REPAYMENTS' | 'FEES' | 'JOURNAL_ENTRIES' | 'ALL_TRANSACTIONS';
  system: 'quickbooks' | 'sage' | 'xero' | 'excel' | 'csv';
  dateFrom: string;
  dateTo: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'PROCESSING';
  recordCount: number;
  exportedAt: string;
  exportedBy: string;
  fileSize?: string;
}

interface AccountMapping {
  id: string;
  transactionType: string;
  debitAccount: string;
  debitCode: string;
  creditAccount: string;
  creditCode: string;
}

interface ScheduledExport {
  id: string;
  name: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  system: string;
  exportType: string;
  nextRun: string;
  lastRun: string;
  isActive: boolean;
}

const EXPORT_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: RefreshCw },
};

const ACCOUNTING_SYSTEMS = [
  { value: 'quickbooks', label: 'QuickBooks', icon: '📊' },
  { value: 'sage', label: 'Sage', icon: '📈' },
  { value: 'xero', label: 'Xero', icon: '📉' },
  { value: 'excel', label: 'Excel', icon: '📗' },
  { value: 'csv', label: 'CSV', icon: '📄' },
];

const EXPORT_TYPES = [
  { value: 'DISBURSEMENTS', label: 'Loan Disbursements' },
  { value: 'REPAYMENTS', label: 'Loan Repayments' },
  { value: 'FEES', label: 'Fees & Charges' },
  { value: 'JOURNAL_ENTRIES', label: 'Journal Entries' },
  { value: 'ALL_TRANSACTIONS', label: 'All Transactions' },
];

export default function FinanceExportPage() {
  const [activeTab, setActiveTab] = useState('export');
  const [selectedSystem, setSelectedSystem] = useState<string>('quickbooks');
  const [selectedExportType, setSelectedExportType] = useState<string>('ALL_TRANSACTIONS');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const [exportHistory] = useState<ExportJob[]>([]);
  const [accountMappings] = useState<AccountMapping[]>([]);
  const [scheduledExports] = useState<ScheduledExport[]>([]);

  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select a date range');
      return;
    }

    setExporting(true);

    // Build account mappings object
    const mappings: Record<string, string> = {};
    accountMappings.forEach(m => {
      mappings[`${m.transactionType}_DEBIT`] = m.debitCode;
      mappings[`${m.transactionType}_CREDIT`] = m.creditCode;
    });

    try {
      if (selectedExportType !== 'REPAYMENTS' && selectedExportType !== 'ALL_TRANSACTIONS') {
        toast.error('This export type is not available yet.');
        return;
      }

      const response = await repaymentService.getAllRepayments({
        dateFrom,
        dateTo,
        page: 1,
        limit: 1000,
      });

      const transactions = response.data.map((r) => ({
        id: r.id,
        date: r.transactionDate,
        type: 'REPAYMENT',
        clientName: r.loan?.client ? `${r.loan.client.firstName} ${r.loan.client.lastName}` : 'Unknown Client',
        loanNumber: r.loan?.loanNumber || r.loanId,
        amount: Number(r.amount),
        description: 'Loan repayment',
        reference: r.reference || r.receiptNumber,
      }));

      switch (selectedSystem) {
        case 'quickbooks':
          exportToQuickBooks(transactions, `kenels_export_${selectedExportType.toLowerCase()}`, mappings);
          break;
        case 'sage':
          exportToSage(transactions, `kenels_export_${selectedExportType.toLowerCase()}`, mappings);
          break;
        case 'xero':
          exportToXero(transactions, `kenels_export_${selectedExportType.toLowerCase()}`, mappings);
          break;
        case 'excel':
          exportToExcel({
            filename: `kenels_export_${selectedExportType.toLowerCase()}`,
            columns: [
              { key: 'date', header: 'Date', formatter: (v) => formatDate(v) },
              { key: 'type', header: 'Type' },
              { key: 'clientName', header: 'Client' },
              { key: 'loanNumber', header: 'Loan #' },
              { key: 'amount', header: 'Amount', formatter: (v) => Number(v).toFixed(2) },
              { key: 'reference', header: 'Reference' },
            ],
            data: transactions,
            title: `${EXPORT_TYPES.find(t => t.value === selectedExportType)?.label} Export`,
            subtitle: `Period: ${formatDate(dateFrom)} to ${formatDate(dateTo)}`,
          });
          break;
        case 'csv':
          exportToCSV({
            filename: `kenels_export_${selectedExportType.toLowerCase()}`,
            columns: [
              { key: 'date', header: 'Date', formatter: (v) => formatDate(v) },
              { key: 'type', header: 'Type' },
              { key: 'clientName', header: 'Client' },
              { key: 'loanNumber', header: 'Loan #' },
              { key: 'amount', header: 'Amount', formatter: (v) => Number(v).toFixed(2) },
              { key: 'reference', header: 'Reference' },
            ],
            data: transactions,
          });
          break;
      }
      toast.success('Export generated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const toggleSchedule = () => {
    toast.error('Scheduled exports are not available yet.');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Download className="h-6 w-6 text-emerald-600" />
            Export to Accounting
          </h1>
          <p className="text-sm text-slate-600">
            Export financial data to your accounting system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMappingDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Account Mappings
          </Button>
          <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
            <Clock className="h-4 w-4 mr-2" />
            Scheduled Exports
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{exportHistory.filter(e => e.status === 'COMPLETED').length}</p>
                <p className="text-xs text-slate-500">Completed Exports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{exportHistory.filter(e => e.status === 'PROCESSING').length}</p>
                <p className="text-xs text-slate-500">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{scheduledExports.filter(s => s.isActive).length}</p>
                <p className="text-xs text-slate-500">Active Schedules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{exportHistory.reduce((sum, e) => sum + e.recordCount, 0)}</p>
                <p className="text-xs text-slate-500">Records Exported</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="export" className="data-[state=active]:bg-white">
            <Download className="h-4 w-4 mr-2" />
            New Export
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white">
            <History className="h-4 w-4 mr-2" />
            Export History
          </TabsTrigger>
        </TabsList>

        {/* New Export Tab */}
        <TabsContent value="export" className="mt-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Export Configuration */}
            <div className="col-span-2">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-slate-500" />
                    Export Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your export settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Accounting System Selection */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-3 block">
                      Select Accounting System
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {ACCOUNTING_SYSTEMS.map((system) => (
                        <button
                          key={system.value}
                          onClick={() => setSelectedSystem(system.value)}
                          className={cn(
                            'p-4 rounded-lg border-2 text-center transition-all',
                            selectedSystem === system.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          )}
                        >
                          <span className="text-2xl block mb-1">{system.icon}</span>
                          <span className="text-sm font-medium">{system.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Export Type */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Export Type
                    </label>
                    <Select value={selectedExportType} onValueChange={setSelectedExportType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select export type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPORT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        From Date
                      </label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        To Date
                      </label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Export Button */}
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                    onClick={handleExport}
                    disabled={exporting || !dateFrom || !dateTo}
                  >
                    {exporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Info */}
            <div className="space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Export Format Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {selectedSystem === 'quickbooks' && (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-700">QuickBooks IIF Format</p>
                      <p className="text-slate-500">
                        Exports data in Intuit Interchange Format (.iif) compatible with QuickBooks Desktop.
                      </p>
                      <ul className="text-slate-500 space-y-1 pl-4 list-disc">
                        <li>Double-entry journal format</li>
                        <li>Automatic account mapping</li>
                        <li>Import via File → Utilities → Import</li>
                      </ul>
                    </div>
                  )}
                  {selectedSystem === 'sage' && (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-700">Sage CSV Format</p>
                      <p className="text-slate-500">
                        Exports data in CSV format compatible with Sage 50 and Sage Business Cloud.
                      </p>
                      <ul className="text-slate-500 space-y-1 pl-4 list-disc">
                        <li>Nominal code mapping</li>
                        <li>Tax code support</li>
                        <li>Department tracking</li>
                      </ul>
                    </div>
                  )}
                  {selectedSystem === 'xero' && (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-700">Xero CSV Format</p>
                      <p className="text-slate-500">
                        Exports data in CSV format for Xero bank statement import.
                      </p>
                      <ul className="text-slate-500 space-y-1 pl-4 list-disc">
                        <li>Account code mapping</li>
                        <li>Payee information</li>
                        <li>Reference tracking</li>
                      </ul>
                    </div>
                  )}
                  {selectedSystem === 'excel' && (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-700">Excel Format</p>
                      <p className="text-slate-500">
                        Exports data in Excel-compatible CSV format with UTF-8 encoding.
                      </p>
                      <ul className="text-slate-500 space-y-1 pl-4 list-disc">
                        <li>Formatted headers</li>
                        <li>Title and subtitle</li>
                        <li>UTF-8 encoding</li>
                      </ul>
                    </div>
                  )}
                  {selectedSystem === 'csv' && (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-700">CSV Format</p>
                      <p className="text-slate-500">
                        Exports data in standard CSV format for universal compatibility.
                      </p>
                      <ul className="text-slate-500 space-y-1 pl-4 list-disc">
                        <li>Universal format</li>
                        <li>Easy to process</li>
                        <li>Timestamp included</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Tip</p>
                      <p className="text-blue-700 mt-1">
                        Configure account mappings before exporting to ensure transactions are posted to the correct GL accounts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Export History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Export History</CardTitle>
                  <CardDescription>View and download previous exports</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Export Name</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">System</TableHead>
                    <TableHead className="font-semibold">Date Range</TableHead>
                    <TableHead className="font-semibold text-center">Records</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportHistory.map((job) => {
                    const statusConfig = EXPORT_STATUS_CONFIG[job.status];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{job.name}</p>
                            <p className="text-xs text-slate-500">
                              {formatDate(job.exportedAt)} by {job.exportedBy}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {EXPORT_TYPES.find(t => t.value === job.type)?.label || job.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{job.system}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span>{formatDate(job.dateFrom)}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span>{formatDate(job.dateTo)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{job.recordCount}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('font-medium', statusConfig.color)}>
                            <StatusIcon className={cn('h-3 w-3 mr-1', job.status === 'PROCESSING' && 'animate-spin')} />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {job.status === 'COMPLETED' && (
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Mappings Dialog */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-600" />
              Account Mappings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Configure how transactions are mapped to your accounting system's chart of accounts.
            </p>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Transaction Type</TableHead>
                  <TableHead className="font-semibold">Debit Account</TableHead>
                  <TableHead className="font-semibold">Debit Code</TableHead>
                  <TableHead className="font-semibold">Credit Account</TableHead>
                  <TableHead className="font-semibold">Credit Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">{mapping.transactionType}</TableCell>
                    <TableCell>{mapping.debitAccount}</TableCell>
                    <TableCell>
                      <code className="bg-slate-100 px-2 py-0.5 rounded text-sm">{mapping.debitCode}</code>
                    </TableCell>
                    <TableCell>{mapping.creditAccount}</TableCell>
                    <TableCell>
                      <code className="bg-slate-100 px-2 py-0.5 rounded text-sm">{mapping.creditCode}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
              Close
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduled Exports Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Scheduled Exports
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">
                Automate your exports with scheduled jobs.
              </p>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                Add Schedule
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Frequency</TableHead>
                  <TableHead className="font-semibold">System</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Next Run</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledExports.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{schedule.frequency}</Badge>
                    </TableCell>
                    <TableCell>{schedule.system}</TableCell>
                    <TableCell>{schedule.exportType}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDate(schedule.nextRun)}</p>
                        <p className="text-xs text-slate-500">Last: {formatDate(schedule.lastRun)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={schedule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleSchedule}
                        >
                          {schedule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
