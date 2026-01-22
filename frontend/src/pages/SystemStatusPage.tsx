import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import {
  Server,
  Database,
  Shield,
  Cpu,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  Zap,
  Lock,
  Users,
  FileText,
  CreditCard,
} from 'lucide-react';
import { formatDate } from '../lib/utils';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  lastChecked: string;
  icon: React.ElementType;
}

interface SystemMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

export default function SystemStatusPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [recentEvents, setRecentEvents] = useState<{ time: string; event: string; type: 'info' | 'warning' | 'error' }[]>([]);

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    setLoading(true);
    setError('System status endpoint is not available yet.');
    setServices([]);
    setMetrics([]);
    setRecentEvents([]);
    setLastRefresh(new Date());
    setLoading(false);
  };

  const getStatusColor = (status: 'operational' | 'degraded' | 'down') => {
    switch (status) {
      case 'operational':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'degraded':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'down':
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getStatusIcon = (status: 'operational' | 'degraded' | 'down') => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getMetricColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'critical':
        return 'bg-red-500';
    }
  };

  const getEventIcon = (type: 'info' | 'warning' | 'error') => {
    switch (type) {
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const operationalCount = services.filter(s => s.status === 'operational').length;
  const overallStatus = services.length === 0
    ? 'Status not available'
    : services.every(s => s.status === 'operational') 
      ? 'All Systems Operational' 
      : services.some(s => s.status === 'down')
        ? 'System Outage Detected'
        : 'Partial Degradation';

  // Stats for quick overview
  const stats = [
    { label: 'Active Users', value: '—', icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: 'Loans Processed Today', value: '—', icon: FileText, color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Payments Today', value: '—', icon: CreditCard, color: 'text-purple-600 bg-purple-100' },
    { label: 'Uptime', value: '—', icon: Activity, color: 'text-amber-600 bg-amber-100' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Status</h1>
          <p className="text-sm text-slate-500">
            Monitor system health and service availability
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Last updated: {formatDate(lastRefresh.toISOString())} at {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSystemStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Overall Status Banner */}
      <Card className={`border-2 ${
        overallStatus === 'All Systems Operational' 
          ? 'border-emerald-200 bg-emerald-50' 
          : overallStatus === 'System Outage Detected'
          ? 'border-red-200 bg-red-50'
          : 'border-amber-200 bg-amber-50'
      }`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {overallStatus === 'All Systems Operational' ? (
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              ) : overallStatus === 'System Outage Detected' ? (
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              )}
              <div>
                <h2 className={`text-lg font-semibold ${
                  overallStatus === 'All Systems Operational' 
                    ? 'text-emerald-900' 
                    : overallStatus === 'System Outage Detected'
                    ? 'text-red-900'
                    : 'text-amber-900'
                }`}>
                  {overallStatus}
                </h2>
                <p className={`text-sm ${
                  overallStatus === 'All Systems Operational' 
                    ? 'text-emerald-700' 
                    : overallStatus === 'System Outage Detected'
                    ? 'text-red-700'
                    : 'text-amber-700'
                }`}>
                  {services.length > 0 ? `${operationalCount} of ${services.length} services operational` : '—'}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">
                Avg Response:{' '}
                {services.length > 0
                  ? `${Math.round(services.reduce((acc, s) => acc + (s.latency || 0), 0) / services.length)}ms`
                  : '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Services Status */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-slate-500" />
              Service Status
            </CardTitle>
            <CardDescription>Real-time status of all system services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <service.icon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{service.name}</p>
                      <p className="text-xs text-slate-500">
                        {service.latency}ms latency
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {getStatusIcon(service.status)}
                    <span className="ml-1 capitalize">{service.status}</span>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Metrics */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="h-5 w-5 text-slate-500" />
              System Resources
            </CardTitle>
            <CardDescription>Server resource utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {metrics.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{metric.name}</span>
                    <span className="text-slate-500">
                      {metric.value}{metric.unit} / {metric.max}{metric.unit}
                    </span>
                  </div>
                  <Progress 
                    value={(metric.value / metric.max) * 100} 
                    className={`h-2 [&>div]:${getMetricColor(metric.status)}`}
                  />
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Security Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-500" />
                    <span className="text-slate-600">SSL/TLS</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">{services.length > 0 ? 'Active' : '—'}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <span className="text-slate-600">Firewall</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">{services.length > 0 ? 'Enabled' : '—'}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-500" />
                    <span className="text-slate-600">Encryption</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">{services.length > 0 ? 'AES-256' : '—'}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            Recent System Events
          </CardTitle>
          <CardDescription>Latest system activities and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {getEventIcon(event.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{event.event}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(event.time).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Info Footer */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="py-4">
          <div className="grid gap-4 md:grid-cols-4 text-center">
            <div>
              <p className="text-xs text-slate-500">Version</p>
              <p className="text-sm font-semibold text-slate-900">—</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Environment</p>
              <p className="text-sm font-semibold text-slate-900">—</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Last Deployment</p>
              <p className="text-sm font-semibold text-slate-900">—</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Server Region</p>
              <p className="text-sm font-semibold text-slate-900">—</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
