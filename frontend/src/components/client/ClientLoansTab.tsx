import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../../types/client';
import { loanService } from '../../services/loanService';
import type { Loan } from '../../types/loan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatDate, formatCurrency } from '../../lib/utils';
import {
  Wallet,
  TrendingUp,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Banknote,
  FileText,
} from 'lucide-react';

interface ClientLoansTabProps {
  client: Client;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200', icon: CheckCircle },
  PENDING_DISBURSEMENT: { label: 'Pending Disbursement', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200', icon: Clock },
  CLOSED: { label: 'Closed', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200', icon: CheckCircle },
  WRITTEN_OFF: { label: 'Written Off', color: 'text-red-700', bg: 'bg-red-100 border-red-200', icon: XCircle },
  DEFAULTED: { label: 'Defaulted', color: 'text-red-700', bg: 'bg-red-100 border-red-200', icon: AlertTriangle },
};

export default function ClientLoansTab({ client }: ClientLoansTabProps) {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await loanService.getLoans({ clientId: client.id, page: 1, limit: 50 });
        setLoans(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load loan history');
      } finally {
        setLoading(false);
      }
    };

    if (client?.id) {
      load();
    }
  }, [client?.id]);

  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const totalDisbursed = loans.reduce((sum, l) => sum + Number(l.principalAmount || 0), 0);
  const totalOutstanding = activeLoans.reduce(
    (sum, l) => sum + Number(l.outstandingPrincipal || 0) + Number(l.outstandingInterest || 0),
    0
  );

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12 text-center">
          <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3 animate-spin" />
          <p className="text-slate-500">Loading loan history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Loans</p>
                <p className="text-3xl font-bold text-slate-900">{loans.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{activeLoans.length} active</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Disbursed</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalDisbursed)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Banknote className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Lifetime total</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Outstanding</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalOutstanding)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Principal + Interest</p>
          </CardContent>
        </Card>
      </div>

      {/* Loans List */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-5 w-5 text-slate-600" />
            Loan History
          </CardTitle>
          <CardDescription>{loans.length} loan(s) on record</CardDescription>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <Wallet className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No loans yet</p>
              <p className="text-sm text-slate-500 mt-1">Approved applications can be converted into loans</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {loans.map((loan) => {
                const statusConfig = STATUS_CONFIG[loan.status] || STATUS_CONFIG.ACTIVE;
                const StatusIcon = statusConfig.icon;
                const outstanding = Number(loan.outstandingPrincipal || 0) + Number(loan.outstandingInterest || 0);
                const progress = loan.principalAmount
                  ? Math.round(((Number(loan.principalAmount) - Number(loan.outstandingPrincipal || 0)) / Number(loan.principalAmount)) * 100)
                  : 0;

                return (
                  <div
                    key={loan.id}
                    className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${statusConfig.bg}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-sm text-slate-600">{loan.loanNumber}</p>
                        <Badge className={`mt-1 ${statusConfig.bg} ${statusConfig.color} border`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/loans/${loan.id}`)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Principal</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(Number(loan.principalAmount))}</span>
                      </div>
                      {loan.status === 'ACTIVE' && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Outstanding</span>
                            <span className="font-semibold text-amber-700">{formatCurrency(outstanding)}</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Repaid</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-4 pt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {loan.disbursedAt ? formatDate(loan.disbursedAt) : 'Not disbursed'}
                        </span>
                        {loan.maturityDate && (
                          <span className="flex items-center gap-1">
                            Due: {formatDate(loan.maturityDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
