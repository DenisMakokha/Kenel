import { useState } from 'react';
import { loanProductService } from '../../services/loanProductService';
import { SchedulePreviewResponse } from '../../types/loan-product';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatCurrency } from '../../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface PreviewScheduleModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  versionId: string;
  productName: string;
  currencyCode: string;
  defaultPrincipal?: number;
  defaultTermMonths?: number;
}

export default function PreviewScheduleModal({
  open,
  onClose,
  productId,
  versionId,
  productName,
  currencyCode,
  defaultPrincipal,
  defaultTermMonths,
}: PreviewScheduleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schedule, setSchedule] = useState<SchedulePreviewResponse | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [principal, setPrincipal] = useState(
    defaultPrincipal != null ? String(defaultPrincipal) : '10000',
  );
  const [termMonths, setTermMonths] = useState(
    defaultTermMonths != null ? String(defaultTermMonths) : '6',
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handlePreview = async () => {
    setError('');
    try {
      setLoading(true);
      const response = await loanProductService.previewSchedule(productId, versionId, {
        principal: Number(principal),
        term_months: Number(termMonths),
        start_date: startDate,
      });
      setSchedule(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setError('');
    try {
      setDownloadingPdf(true);
      const blob = await loanProductService.downloadSchedulePdf(productId, versionId, {
        principal: Number(principal),
        term_months: Number(termMonths),
        start_date: startDate,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schedule-${productName.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleClose = () => {
    setSchedule(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Loan Schedule</DialogTitle>
          <DialogDescription>
            {productName} - Calculate installment schedule
          </DialogDescription>
        </DialogHeader>

        {/* Input Form */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div>
            <Label htmlFor="principal">Principal Amount ({currencyCode})</Label>
            <Input
              id="principal"
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="10000"
            />
          </div>
          <div>
            <Label htmlFor="term">Term (months)</Label>
            <Input
              id="term"
              type="number"
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
              placeholder="6"
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 py-2">
          <Button
            onClick={handlePreview}
            disabled={loading || downloadingPdf}
            className="flex-1"
          >
            {loading ? 'Generating...' : 'Generate Preview'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={loading || downloadingPdf}
          >
            {downloadingPdf ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Schedule Table */}
        {schedule && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Repayment Schedule</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Fees</TableHead>
                      <TableHead className="text-right">Total Due</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.installments.map((inst) => (
                      <TableRow key={inst.number}>
                        <TableCell className="font-medium">{inst.number}</TableCell>
                        <TableCell>{inst.due_date}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(inst.principal, schedule.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(inst.interest, schedule.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(inst.fees, schedule.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(inst.total_due, schedule.currency)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(inst.balance_after, schedule.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totals */}
            <div className="border rounded-lg p-4 bg-accent">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Principal</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(schedule.totals.principal, schedule.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interest</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(schedule.totals.interest, schedule.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fees</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(schedule.totals.fees, schedule.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payable</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(schedule.totals.total_payable, schedule.currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Breakdown Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pie Chart */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Payment Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Principal', value: schedule.totals.principal, color: '#3b82f6' },
                          { name: 'Interest', value: schedule.totals.interest, color: '#f59e0b' },
                          { name: 'Fees', value: schedule.totals.fees, color: '#8b5cf6' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#8b5cf6" />
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value, schedule.currency), '']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart - Installment Breakdown */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Installment Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={schedule.installments.slice(0, 12).map((inst) => ({
                        name: `#${inst.number}`,
                        Principal: inst.principal,
                        Interest: inst.interest,
                        Fees: inst.fees,
                      }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value, schedule.currency), '']}
                      />
                      <Legend />
                      <Bar dataKey="Principal" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="Interest" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Fees" stackId="a" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {schedule.installments.length > 12 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Showing first 12 of {schedule.installments.length} installments
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
