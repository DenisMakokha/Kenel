import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  Wallet,
  CreditCard,
  Calendar,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  Banknote,
  PiggyBank,
  Receipt,
  Phone,
  HelpCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { portalService } from '../../services/portalService';
import { usePortalAuthStore } from '../../store/portalAuthStore';
import type { PortalDashboardResponse, PortalLoanApplication } from '../../types/portal';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';
import { NotificationBanner } from '../../components/portal/NotificationBanner';

export default function PortalDashboardPage() {
  const navigate = useNavigate();
  const { client } = usePortalAuthStore();
  const { toast } = useToast();
  const [data, setData] = useState<PortalDashboardResponse | null>(null);
  const [applications, setApplications] = useState<PortalLoanApplication[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const hasActiveLoan = (data?.summary.totalActiveLoans || 0) > 0;

  const handleApplyClick = () => {
    if (hasActiveLoan) {
      toast.warning(
        'Active loan detected',
        'You cannot apply for another loan while you have an active loan. Please track your loan under My Loans.'
      );
      navigate('/portal/loans');
      return;
    }
    navigate('/portal/apply');
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [dashResult, appsResult] = await Promise.all([
          portalService.getDashboard(),
          portalService.getLoanApplications(),
        ]);
        setData(dashResult);
        setApplications(appsResult);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);


  const normalizeApplicationStatus = (status: string) => {
    const statusKey = (status || '').toUpperCase();
    return statusKey === 'RETURNED_TO_CLIENT' ? 'RETURNED' : statusKey;
  };

  const pendingApplications = applications.filter((app) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED'].includes(normalizeApplicationStatus(app.status))
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {client?.firstName || 'Customer'}! 👋
            </h1>
            <p className="text-emerald-100 mt-1">
              Welcome to your personal loan dashboard. Here's your financial overview.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => navigate('/portal/loans')}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              View Loans
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Notification Banners */}
      <NotificationBanner maxBanners={2} />

      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Active Loans</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-12 bg-slate-200 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-3xl font-bold text-slate-900">
                  {data?.summary.totalActiveLoans || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Current loans</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Outstanding</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(data?.summary.totalOutstanding || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Balance to pay</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Next Payment</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
            ) : data?.summary.nextPayment ? (
              <>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(data.summary.nextPayment.amount || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Due {new Date(data.summary.nextPayment.dueDate).toLocaleDateString('en-KE', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-slate-400">No payment due</p>
                <p className="text-xs text-slate-500 mt-1">You're all caught up!</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Payment Status</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
            ) : (
              <>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Good Standing
                </Badge>
                <p className="text-xs text-slate-500 mt-2">All payments on time</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Payment Alert */}
      {data?.summary.nextPayment && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">Upcoming Payment</h3>
                  <p className="text-sm text-amber-700">
                    Your next payment of <strong>{formatCurrency(data.summary.nextPayment.amount || 0)}</strong> for 
                    loan <strong>{data.summary.nextPayment.loanNumber}</strong> is due on{' '}
                    <strong>{new Date(data.summary.nextPayment.dueDate).toLocaleDateString('en-KE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</strong>
                  </p>
                  {getDaysUntilDue(data.summary.nextPayment.dueDate) <= 7 && (
                    <Badge className="mt-2 bg-amber-200 text-amber-800">
                      {getDaysUntilDue(data.summary.nextPayment.dueDate)} days remaining
                    </Badge>
                  )}
                </div>
              </div>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => navigate('/portal/pay')}>
                <Banknote className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Applications Section */}
      {!loading && pendingApplications.length > 0 && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Pending Applications
              </CardTitle>
              <CardDescription>Track your loan application status</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/portal/loans')}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {pendingApplications.slice(0, 3).map((app) => {
                const getStatusConfig = (status: string) => {
                  const normalizedStatus = normalizeApplicationStatus(status);
                  switch (normalizedStatus) {
                    case 'SUBMITTED':
                      return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Submitted' };
                    case 'UNDER_REVIEW':
                      return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Under Review' };
                    case 'APPROVED':
                      return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Approved' };
                    case 'REJECTED':
                      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' };
                    case 'RETURNED':
                      return { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Returned' };
                    default:
                      return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-100', label: normalizedStatus };
                  }
                };
                const statusConfig = getStatusConfig(app.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={app.id}
                    className="rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => navigate(`/portal/applications/${app.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${statusConfig.bg} flex items-center justify-center`}>
                          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{app.productName}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>{formatCurrency(Number(app.requestedAmount))}</span>
                            <span>•</span>
                            <span>{app.requestedTermMonths} months</span>
                          </div>
                          {app.status === 'REJECTED' && app.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">
                              Reason: {app.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Loans */}
        <div className="md:col-span-2">
          <Card className="border-slate-200 bg-white h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Your Active Loans</CardTitle>
                <CardDescription>Track your loan progress and payments</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portal/loans')}>
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <div className="h-24 w-full bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-24 w-full bg-slate-100 rounded-lg animate-pulse" />
                </div>
              ) : !data || data.activeLoans.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-900 mb-1">No Active Loans</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    You don't have any active loans at the moment.
                  </p>
                  <Button variant="outline" onClick={handleApplyClick}>
                    Apply for a Loan
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.activeLoans.slice(0, 3).map((loan) => {
                    const progress = loan.principal > 0 
                      ? Math.round(((loan.principal - loan.outstanding) / loan.principal) * 100)
                      : 0;
                    
                    return (
                      <div
                        key={loan.id}
                        className="rounded-lg border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => navigate(`/portal/loans/${loan.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900">{loan.productName}</h4>
                              <Badge variant="outline" className="text-xs">
                                {loan.loanNumber}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              Outstanding: {formatCurrency(loan.outstanding)}
                            </p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Repayment Progress</span>
                            <span className="font-medium text-slate-700">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {loan.nextDueDate && (
                          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            Next payment: {new Date(loan.nextDueDate).toLocaleDateString('en-KE', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => navigate('/portal/loans')}
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">View My Loans</div>
                  <div className="text-xs text-slate-500">Check loan details</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => navigate('/portal/statements')}
              >
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Get Statement</div>
                  <div className="text-xs text-slate-500">Download PDF statement</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => navigate('/portal/statements')}
              >
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center mr-3">
                  <Receipt className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Payment History</div>
                  <div className="text-xs text-slate-500">View past payments</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={handleApplyClick}
              >
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                  <PiggyBank className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Apply for Loan</div>
                  <div className="text-xs text-slate-500">Start new application</div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Need Help?</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Our support team is available to assist you.
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-emerald-600" onClick={() => window.open('tel:+254759599124')}>
                    <Phone className="h-3 w-3 mr-1" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
