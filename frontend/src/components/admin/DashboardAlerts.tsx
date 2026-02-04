import { useState, useEffect } from 'react';
import { Users, FileText, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import staffNotificationsService, { DashboardAlerts as AlertsType } from '@/services/staffNotificationsService';

export default function DashboardAlerts() {
  const [alerts, setAlerts] = useState<AlertsType | null>(null);
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
    // Refresh alerts every 60 seconds
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

  const alertItems = [
    {
      label: 'Pending KYC Reviews',
      count: alerts.pendingKyc,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      link: '/clients?kycStatus=PENDING_REVIEW',
      description: 'Clients awaiting KYC verification',
    },
    {
      label: 'Pending Applications',
      count: alerts.pendingApplications,
      icon: FileText,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-700',
      link: '/loan-applications?status=SUBMITTED',
      description: 'Loan applications awaiting review',
    },
    {
      label: 'Overdue Loans',
      count: alerts.overdueLoans,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-700',
      link: '/loans?status=IN_ARREARS',
      description: 'Loans with overdue payments',
    },
  ];

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
