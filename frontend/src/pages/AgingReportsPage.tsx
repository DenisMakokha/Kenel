import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { reportService } from '../services/reportService';
import { loanProductService } from '../services/loanProductService';
import type { LoanProduct } from '../types/loan-product';
import type { AgingSummaryResponse, LoansInBucketResponse } from '../types/reports';
import { formatCurrency } from '../lib/utils';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AgingReportsPage() {
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [productId, setProductId] = useState<string>('ALL');
  const [summary, setSummary] = useState<AgingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [products, setProducts] = useState<LoanProduct[]>([]);

  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [loans, setLoans] = useState<LoansInBucketResponse | null>(null);
  const [loansLoading, setLoansLoading] = useState(false);
  const [loansError, setLoansError] = useState('');
  const [loansPage, setLoansPage] = useState(1);

  const [exportingAgingCsv, setExportingAgingCsv] = useState(false);
  const [exportingAgingPdf, setExportingAgingPdf] = useState(false);
  const [exportingLoansCsv, setExportingLoansCsv] = useState(false);
  const [exportingLoansPdf, setExportingLoansPdf] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await loanProductService.getProducts({ page: 1, limit: 100 });
        setProducts(response.data);
      } catch (err) {
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await reportService.getAgingSummary({
          asOfDate,
          productId: productId === 'ALL' ? undefined : productId,
        });
        setSummary(result);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load aging summary');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [asOfDate, productId]);

  const loadLoans = async (bucket: string, page: number) => {
    try {
      setLoansLoading(true);
      setLoansError('');
      const result = await reportService.getLoansInBucket({
        asOfDate,
        bucket,
        productId: productId === 'ALL' ? undefined : productId,
        page,
        limit: 20,
      });
      setLoans(result);
      setLoansPage(page);
    } catch (err: any) {
      setLoansError(err.response?.data?.message || 'Failed to load loans in bucket');
    } finally {
      setLoansLoading(false);
    }
  };

  const handleSelectBucket = (bucket: string) => {
    setSelectedBucket(bucket);
    loadLoans(bucket, 1);
  };

  const handleExportAging = async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        setExportingAgingCsv(true);
      } else {
        setExportingAgingPdf(true);
      }
      const blob = await reportService.exportAgingSummary({
        asOfDate,
        productId: productId === 'ALL' ? undefined : productId,
        format,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aging-${asOfDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export aging report');
    } finally {
      setExportingAgingCsv(false);
      setExportingAgingPdf(false);
    }
  };

  const handleExportLoans = async (format: 'csv' | 'pdf') => {
    if (!selectedBucket) return;
    try {
      if (format === 'csv') {
        setExportingLoansCsv(true);
      } else {
        setExportingLoansPdf(true);
      }
      const blob = await reportService.exportLoans({
        asOfDate,
        bucket: selectedBucket,
        productId: productId === 'ALL' ? undefined : productId,
        page: loansPage,
        limit: loans?.meta.limit,
        format,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loans-${selectedBucket}-${asOfDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setLoansError(err.response?.data?.message || 'Failed to export loans');
    } finally {
      setExportingLoansCsv(false);
      setExportingLoansPdf(false);
    }
  };

  const par30Pct = summary ? summary.par.par30Ratio * 100 : 0;
  const par90Pct = summary ? summary.par.par90Ratio * 100 : 0;

  const chartData = useMemo(
    () =>
      summary
        ? summary.buckets.map((b) => ({
            bucket: b.bucketLabel,
            principal: Number(b.principalOutstanding) || 0,
          }))
        : [],
    [summary],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Aging / PAR Dashboard</h1>
          <p className="text-muted-foreground text-sm">View portfolio aging by days past due.</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2 items-center">
            <label className="text-xs text-muted-foreground">As of</label>
            <input
              type="date"
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
            <select
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="ALL">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportAging('csv')}
              disabled={exportingAgingCsv || exportingAgingPdf}
            >
              {exportingAgingCsv ? 'Exporting CSV...' : 'Export Aging CSV'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportAging('pdf')}
              disabled={exportingAgingCsv || exportingAgingPdf}
            >
              {exportingAgingPdf ? 'Exporting PDF...' : 'Export Aging PDF'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">PAR 30</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary ? `${par30Pct.toFixed(2)}%` : '—'}
            </p>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(Number(summary.par.par30Amount) || 0)} at risk
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">PAR 90</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary ? `${par90Pct.toFixed(2)}%` : '—'}
            </p>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(Number(summary.par.par90Amount) || 0)} at risk
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Outstanding by Aging Bucket</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading aging summary...</p>
          ) : !summary || chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available for the selected filters.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) =>
                    typeof value === 'number' ? formatCurrency(value, undefined as any) : String(value)
                  }
                />
                <Bar dataKey="principal" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aging by Bucket</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading aging summary...</p>
          ) : !summary || summary.buckets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available for the selected filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bucket</TableHead>
                  <TableHead>Loans</TableHead>
                  <TableHead>Principal Outstanding</TableHead>
                  <TableHead>% of Portfolio</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.buckets.map((b) => (
                  <TableRow key={b.bucketLabel}>
                    <TableCell>{b.bucketLabel}</TableCell>
                    <TableCell>{b.loansInBucket}</TableCell>
                    <TableCell>{formatCurrency(Number(b.principalOutstanding) || 0)}</TableCell>
                    <TableCell>{(b.principalSharePct * 100).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectBucket(b.bucketLabel)}
                      >
                        View Loans
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedBucket && (
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Loans in Bucket {selectedBucket}</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportLoans('csv')}
                  disabled={exportingLoansCsv || exportingLoansPdf}
                >
                  {exportingLoansCsv ? 'Exporting CSV...' : 'Export Loans CSV'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportLoans('pdf')}
                  disabled={exportingLoansCsv || exportingLoansPdf}
                >
                  {exportingLoansPdf ? 'Exporting PDF...' : 'Export Loans PDF'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loansLoading ? (
              <p className="text-sm text-muted-foreground">Loading loans...</p>
            ) : loansError ? (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
                {loansError}
              </div>
            ) : !loans || loans.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No loans found in this bucket.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>DPD</TableHead>
                      <TableHead>Principal Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.data.map((loan) => (
                      <TableRow key={loan.loanId}>
                        <TableCell>{loan.loanNumber}</TableCell>
                        <TableCell>{loan.clientName}</TableCell>
                        <TableCell>{loan.productName}</TableCell>
                        <TableCell>{loan.daysPastDue}</TableCell>
                        <TableCell>{formatCurrency(Number(loan.principalOutstanding) || 0)}</TableCell>
                        <TableCell>{loan.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center mt-4 text-sm">
                  <span className="text-muted-foreground">
                    Page {loans.meta.page} of {loans.meta.totalPages} (Total: {loans.meta.total})
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loansPage <= 1}
                      onClick={() => {
                        if (!selectedBucket) return;
                        const next = Math.max(1, loansPage - 1);
                        loadLoans(selectedBucket, next);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!loans || loans.meta.page >= loans.meta.totalPages}
                      onClick={() => {
                        if (!selectedBucket || !loans) return;
                        const next = loans.meta.totalPages
                          ? Math.min(loans.meta.totalPages, loansPage + 1)
                          : loansPage;
                        loadLoans(selectedBucket, next);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
