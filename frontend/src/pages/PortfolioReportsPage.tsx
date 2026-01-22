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
import { loanProductService } from '../services/loanProductService';
import { reportService } from '../services/reportService';
import type { LoanProduct } from '../types/loan-product';
import type { PortfolioSummaryResponse } from '../types/reports';
import { formatCurrency } from '../lib/utils';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function PortfolioReportsPage() {
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [productId, setProductId] = useState<string>('ALL');
  const [summary, setSummary] = useState<PortfolioSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [products, setProducts] = useState<LoanProduct[]>([]);

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
        const result = await reportService.getPortfolioSummary({
          asOfDate,
          groupBy: 'product',
          productId: productId === 'ALL' ? undefined : productId,
        });
        setSummary(result);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load portfolio summary');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [asOfDate, productId]);

  const maxOutstanding = useMemo(() => {
    if (!summary || summary.rows.length === 0) return 0;
    return summary.rows.reduce((max, row) => {
      const value = Number(row.totalPrincipalOutstanding) || 0;
      return value > max ? value : max;
    }, 0);
  }, [summary]);

  const chartData = useMemo(
    () =>
      summary
        ? summary.rows.map((row) => ({
            product: row.productName || 'All Products',
            outstanding: Number(row.totalPrincipalOutstanding) || 0,
          }))
        : [],
    [summary],
  );

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!asOfDate) return;
    try {
      if (format === 'csv') {
        setExportingCsv(true);
      } else {
        setExportingPdf(true);
      }
      const blob = await reportService.exportPortfolioSummary({
        asOfDate,
        groupBy: 'product',
        productId: productId === 'ALL' ? undefined : productId,
        format,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-summary-${asOfDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export portfolio summary');
    } finally {
      setExportingCsv(false);
      setExportingPdf(false);
    }
  };

  const totalOutstanding = summary ? Number(summary.kpis.totalOutstandingPrincipal) || 0 : 0;
  const par30RatioPct = summary ? summary.kpis.par30Ratio * 100 : 0;
  const par90RatioPct = summary ? summary.kpis.par90Ratio * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of the loan book as of a given date.</p>
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
              onClick={() => handleExport('csv')}
              disabled={exportingCsv || exportingPdf}
            >
              {exportingCsv ? 'Exporting CSV...' : 'Export CSV'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={exportingCsv || exportingPdf}
            >
              {exportingPdf ? 'Exporting PDF...' : 'Export PDF'}
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
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary ? formatCurrency(totalOutstanding) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">PAR 30</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary ? `${par30RatioPct.toFixed(2)}%` : '—'}
            </p>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(Number(summary.kpis.par30Amount) || 0)} at risk
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">PAR 90</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary ? `${par90RatioPct.toFixed(2)}%` : '—'}
            </p>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(Number(summary.kpis.par90Amount) || 0)} at risk
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary ? summary.rows.reduce((sum, r) => sum + r.totalLoans, 0) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Outstanding by Product</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading portfolio summary...</p>
          ) : !summary || chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available for the selected filters.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="product" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) =>
                    typeof value === 'number' ? formatCurrency(value, undefined as any) : String(value)
                  }
                />
                <Bar dataKey="outstanding" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio by Product</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading portfolio summary...</p>
          ) : !summary || summary.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available for the selected filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Loans</TableHead>
                  <TableHead>Outstanding Principal</TableHead>
                  <TableHead>Overdue Principal</TableHead>
                  <TableHead>Share of Portfolio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.rows.map((row) => {
                  const outstanding = Number(row.totalPrincipalOutstanding) || 0;
                  const overdue = Number(row.totalOverduePrincipal) || 0;
                  const share = totalOutstanding > 0 ? (outstanding / totalOutstanding) * 100 : 0;
                  const barWidth = maxOutstanding > 0 ? Math.round((outstanding / maxOutstanding) * 100) : 0;
                  return (
                    <TableRow key={`${row.productId || 'all'}`}>
                      <TableCell>{row.productName || 'All Products'}</TableCell>
                      <TableCell>{row.totalLoans}</TableCell>
                      <TableCell>{formatCurrency(outstanding)}</TableCell>
                      <TableCell>{formatCurrency(overdue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-2 bg-emerald-500"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{share.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
