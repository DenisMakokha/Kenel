import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalService } from '../../services/portalService';
import type { PortalLoanSummary, PortalLoanApplication } from '../../types/portal';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Pencil,
  Trash2,
  Banknote,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../lib/utils';

export default function PortalLoansPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loans, setLoans] = useState<PortalLoanSummary[]>([]);
  const [applications, setApplications] = useState<PortalLoanApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED' | 'IN_ARREARS'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [loansResult, applicationsResult] = await Promise.all([
          portalService.getLoans(),
          portalService.getLoanApplications(),
        ]);
        setLoans(loansResult);
        setApplications(applicationsResult);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDeleteDraft = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this draft application?')) return;
    try {
      setDeletingAppId(appId);
      await portalService.deleteLoanApplication(appId);
      setApplications(applications.filter(app => app.id !== appId));
      toast.success('Deleted', 'Draft application has been deleted.');
    } catch (err: any) {
      toast.error('Delete failed', err?.response?.data?.message || 'Could not delete application');
    } finally {
      setDeletingAppId(null);
    }
  };

  const filteredLoans = loans.filter((loan) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return loan.status === 'ACTIVE';
    if (statusFilter === 'CLOSED') return loan.status === 'CLOSED';
    if (statusFilter === 'IN_ARREARS') return loan.inArrears;
    return true;
  });

  // Calculate stats
  const activeLoans = loans.filter(l => l.status === 'ACTIVE').length;
  const loansInArrears = loans.filter(l => l.inArrears).length;
  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstanding, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Loans</h1>
          <p className="text-sm text-slate-600">Track and manage all your loans</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter loans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Loans</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="IN_ARREARS">In Arrears</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/portal/apply')} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Apply Now
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{activeLoans}</p>
                <p className="text-xs text-muted-foreground">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(totalOutstanding)}</p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={loansInArrears > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${loansInArrears > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${loansInArrears > 0 ? 'text-red-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${loansInArrears > 0 ? 'text-red-600' : ''}`}>{loansInArrears}</p>
                <p className="text-xs text-muted-foreground">In Arrears</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Pending Applications Section - only show DRAFT, SUBMITTED, UNDER_REVIEW */}
      {!loading && applications.filter(app => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(app.status)).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Pending Applications
          </h2>
          <div className="space-y-3">
            {applications
              .filter(app => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(app.status))
              .map((app) => {
                const getStatusConfig = (status: string) => {
                  switch (status) {
                    case 'DRAFT':
                      return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Draft' };
                    case 'SUBMITTED':
                      return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Submitted' };
                    case 'UNDER_REVIEW':
                      return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Under Review' };
                    case 'APPROVED':
                      return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Approved' };
                    case 'REJECTED':
                      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' };
                    default:
                      return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-100', label: status };
                  }
                };
                const statusConfig = getStatusConfig(app.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={app.id} className="border-slate-200 bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full ${statusConfig.bg} flex items-center justify-center`}>
                            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900">{app.productName}</h3>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span>{formatCurrency(Number(app.requestedAmount))}</span>
                              <span>•</span>
                              <span>{app.requestedTermMonths} months</span>
                              <span>•</span>
                              <span>
                                {app.submittedAt 
                                  ? `Submitted ${new Date(app.submittedAt).toLocaleDateString('en-KE')}`
                                  : `Created ${new Date(app.createdAt).toLocaleDateString('en-KE')}`
                                }
                              </span>
                            </div>
                            {app.status === 'REJECTED' && app.rejectionReason && (
                              <p className="text-xs text-red-600 mt-1">
                                Reason: {app.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {app.status === 'DRAFT' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/portal/apply?edit=${app.id}`)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDraft(app.id)}
                                disabled={deletingAppId === app.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Approved Applications Section */}
      {!loading && applications.filter(app => app.status === 'APPROVED').length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Approved Applications
          </h2>
          <div className="space-y-3">
            {applications
              .filter(app => app.status === 'APPROVED')
              .map((app) => (
                <Card key={app.id} className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{app.productName}</h3>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span>{formatCurrency(Number(app.requestedAmount))}</span>
                            <span>•</span>
                            <span>{app.requestedTermMonths} months</span>
                            <span>•</span>
                            <span>Approved {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-600 border-0">
                        {app.loanId ? 'Disbursed' : 'Approved'}
                      </Badge>
                    </div>
                    <p className="text-xs text-emerald-700 mt-2">
                      {app.loanId ? 'Loan has been disbursed' : 'Awaiting loan disbursement'}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Rejected Applications Section */}
      {!loading && applications.filter(app => app.status === 'REJECTED').length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Rejected Applications
          </h2>
          <div className="space-y-3">
            {applications
              .filter(app => app.status === 'REJECTED')
              .map((app) => (
                <Card key={app.id} className="border-red-200 bg-red-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{app.productName}</h3>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span>{formatCurrency(Number(app.requestedAmount))}</span>
                            <span>•</span>
                            <span>{app.requestedTermMonths} months</span>
                            <span>•</span>
                            <span>Rejected {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-600 border-0">Rejected</Badge>
                    </div>
                    {app.rejectionReason && (
                      <p className="text-xs text-red-700 mt-2">Reason: {app.rejectionReason}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Loans List */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 w-full bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-32 w-full bg-slate-100 rounded-lg animate-pulse" />
        </div>
      ) : filteredLoans.length === 0 && applications.filter(app => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(app.status)).length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1">No Loans Found</h3>
            <p className="text-sm text-slate-500 mb-4">
              You don't have any loans or applications yet.
            </p>
            <Button 
              onClick={() => navigate('/portal/apply')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Apply for a Loan
            </Button>
          </CardContent>
        </Card>
      ) : filteredLoans.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-slate-500">
              {statusFilter === 'ALL' 
                ? "No active loans yet. Your application is being processed." 
                : `No loans match the "${statusFilter.toLowerCase().replace('_', ' ')}" filter.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => {
            const progress = loan.principal > 0 
              ? Math.round(((loan.principal - loan.outstanding) / loan.principal) * 100)
              : 0;
            
            return (
              <Card 
                key={loan.id} 
                className={`border-slate-200 bg-white hover:shadow-md transition-shadow cursor-pointer ${
                  loan.inArrears ? 'border-l-4 border-l-red-500' : ''
                }`}
                onClick={() => navigate(`/portal/loans/${loan.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Left side - Loan info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{loan.productName}</h3>
                            <Badge variant="outline" className="text-xs font-mono">
                              {loan.loanNumber}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span>Principal: {formatCurrency(loan.principal)}</span>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        {loan.inArrears ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {loan.daysPastDue} days overdue
                          </Badge>
                        ) : loan.status === 'ACTIVE' ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600">Closed</Badge>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Repayment Progress</span>
                          <span className="font-medium text-slate-700">{progress}% paid</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Paid: {formatCurrency(loan.principal - loan.outstanding)}</span>
                          <span>Remaining: {formatCurrency(loan.outstanding)}</span>
                        </div>
                      </div>

                      {/* Next Payment */}
                      {loan.nextDueDate && loan.status === 'ACTIVE' && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">
                            Next payment due: {new Date(loan.nextDueDate).toLocaleDateString('en-KE', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right side - Action */}
                    <div className="flex items-center">
                      <Button variant="ghost" size="sm" className="text-emerald-600">
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
