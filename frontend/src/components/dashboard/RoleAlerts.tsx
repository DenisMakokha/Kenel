import { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw,
  Wallet,
  Shield,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import staffNotificationsService, { DashboardAlerts } from '@/services/staffNotificationsService';

interface AlertItem {
  label: string;
  count: number;
  icon: any;
  color: string;
  bgColor: string;
  textColor: string;
  link: string;
  description: string;
}

interface RoleAlertsProps {
  role: 'CREDIT_OFFICER' | 'FINANCE_OFFICER' | 'ADMIN';
}

export default function RoleAlerts({ role }: RoleAlertsProps) {
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      const data = await staffNotificationsService.getDashboardAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!alerts) return null;

  const getAlertItems = (): AlertItem[] => {
    if (role === 'CREDIT_OFFICER') {
      return [
        {
          label: 'Pending KYC Reviews',
          count: alerts.pendingKycReviews ?? alerts.pendingKyc ?? 0,
          icon: Users,
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-700',
          link: '/kyc-reviews?status=PENDING_REVIEW',
          description: 'Clients awaiting KYC verification',
        },
        {
          label: 'Applications to Review',
          count: alerts.pendingApplications ?? 0,
          icon: FileText,
          color: 'bg-amber-500',
          bgColor: 'bg-amber-50 border-amber-200',
          textColor: 'text-amber-700',
          link: '/loan-applications?status=SUBMITTED',
          description: 'New applications awaiting review',
        },
        {
          label: 'Under Review',
          count: alerts.applicationsUnderReview ?? 0,
          icon: Clock,
          color: 'bg-purple-500',
          bgColor: 'bg-purple-50 border-purple-200',
          textColor: 'text-purple-700',
          link: '/loan-applications?status=UNDER_REVIEW',
          description: 'Applications currently being reviewed',
        },
      ];
    }

    if (role === 'FINANCE_OFFICER') {
      return [
        {
          label: 'Pending Disbursements',
          count: alerts.pendingDisbursements ?? 0,
          icon: Wallet,
          color: 'bg-emerald-500',
          bgColor: 'bg-emerald-50 border-emerald-200',
          textColor: 'text-emerald-700',
          link: '/loans?status=PENDING_DISBURSEMENT',
          description: 'Approved loans awaiting disbursement',
        },
        {
          label: 'Loans in Arrears',
          count: alerts.loansInArrears ?? alerts.overdueLoans ?? 0,
          icon: AlertTriangle,
          color: 'bg-amber-500',
          bgColor: 'bg-amber-50 border-amber-200',
          textColor: 'text-amber-700',
          link: '/finance/arrears',
          description: 'Loans with overdue payments',
        },
        {
          label: 'High Value Arrears',
          count: alerts.highValueArrears ?? 0,
          icon: AlertTriangle,
          color: 'bg-red-500',
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-700',
          link: '/finance/arrears?minAmount=100000',
          description: 'Arrears over KES 100,000',
        },
      ];
    }

    // ADMIN
    return [
      {
        label: 'Pending KYC Reviews',
        count: alerts.pendingKyc ?? 0,
        icon: Users,
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-700',
        link: '/kyc-reviews?status=PENDING_REVIEW',
        description: 'Clients awaiting KYC verification',
      },
      {
        label: 'Pending Applications',
        count: alerts.pendingApplications ?? 0,
        icon: FileText,
        color: 'bg-amber-500',
        bgColor: 'bg-amber-50 border-amber-200',
        textColor: 'text-amber-700',
        link: '/loan-applications?status=SUBMITTED',
        description: 'Loan applications awaiting review',
      },
      {
        label: 'Overdue Loans',
        count: alerts.overdueLoans ?? 0,
        icon: AlertTriangle,
        color: 'bg-red-500',
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-700',
        link: '/loans?status=IN_ARREARS',
        description: 'Loans with overdue payments',
      },
      ...(alerts.documentsWithThreats && alerts.documentsWithThreats > 0
        ? [
            {
              label: 'Security Threats',
              count: alerts.documentsWithThreats,
              icon: Shield,
              color: 'bg-red-600',
              bgColor: 'bg-red-50 border-red-300',
              textColor: 'text-red-800',
              link: '/documents?virusScanStatus=infected',
              description: 'Documents flagged by virus scan',
            },
          ]
        : []),
    ];
  };

  const alertItems = getAlertItems();
  const hasAlerts = alertItems.some((item) => item.count > 0);

  if (!hasAlerts) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Action Required</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-slate-500"
          onClick={fetchAlerts}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {alertItems.map((item) => {
          if (item.count === 0) return null;
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`relative overflow-hidden rounded-xl border p-4 ${item.bgColor} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => navigate(item.link)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg ${item.color} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className={`text-2xl font-bold ${item.textColor}`}>{item.count}</span>
                  </div>
                  <p className={`mt-2 text-sm font-medium ${item.textColor}`}>{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                </div>
                <ArrowRight className={`h-4 w-4 ${item.textColor} opacity-50`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
