import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import {
  FileText,
  Users,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { loanApplicationService } from '../../services/loanApplicationService';
import { loanService } from '../../services/loanService';
import { LoanApplicationStatus } from '../../types/loan-application';
import { LoanStatus } from '../../types/loan';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface CreditKpis {
  newApplications: number | null;
  applicationsInReview: number | null;
  awaitingDisbursement: number | null;
  portfolioOutstanding: number | null;
}

interface PipelineItem {
  id: string;
  clientName: string;
  product: string;
  amount: number;
  status: string;
  daysInStage: number;
  createdAt: string;
}

interface KycFollowUp {
  id: string;
  clientName: string;
  missingDocs: string[];
  daysOutstanding: number;
}

const PIPELINE_STAGES = [
  { key: 'DRAFT', label: 'New', color: 'bg-slate-100 text-slate-700' },
  { key: 'SUBMITTED', label: 'KYC Pending', color: 'bg-amber-100 text-amber-700' },
  { key: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-blue-100 text-blue-700' },
  { key: 'APPROVED', label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
];

export default function CreditDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState<CreditKpis>({
    newApplications: null,
    applicationsInReview: null,
    awaitingDisbursement: null,
    portfolioOutstanding: null,
  });
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [kycFollowUps, setKycFollowUps] = useState<KycFollowUp[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch applications by status
        const [draftApps, submittedApps, underReviewApps, approvedApps, activeLoans] = await Promise.all([
          loanApplicationService.getApplications({ status: LoanApplicationStatus.DRAFT, page: 1, limit: 10 }),
          loanApplicationService.getApplications({ status: LoanApplicationStatus.SUBMITTED, page: 1, limit: 10 }),
          loanApplicationService.getApplications({ status: LoanApplicationStatus.UNDER_REVIEW, page: 1, limit: 10 }),
          loanApplicationService.getApplications({ status: LoanApplicationStatus.APPROVED, page: 1, limit: 10 }),
          loanService.getLoans({ status: LoanStatus.ACTIVE, page: 1, limit: 100 }),
        ]);

        // Calculate KPIs
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const allApps = [
          ...draftApps.data,
          ...submittedApps.data,
          ...underReviewApps.data,
          ...approvedApps.data,
        ];

        const newApplications = allApps.filter(
          (app) => new Date(app.createdAt) >= sevenDaysAgo
        ).length;

        const applicationsInReview = underReviewApps.meta.total;
        const awaitingDisbursement = approvedApps.meta.total;

        // Calculate portfolio outstanding from active loans
        const portfolioOutstanding = activeLoans.data.reduce(
          (sum, loan) => sum + Number(loan.outstandingPrincipal || 0),
          0
        );

        setKpis({
          newApplications,
          applicationsInReview,
          awaitingDisbursement,
          portfolioOutstanding,
        });

        // Build pipeline items
        const pipeline: PipelineItem[] = allApps.slice(0, 10).map((app) => {
          const createdDate = new Date(app.createdAt);
          const now = new Date();
          const daysInStage = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

          return {
            id: app.id,
            clientName: app.client
              ? `${app.client.firstName} ${app.client.lastName}`
              : 'Unknown Client',
            product: app.productVersion?.loanProduct?.name || 'Unknown Product',
            amount: Number(app.requestedAmount),
            status: app.status,
            daysInStage,
            createdAt: app.createdAt,
          };
        });

        setPipelineItems(pipeline);

        setKycFollowUps([]);
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
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const getStageInfo = (status: string) => {
    return PIPELINE_STAGES.find((s) => s.key === status) || PIPELINE_STAGES[0];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 md:px-6 py-4">
      {/* Header */}
      <section className="mt-1">
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-emerald-50/40 to-transparent px-5 py-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {greeting}, {user?.firstName || 'Credit Officer'}.
            </h1>
            <p className="text-sm text-slate-600">
              Here's your loan pipeline and tasks for today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center rounded-full border border-emerald-100 bg-white/70 px-2 py-0.5 font-medium text-emerald-700">
              <span className="mr-1 text-[11px] uppercase tracking-wide">Role</span>
              <span>Credit Officer</span>
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline">Pipeline & origination focus</span>
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
            My Pipeline Snapshot
          </h2>
          <p className="hidden md:block text-[11px] text-slate-500">
            Applications and portfolio metrics
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">New Applications</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </div>
              <div className="rounded-full bg-emerald-50 text-emerald-700 p-2">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-700">
                {kpis.newApplications !== null ? kpis.newApplications : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">In Review</CardTitle>
                <CardDescription>Assigned to me</CardDescription>
              </div>
              <div className="rounded-full bg-blue-50 text-blue-700 p-2">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {kpis.applicationsInReview !== null ? kpis.applicationsInReview : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Awaiting Disbursement</CardTitle>
                <CardDescription>Approved, pending</CardDescription>
              </div>
              <div className="rounded-full bg-amber-50 text-amber-700 p-2">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {kpis.awaitingDisbursement !== null ? kpis.awaitingDisbursement : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Portfolio Outstanding</CardTitle>
                <CardDescription>My active loans (KES)</CardDescription>
              </div>
              <div className="rounded-full bg-emerald-50 text-emerald-700 p-2">
                <Wallet className="h-4 w-4" />
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
            onClick={() => navigate('/loan-applications/new')}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Application
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/clients')}
          >
            <Search className="h-4 w-4 mr-1" />
            Search Clients
          </Button>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* Pipeline Table */}
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Application Pipeline</CardTitle>
              <CardDescription>Recent applications across all stages</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/credit/pipeline')}
              className="text-emerald-700 hover:text-emerald-800"
            >
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading pipeline...</p>
            ) : pipelineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications in pipeline.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-500 uppercase">
                      <th className="pb-2 font-medium">Client</th>
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                      <th className="pb-2 font-medium">Stage</th>
                      <th className="pb-2 font-medium text-right">Days</th>
                      <th className="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pipelineItems.map((item) => {
                      const stage = getStageInfo(item.status);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-medium text-slate-900">
                            {item.clientName}
                          </td>
                          <td className="py-2.5 text-slate-600">{item.product}</td>
                          <td className="py-2.5 text-right text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                stage.color
                              )}
                            >
                              {stage.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-slate-600">
                            {item.daysInStage}d
                          </td>
                          <td className="py-2.5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => navigate(`/loan-applications/${item.id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC & Tasks Panel */}
        <div className="space-y-4">
          {/* KYC Follow-ups */}
          <Card className="border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">KYC Follow-ups</CardTitle>
              <CardDescription>Pending document collection</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : kycFollowUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending KYC items.</p>
              ) : (
                <ul className="space-y-3">
                  {kycFollowUps.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-2 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {item.clientName}
                        </p>
                        <p className="text-xs text-slate-500">
                          Missing: {item.missingDocs.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-600 font-medium">
                          {item.daysOutstanding}d
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => navigate(`/loan-applications/${item.id}`)}
                        >
                          Open
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Today's Reminders */}
          <Card className="border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Today's Reminders</CardTitle>
              <CardDescription>Scheduled follow-ups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>
                    {kpis.applicationsInReview !== null
                      ? `${kpis.applicationsInReview} applications need review`
                      : '— applications need review'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>
                    {kpis.awaitingDisbursement !== null
                      ? `${kpis.awaitingDisbursement} approved, awaiting disbursement`
                      : '— approved, awaiting disbursement'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
