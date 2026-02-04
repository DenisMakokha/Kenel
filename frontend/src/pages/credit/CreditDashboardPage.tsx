import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  FileText,
  Clock,
  Plus,
  Search,
  ChevronRight,
  Wallet,
  CheckCircle,
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
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {user?.firstName || 'there'}!</h1>
          <p className="text-sm text-slate-600">Your loan pipeline and tasks for today</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/loan-applications/new')} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
          <Button variant="outline" onClick={() => navigate('/clients')}>
            <Search className="h-4 w-4 mr-2" />
            Clients
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">New Applications</CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{loading ? '...' : kpis.newApplications ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? '...' : kpis.applicationsInReview ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Awaiting Disbursement</CardTitle>
            <CheckCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{loading ? '...' : kpis.awaitingDisbursement ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Portfolio Outstanding</CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{loading ? '...' : kpis.portfolioOutstanding !== null ? formatCurrency(kpis.portfolioOutstanding) : '—'}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* Pipeline */}
        <Card className="border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Application Pipeline</CardTitle>
              <CardDescription>Recent applications</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/credit/pipeline')}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading pipeline...</p>
            ) : pipelineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No applications yet</p>
            ) : (
              <div className="space-y-2">
                {pipelineItems.map((item) => {
                  const stage = getStageInfo(item.status);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/loan-applications/${item.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{item.clientName}</p>
                          <Badge className={cn('text-xs', stage.color)}>{stage.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.product} • {formatCurrency(item.amount)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {item.daysInStage}d ago
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* KYC Follow-ups */}
          <Card className="border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">KYC Follow-ups</CardTitle>
              <CardDescription className="text-xs">Pending documents</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : kycFollowUps.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">All clear!</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {kycFollowUps.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/loan-applications/${item.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.clientName}</p>
                        <p className="text-xs text-muted-foreground">Missing: {item.missingDocs.join(', ')}</p>
                      </div>
                      <Badge variant="outline">{item.daysOutstanding}d</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card className="border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-md bg-blue-50">
                <div>
                  <p className="text-sm font-medium">Applications to Review</p>
                  <p className="text-xs text-muted-foreground">Needs attention</p>
                </div>
                <Badge className="bg-blue-100 text-blue-700">{kpis.applicationsInReview ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-amber-50">
                <div>
                  <p className="text-sm font-medium">Pending Disbursement</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700">{kpis.awaitingDisbursement ?? 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
