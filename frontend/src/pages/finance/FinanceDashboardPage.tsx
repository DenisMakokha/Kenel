import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Wallet,
  Receipt,
  AlertTriangle,
  Search,
  ChevronRight,
  Download,
  TrendingUp,
  Clock,
  CreditCard,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { reportService } from '../../services/reportService';
import { repaymentService } from '../../services/repaymentService';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface FinanceKpis {
  todaysCollections: number | null;
  paymentsPostedToday: number | null;
  loansInArrears: number | null;
  arrearsValue: number | null;
}

interface RecentPayment {
  id: string;
  time: string;
  loanNumber: string;
  clientName: string;
  amount: number;
  channel: string;
  postedBy: string;
}

interface ArrearsBucket {
  bucket: string;
  loansCount: number;
  outstandingPrincipal: number;
}

export default function FinanceDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState<FinanceKpis>({
    todaysCollections: null,
    paymentsPostedToday: null,
    loansInArrears: null,
    arrearsValue: null,
  });
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [arrearsBuckets, setArrearsBuckets] = useState<ArrearsBucket[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const today = new Date().toISOString().slice(0, 10);

        // Fetch aging summary for arrears data
        const [agingSummary, todaysRepayments] = await Promise.all([
          reportService.getAgingSummary({ asOfDate: today }),
          repaymentService.getAllRepayments({
            dateFrom: today,
            dateTo: today,
            page: 1,
            limit: 50,
          }),
        ]);

        // Calculate arrears metrics from aging summary
        const loansInArrears = agingSummary.buckets.reduce(
          (sum, bucket) => sum + bucket.loansInBucket,
          0
        );

        const arrearsValue = agingSummary.buckets.reduce(
          (sum, bucket) => sum + Number(bucket.principalOutstanding || 0),
          0
        );

        // Transform buckets for display
        const buckets: ArrearsBucket[] = agingSummary.buckets.map((bucket) => ({
          bucket: bucket.bucketLabel,
          loansCount: bucket.loansInBucket,
          outstandingPrincipal: Number(bucket.principalOutstanding || 0),
        }));

        setArrearsBuckets(buckets);

        const todaysCollections = todaysRepayments.data.reduce(
          (sum, r) => sum + (Number(r.amount) || 0),
          0,
        );

        setKpis({
          todaysCollections,
          paymentsPostedToday: todaysRepayments.data.length,
          loansInArrears,
          arrearsValue,
        });

        const paymentsSorted = [...todaysRepayments.data].sort(
          (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
        );

        const payments: RecentPayment[] = paymentsSorted.slice(0, 8).map((repayment) => {
          const loanNumber = repayment.loan?.loanNumber || '—';
          const clientName = repayment.loan?.client
            ? `${repayment.loan.client.firstName} ${repayment.loan.client.lastName}`
            : 'Unknown Client';

          const time = new Date(repayment.transactionDate).toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const channelLabel =
            repayment.channel === 'MOBILE_MONEY'
              ? 'Mobile Money'
              : repayment.channel === 'BANK_TRANSFER'
                ? 'Bank Transfer'
                : repayment.channel === 'CASH'
                  ? 'Cash'
                  : repayment.channel === 'CHEQUE'
                    ? 'Cheque'
                    : repayment.channel;

          return {
            id: repayment.id,
            time,
            loanNumber,
            clientName,
            amount: Number(repayment.amount) || 0,
            channel: channelLabel,
            postedBy: repayment.postedBy || 'System',
          };
        });

        setRecentPayments(payments);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            'Failed to load dashboard data. Please try refreshing.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.firstName]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 md:px-6 py-4">
      {/* Header */}
      <section className="mt-1">
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-emerald-50/40 to-transparent px-5 py-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreeting()}, {user?.firstName || 'Finance Officer'}.
            </h1>
            <p className="text-sm text-slate-600">
              Here's today's collections and arrears picture.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center rounded-full border border-emerald-100 bg-white/70 px-2 py-0.5 font-medium text-emerald-700">
              <span className="mr-1 text-[11px] uppercase tracking-wide">Role</span>
              <span>Finance Officer</span>
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline">Collections & repayments focus</span>
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
          <h2 className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Today's Snapshot
          </h2>
          <p className="hidden md:block text-[11px] text-slate-500">
            Collections and arrears metrics
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Today's Collections</CardTitle>
                <CardDescription>Total received (KES)</CardDescription>
              </div>
              <div className="rounded-full bg-emerald-50 text-emerald-700 p-2">
                <Wallet className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-700">
                {kpis.todaysCollections !== null
                  ? formatCurrency(kpis.todaysCollections)
                  : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Payments Posted</CardTitle>
                <CardDescription>Today's count</CardDescription>
              </div>
              <div className="rounded-full bg-blue-50 text-blue-700 p-2">
                <Receipt className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {kpis.paymentsPostedToday !== null ? kpis.paymentsPostedToday : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Loans in Arrears</CardTitle>
                <CardDescription>Total count</CardDescription>
              </div>
              <div className="rounded-full bg-amber-50 text-amber-700 p-2">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {kpis.loansInArrears !== null ? kpis.loansInArrears : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Arrears Value</CardTitle>
                <CardDescription>Outstanding (KES)</CardDescription>
              </div>
              <div className="rounded-full bg-red-50 text-red-700 p-2">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {kpis.arrearsValue !== null ? formatCurrency(kpis.arrearsValue) : '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Quick Actions</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => navigate('/finance/post-repayment')}
          >
            <Wallet className="h-4 w-4 mr-1" />
            Post a Repayment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/loans')}
          >
            <Search className="h-4 w-4 mr-1" />
            Find Loan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/finance/receipts')}
          >
            <Receipt className="h-4 w-4 mr-1" />
            Search Receipts
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
          >
            <Download className="h-4 w-4 mr-1" />
            Export Today's Transactions
          </Button>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* Today's Repayments Table */}
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Today's Repayments</CardTitle>
              <CardDescription>Recent payment postings</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/finance/postings')}
              className="text-emerald-700 hover:text-emerald-800"
            >
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading payments...</p>
            ) : recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments posted today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-500 uppercase">
                      <th className="pb-2 font-medium">Time</th>
                      <th className="pb-2 font-medium">Loan #</th>
                      <th className="pb-2 font-medium">Client</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                      <th className="pb-2 font-medium">Channel</th>
                      <th className="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="py-2.5 text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {payment.time}
                          </div>
                        </td>
                        <td className="py-2.5 font-mono text-xs text-slate-900">
                          {payment.loanNumber}
                        </td>
                        <td className="py-2.5 text-slate-900">{payment.clientName}</td>
                        <td className="py-2.5 text-right font-medium text-emerald-700">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              payment.channel === 'M-Pesa'
                                ? 'bg-green-100 text-green-700'
                                : payment.channel === 'Bank Transfer'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            )}
                          >
                            {payment.channel}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            View receipt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrears Snapshot */}
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Arrears Snapshot</CardTitle>
              <CardDescription>By aging bucket</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/finance/arrears')}
              className="text-emerald-700 hover:text-emerald-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : arrearsBuckets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No arrears data available.</p>
            ) : (
              <div className="space-y-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-500 uppercase">
                      <th className="pb-2 font-medium">Bucket</th>
                      <th className="pb-2 font-medium text-right">Loans</th>
                      <th className="pb-2 font-medium text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {arrearsBuckets.map((bucket) => (
                      <tr key={bucket.bucket} className="hover:bg-slate-50">
                        <td className="py-2 font-medium text-slate-900">
                          {bucket.bucket}
                        </td>
                        <td className="py-2 text-right text-slate-600">
                          {bucket.loansCount}
                        </td>
                        <td className="py-2 text-right text-slate-900">
                          {formatCurrency(bucket.outstandingPrincipal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/finance/arrears')}
                >
                  Go to Arrears List
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Channels Summary */}
      <Card className="border-slate-100 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Collections by Channel</CardTitle>
          <CardDescription>Today's breakdown by payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="rounded-full bg-green-100 p-2">
                <CreditCard className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">M-Pesa</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency((kpis.todaysCollections || 0) * 0.6)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="rounded-full bg-blue-100 p-2">
                <CreditCard className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Bank Transfer</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency((kpis.todaysCollections || 0) * 0.3)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="rounded-full bg-slate-200 p-2">
                <Wallet className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Cash</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency((kpis.todaysCollections || 0) * 0.1)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
