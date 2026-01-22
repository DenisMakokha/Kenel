import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  PieChart,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { exportLoanPortfolio, exportToCSV } from '../../lib/exportUtils';
import { loanService } from '../../services/loanService';
import { reportService } from '../../services/reportService';
import { LoanStatus, type Loan } from '../../types/loan';

export default function CreditPortfolioPage() {
  const [, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalDisbursed: 0,
    totalOutstanding: 0,
    totalCollected: 0,
    arrearsCount: null as number | null,
    arrearsAmount: null as number | null,
    avgLoanSize: 0,
  });

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError('');

      const today = new Date().toISOString().slice(0, 10);

      const [activeRes, closedRes, agingSummary] = await Promise.all([
        loanService.getLoans({ status: LoanStatus.ACTIVE, page: 1, limit: 200 }),
        loanService.getLoans({ status: LoanStatus.CLOSED, page: 1, limit: 200 }),
        reportService.getAgingSummary({ asOfDate: today }),
      ]);

      const allLoans = [...activeRes.data, ...closedRes.data];
      setLoans(allLoans);

      const totalLoans = allLoans.length;
      const activeLoans = activeRes.data.length;

      const calcOutstanding = (loan: Loan) => {
        return (
          (Number(loan.outstandingPrincipal) || 0) +
          (Number(loan.outstandingInterest) || 0) +
          (Number(loan.outstandingFees) || 0) +
          (Number(loan.outstandingPenalties) || 0)
        );
      };

      const totalDisbursed = allLoans.reduce(
        (sum, loan) => sum + (Number(loan.principalAmount) || 0),
        0,
      );

      const totalOutstanding = allLoans.reduce((sum, loan) => sum + calcOutstanding(loan), 0);

      const totalCollected = allLoans.reduce((sum, loan) => {
        const totalAmount = Number(loan.totalAmount) || 0;
        const outstanding = calcOutstanding(loan);
        const collected = Math.max(0, totalAmount - outstanding);
        return sum + collected;
      }, 0);

      const arrearsCount = agingSummary.buckets.reduce(
        (sum, bucket) => sum + bucket.loansInBucket,
        0,
      );

      const arrearsAmount = agingSummary.buckets.reduce(
        (sum, bucket) => sum + (Number(bucket.principalOutstanding) || 0),
        0,
      );

      setStats({
        totalLoans,
        activeLoans,
        totalDisbursed,
        totalOutstanding,
        totalCollected,
        arrearsCount,
        arrearsAmount,
        avgLoanSize: totalLoans > 0 ? totalDisbursed / totalLoans : 0,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to load portfolio data. Please try again.',
      );
      setLoans([]);
      setStats({
        totalLoans: 0,
        activeLoans: 0,
        totalDisbursed: 0,
        totalOutstanding: 0,
        totalCollected: 0,
        arrearsCount: null,
        arrearsAmount: null,
        avgLoanSize: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const collectionRate = stats.totalDisbursed > 0
    ? ((stats.totalCollected / stats.totalDisbursed) * 100).toFixed(1)
    : '0';

  const parRate = stats.totalOutstanding > 0
    ? (((stats.arrearsAmount ?? 0) / stats.totalOutstanding) * 100).toFixed(1)
    : '0';

  const handleExportPortfolio = () => {
    const portfolioData = loans.map((loan) => {
      const outstandingBalance =
        (Number(loan.outstandingPrincipal) || 0) +
        (Number(loan.outstandingInterest) || 0) +
        (Number(loan.outstandingFees) || 0) +
        (Number(loan.outstandingPenalties) || 0);

      const clientName = loan.client ? `${loan.client.firstName} ${loan.client.lastName}` : '';

      return {
        loanNumber: loan.loanNumber,
        clientName,
        clientCode: loan.client?.clientCode || '',
        product: '',
        disbursedAmount: Number(loan.principalAmount) || 0,
        outstandingBalance,
        interestRate: Number(loan.interestRate) || 0,
        disbursementDate: loan.disbursedAt || '',
        maturityDate: loan.maturityDate || '',
        status: loan.status,
        daysInArrears: undefined,
      };
    });

    exportLoanPortfolio(portfolioData, 'my_portfolio');
  };

  const handleExportSummary = () => {
    const summaryData = [
      { metric: 'Total Loans', value: stats.totalLoans },
      { metric: 'Active Loans', value: stats.activeLoans },
      { metric: 'Total Disbursed', value: stats.totalDisbursed },
      { metric: 'Total Outstanding', value: stats.totalOutstanding },
      { metric: 'Total Collected', value: stats.totalCollected },
      { metric: 'Collection Rate', value: `${collectionRate}%` },
      { metric: 'Loans in Arrears', value: stats.arrearsCount },
      { metric: 'Arrears Amount', value: stats.arrearsAmount },
      { metric: 'PAR Rate', value: `${parRate}%` },
      { metric: 'Average Loan Size', value: stats.avgLoanSize },
    ];
    exportToCSV({
      filename: 'portfolio_summary',
      columns: [
        { key: 'metric', header: 'Metric' },
        { key: 'value', header: 'Value' },
      ],
      data: summaryData,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Portfolio</h1>
          <p className="text-sm text-slate-600">
            Overview of your loan portfolio performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSummary}>
            <Download className="h-4 w-4 mr-2" />
            Export Summary
          </Button>
          <Button variant="outline" onClick={handleExportPortfolio}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Portfolio
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats.totalDisbursed)}
            </p>
            <p className="text-xs text-muted-foreground">Lifetime disbursements</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalOutstanding)}
            </p>
            <p className="text-xs text-muted-foreground">Current portfolio</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.totalCollected)}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-600">{collectionRate}%</span> collection rate
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">In Arrears</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.arrearsAmount ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">{parRate}%</span> PAR
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Loan Status Distribution */}
        <Card className="border-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Loan Status Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of your loans by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Active Loans</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.activeLoans}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.totalLoans > 0 ? ((stats.activeLoans / stats.totalLoans) * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">In Arrears</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.arrearsCount ?? '—'}</span>
                  <Badge variant="outline" className="text-xs text-red-600">
                    {stats.arrearsCount !== null && stats.totalLoans > 0
                      ? ((stats.arrearsCount / stats.totalLoans) * 100).toFixed(0)
                      : '—'}
                    %
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-slate-400" />
                  <span className="text-sm">Closed Loans</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.totalLoans - stats.activeLoans}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.totalLoans > 0 ? (((stats.totalLoans - stats.activeLoans) / stats.totalLoans) * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-6 h-4 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${stats.totalLoans > 0 ? (stats.activeLoans / stats.totalLoans) * 100 : 0}%` }}
              />
              <div
                className="bg-red-500 h-full"
                style={{
                  width: `${
                    stats.arrearsCount !== null && stats.totalLoans > 0
                      ? (stats.arrearsCount / stats.totalLoans) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="border-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Collection Rate</span>
                  <Badge className={parseFloat(collectionRate) >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                    {parseFloat(collectionRate) >= 90 ? 'Excellent' : 'Needs Improvement'}
                  </Badge>
                </div>
                <p className="text-3xl font-bold">{collectionRate}%</p>
                <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${Math.min(parseFloat(collectionRate), 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Portfolio at Risk (PAR)</span>
                  <Badge className={parseFloat(parRate) <= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                    {parseFloat(parRate) <= 5 ? 'Healthy' : 'At Risk'}
                  </Badge>
                </div>
                <p className="text-3xl font-bold">{parRate}%</p>
                <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: `${Math.min(parseFloat(parRate) * 5, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 text-center">
                  <p className="text-xs text-slate-600 mb-1">Avg Loan Size</p>
                  <p className="font-semibold">{formatCurrency(stats.avgLoanSize)}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 text-center">
                  <p className="text-xs text-slate-600 mb-1">Active Clients</p>
                  <p className="font-semibold">{stats.activeLoans}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <a
              href="/credit/pipeline"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-sm">View Pipeline</p>
                <p className="text-xs text-slate-500">Manage applications</p>
              </div>
            </a>
            <a
              href="/credit/clients"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">My Clients</p>
                <p className="text-xs text-slate-500">View client list</p>
              </div>
            </a>
            <a
              href="/kyc-reviews"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-sm">KYC Reviews</p>
                <p className="text-xs text-slate-500">Pending verifications</p>
              </div>
            </a>
            <a
              href="/reports/aging"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Arrears Report</p>
                <p className="text-xs text-slate-500">View overdue loans</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
