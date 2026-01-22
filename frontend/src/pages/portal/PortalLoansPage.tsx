import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalService } from '../../services/portalService';
import type { PortalLoanSummary } from '../../types/portal';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function PortalLoansPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<PortalLoanSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED' | 'IN_ARREARS'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await portalService.getLoans();
        setLoans(result);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load loans');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredLoans = loans.filter((loan) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return loan.status === 'ACTIVE';
    if (statusFilter === 'CLOSED') return loan.status === 'CLOSED';
    if (statusFilter === 'IN_ARREARS') return loan.inArrears;
    return true;
  });

  // Calculate stats
  const totalLoans = loans.length;
  const activeLoans = loans.filter(l => l.status === 'ACTIVE').length;
  const loansInArrears = loans.filter(l => l.inArrears).length;
  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstanding, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Loans</h1>
          <p className="text-sm text-slate-500">Track and manage all your loans in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">All Loans ({totalLoans})</option>
            <option value="ACTIVE">Active ({activeLoans})</option>
            <option value="IN_ARREARS">In Arrears ({loansInArrears})</option>
            <option value="CLOSED">Closed ({totalLoans - activeLoans})</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeLoans}</p>
                <p className="text-xs text-slate-500">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(totalOutstanding)}</p>
                <p className="text-xs text-slate-500">Total Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-slate-200 ${loansInArrears > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${loansInArrears > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${loansInArrears > 0 ? 'text-red-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${loansInArrears > 0 ? 'text-red-600' : 'text-slate-900'}`}>{loansInArrears}</p>
                <p className="text-xs text-slate-500">In Arrears</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loans List */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 w-full bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-32 w-full bg-slate-100 rounded-lg animate-pulse" />
        </div>
      ) : filteredLoans.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1">No Loans Found</h3>
            <p className="text-sm text-slate-500">
              {statusFilter === 'ALL' 
                ? "You don't have any loans yet." 
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
