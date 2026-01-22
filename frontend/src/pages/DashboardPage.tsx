import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, FileText, TrendingUp, BarChart3, ShieldCheck, LayoutDashboard, ArrowDownRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { CustomizeDashboardButton } from '../components/dashboard/WidgetCustomizer';
import { clientService } from '../services/clientService';
import { loanService } from '../services/loanService';
import { loanApplicationService } from '../services/loanApplicationService';
import { reportService } from '../services/reportService';
import type { AgingSummaryResponse, PortfolioSummaryResponse } from '../types/reports';
import { LoanStatus } from '../types/loan';
import { LoanApplicationStatus } from '../types/loan-application';
import { formatCurrency } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

interface DashboardKpis {
  totalClients: number | null;
  activeLoans: number | null;
  portfolioOutstanding: number | null;
  loansInArrears: number | null;
  par30Pct: number | null;
  par90Pct: number | null;
  applicationsPendingApproval: number | null;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [closedLoansCount, setClosedLoansCount] = useState<number | null>(null);
  const [kpis, setKpis] = useState<DashboardKpis>({
    totalClients: null,
    activeLoans: null,
    portfolioOutstanding: null,
    loansInArrears: null,
    par30Pct: null,
    par90Pct: null,
    applicationsPendingApproval: null,
  });
  const [alerts, setAlerts] = useState<string[]>([]);
  const [systemHealthy, setSystemHealthy] = useState<boolean>(false);
  const [agingData, setAgingData] = useState<{ name: string; loans: number; amount: number }[]>([]);

  const disbursementTrend: { month: string; amount: number }[] = [];

  const loanStatusData = [
    { name: 'Active', value: kpis.activeLoans || 0, color: '#10b981' },
    { name: 'In Arrears', value: kpis.loansInArrears || 0, color: '#f59e0b' },
    { name: 'Closed', value: closedLoansCount || 0, color: '#6b7280' },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const today = new Date().toISOString().slice(0, 10);

        const [
          clients,
          activeLoans,
          closedLoans,
          submittedApps,
          underReviewApps,
          portfolioSummary,
          agingSummary,
        ]: [
          Awaited<ReturnType<typeof clientService.getClients>>,
          Awaited<ReturnType<typeof loanService.getLoans>>,
          Awaited<ReturnType<typeof loanService.getLoans>>,
          Awaited<ReturnType<typeof loanApplicationService.getApplications>>,
          Awaited<ReturnType<typeof loanApplicationService.getApplications>>,
          PortfolioSummaryResponse,
          AgingSummaryResponse,
        ] = await Promise.all([
          clientService.getClients({ page: 1, limit: 1 }),
          loanService.getLoans({ status: LoanStatus.ACTIVE, page: 1, limit: 1 }),
          loanService.getLoans({ status: LoanStatus.CLOSED, page: 1, limit: 1 }),
          loanApplicationService.getApplications({
            status: LoanApplicationStatus.SUBMITTED,
            page: 1,
            limit: 1,
          }),
          loanApplicationService.getApplications({
            status: LoanApplicationStatus.UNDER_REVIEW,
            page: 1,
            limit: 1,
          }),
          reportService.getPortfolioSummary({
            asOfDate: today,
            groupBy: 'none',
          }),
          reportService.getAgingSummary({
            asOfDate: today,
          }),
        ]);

        const totalClients = clients.meta.total;
        const activeLoansCount = activeLoans.meta.total;
        const closedLoansTotal = closedLoans.meta.total;
        const applicationsPendingApproval = submittedApps.meta.total + underReviewApps.meta.total;

        const portfolioOutstanding = Number(
          (portfolioSummary.kpis && portfolioSummary.kpis.totalOutstandingPrincipal) || '0',
        );
        const par30Pct = (portfolioSummary.kpis?.par30Ratio ?? 0) * 100;
        const par90Pct = (portfolioSummary.kpis?.par90Ratio ?? 0) * 100;

        const loansInArrears = agingSummary.buckets.reduce(
          (sum, bucket) => sum + bucket.loansInBucket,
          0,
        );

        // Set aging data for chart
        const chartAgingData = agingSummary.buckets.map(bucket => ({
          name: bucket.bucketLabel,
          loans: bucket.loansInBucket,
          amount: Number(bucket.principalOutstanding) || 0,
        }));
        setAgingData(chartAgingData);

        setKpis({
          totalClients,
          activeLoans: activeLoansCount,
          portfolioOutstanding,
          loansInArrears,
          par30Pct,
          par90Pct,
          applicationsPendingApproval,
        });
        setClosedLoansCount(closedLoansTotal);

        const newAlerts: string[] = [];
        if (par30Pct > 10) {
          newAlerts.push('PAR30 is above 10%. Review arrears and collections.');
        }
        if (par90Pct > 5) {
          newAlerts.push('PAR90 is above 5%. Consider stricter recovery actions.');
        }
        if (applicationsPendingApproval > 0) {
          newAlerts.push(`${applicationsPendingApproval} loan applications are pending approval.`);
        }
        if (loansInArrears > 0) {
          newAlerts.push(`${loansInArrears} loans are currently in arrears buckets.`);
        }

        setAlerts(newAlerts);
        setSystemHealthy(true);
      } catch (err: any) {
        // Surface a single friendly error while still allowing partial UI to render
        setError(
          err?.response?.data?.message ||
            'Failed to load dashboard metrics. Try refreshing or checking your network.',
        );
        setSystemHealthy(false);
        setClosedLoansCount(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const formatPct = (value: number | null) =>
    value === null ? '—' : `${value.toFixed(2)}%`;

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 md:px-6 py-4">
      {/* Greeting */}
      <section className="mt-1">
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-emerald-50/40 to-transparent px-5 py-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {greeting},{' '}
              {user?.firstName || 'Admin'}.
            </h1>
            <p className="text-sm text-slate-600">
              Here's the latest status on the Kenels loan portfolio.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center rounded-full border border-emerald-100 bg-white/70 px-2 py-0.5 font-medium text-emerald-700">
              <span className="mr-1 text-[11px] uppercase tracking-wide">Role</span>
              <span>{user?.role}</span>
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline">Admin overview for today.</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPI Row */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Portfolio Snapshot</h2>
          <div className="flex items-center gap-3">
            <p className="hidden md:block text-[11px] text-slate-500">Key numbers across clients, loans and portfolio risk.</p>
            <CustomizeDashboardButton />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <CardDescription>Total onboarded clients</CardDescription>
              </div>
              <div className="rounded-full bg-emerald-50 text-emerald-700 p-2">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-700">
                {kpis.totalClients !== null ? kpis.totalClients.toLocaleString('en-KE') : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                <CardDescription>Currently active in the book</CardDescription>
              </div>
              <div className="rounded-full bg-sky-50 text-sky-700 p-2">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {kpis.activeLoans !== null ? kpis.activeLoans.toLocaleString('en-KE') : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Portfolio Outstanding</CardTitle>
                <CardDescription>Principal outstanding (KES)</CardDescription>
              </div>
              <div className="rounded-full bg-emerald-50 text-emerald-700 p-2">
                <BarChart3 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {kpis.portfolioOutstanding !== null
                  ? formatCurrency(kpis.portfolioOutstanding)
                  : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Loans in Arrears</CardTitle>
                <CardDescription>Across all aging buckets</CardDescription>
              </div>
              <div className="rounded-full bg-amber-50 text-amber-700 p-2">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {kpis.loansInArrears !== null ? kpis.loansInArrears.toLocaleString('en-KE') : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Applications Pending Approval</CardTitle>
                <CardDescription>Submitted + under review</CardDescription>
              </div>
              <div className="rounded-full bg-emerald-50 text-emerald-700 p-2">
                <LayoutDashboard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {kpis.applicationsPendingApproval !== null
                  ? kpis.applicationsPendingApproval.toLocaleString('en-KE')
                  : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">PAR30 / PAR90</CardTitle>
                <CardDescription>Portfolio at risk</CardDescription>
              </div>
              <div className="rounded-full bg-amber-50 text-amber-700 p-2">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                PAR30: {formatPct(kpis.par30Pct)}
              </p>
              <p className="text-lg font-semibold mt-1">
                PAR90: {formatPct(kpis.par90Pct)}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Charts Section */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Portfolio Analytics</h2>
          <p className="hidden md:block text-[11px] text-slate-500">Visual insights into portfolio performance.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Disbursement Trend Chart */}
          <Card className="border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Disbursement Trend</CardTitle>
                  <CardDescription>Monthly loan disbursements (KES)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {disbursementTrend.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={disbursementTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="#94a3b8"
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-slate-500">
                  Disbursement trend is not available yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loan Status Distribution */}
          <Card className="border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Loan Status Distribution</CardTitle>
              <CardDescription>Current portfolio breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={loanStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {loanStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value, 'Loans']}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-3">
                  {loanStatusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aging Buckets Chart */}
          <Card className="border-slate-100 bg-white shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Arrears Aging Analysis</CardTitle>
                  <CardDescription>Loans distribution by days past due</CardDescription>
                </div>
                {kpis.loansInArrears !== null && kpis.loansInArrears > 0 && (
                  <div className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                    <ArrowDownRight className="h-3 w-3" />
                    {kpis.loansInArrears} in arrears
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {agingData.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'amount' ? formatCurrency(value) : value,
                          name === 'amount' ? 'Principal' : 'Loans'
                        ]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="loans" name="Loans" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-slate-500">
                  No arrears data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Quick Actions</h2>
          <p className="hidden md:block text-[11px] text-slate-500">Jump into your most common workflows.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <Button
            className="justify-start h-auto min-h-[60px] flex flex-col items-start gap-1 rounded-md border border-emerald-200 bg-white px-3 py-2 text-left hover:bg-emerald-50 hover:border-emerald-400 transition-colors shadow-sm w-full whitespace-normal"
            variant="outline"
            onClick={() => navigate('/loan-applications/new')}
          >
            <span className="text-sm font-semibold text-emerald-900 leading-snug w-full break-words">New Loan Application</span>
            <span className="text-[11px] text-slate-600 leading-snug w-full break-words">Capture a new loan application.</span>
          </Button>

          <Button
            className="justify-start h-auto min-h-[60px] flex flex-col items-start gap-1 rounded-md border border-emerald-200 bg-white px-3 py-2 text-left hover:bg-emerald-50 hover:border-emerald-400 transition-colors shadow-sm w-full whitespace-normal"
            variant="outline"
            onClick={() => navigate('/clients/new')}
          >
            <span className="text-sm font-semibold text-emerald-900 leading-snug w-full break-words">Add Client</span>
            <span className="text-[11px] text-slate-600 leading-snug w-full break-words">Onboard a new client.</span>
          </Button>

          <Button
            className="justify-start h-auto min-h-[60px] flex flex-col items-start gap-1 rounded-md border border-emerald-200 bg-white px-3 py-2 text-left hover:bg-emerald-50 hover:border-emerald-400 transition-colors shadow-sm w-full whitespace-normal"
            variant="outline"
            onClick={() => navigate('/reports/portfolio')}
          >
            <span className="text-sm font-semibold text-emerald-900 leading-snug w-full break-words">Run Portfolio Report</span>
            <span className="text-[11px] text-slate-600 leading-snug w-full break-words">Open the portfolio dashboard.</span>
          </Button>

          <Button
            className="justify-start h-auto min-h-[60px] flex flex-col items-start gap-1 rounded-md border border-emerald-200 bg-white px-3 py-2 text-left hover:bg-emerald-50 hover:border-emerald-400 transition-colors shadow-sm w-full whitespace-normal"
            variant="outline"
            onClick={() => navigate('/reports/aging')}
          >
            <span className="text-sm font-semibold text-emerald-900 leading-snug w-full break-words">Open Arrears List</span>
            <span className="text-[11px] text-slate-600 leading-snug w-full break-words">Review loans in arrears.</span>
          </Button>
        </div>
      </section>

      {/* Alerts / Recent Risk Activity */}
      <section className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
        <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Risk &amp; Activity Alerts</CardTitle>
              <CardDescription>Key items that may need your attention.</CardDescription>
            </div>
            <div className="rounded-full bg-amber-50 text-amber-700 p-2">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading && !alerts.length && (
              <p className="text-sm text-muted-foreground">Loading latest alerts...</p>
            )}
            {!loading && alerts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No critical alerts right now. Portfolio and workflow look stable.
              </p>
            )}
            <ul className="space-y-2 text-sm">
              {alerts.map((alert) => (
                <li key={alert} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>System Health</CardTitle>
              <CardDescription>High-level view of core services.</CardDescription>
            </div>
            <div className="rounded-full bg-emerald-50 text-emerald-700 p-2">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>API &amp; Database</span>
                <span
                  className={
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
                    (systemHealthy
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200')
                  }
                >
                  {systemHealthy ? '✔ Up' : 'Degraded'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Authentication</span>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  ✔ Enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>PII Encryption</span>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  ✔ AES-256-GCM
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Backups</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                  Scheduled (ops-managed)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
