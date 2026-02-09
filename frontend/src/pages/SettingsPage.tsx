import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Settings,
  Building2,
  Bell,
  Shield,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
  Save,
  Mail,
  Send,
  Eye,
  EyeOff,
  TestTube,
  Server,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../components/ui/use-toast';
import api from '../lib/api';
import { COMPANY_CONFIG } from '../config/company';

interface SystemSetting {
  key: string;
  value: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'email' | 'url' | 'toggle';
  category: string;
}

const DEFAULT_SETTINGS: SystemSetting[] = [
  // Organization Settings
  {
    key: 'org_name',
    value: COMPANY_CONFIG.fullName,
    label: 'Organization Name',
    description: 'The name of your organization',
    type: 'text',
    category: 'organization',
  },
  {
    key: 'org_email',
    value: COMPANY_CONFIG.email,
    label: 'Contact Email',
    description: 'Primary contact email for the organization',
    type: 'email',
    category: 'organization',
  },
  {
    key: 'org_phone',
    value: COMPANY_CONFIG.phone,
    label: 'Contact Phone',
    description: 'Primary contact phone number',
    type: 'text',
    category: 'organization',
  },
  {
    key: 'org_address',
    value: COMPANY_CONFIG.location.address,
    label: 'Address',
    description: 'Physical address of the organization',
    type: 'text',
    category: 'organization',
  },
  // Loan Settings
  {
    key: 'default_currency',
    value: 'KES',
    label: 'Default Currency',
    description: 'Default currency for all transactions',
    type: 'text',
    category: 'loans',
  },
  {
    key: 'max_loan_amount',
    value: '5000000',
    label: 'Maximum Loan Amount',
    description: 'Maximum amount that can be disbursed for a single loan',
    type: 'number',
    category: 'loans',
  },
  {
    key: 'min_loan_amount',
    value: '1000',
    label: 'Minimum Loan Amount',
    description: 'Minimum amount for a loan application',
    type: 'number',
    category: 'loans',
  },
  {
    key: 'grace_period_days',
    value: '3',
    label: 'Grace Period (Days)',
    description: 'Number of days before penalties apply',
    type: 'number',
    category: 'loans',
  },
  {
    key: 'penalty_rate',
    value: '5',
    label: 'Penalty Rate (%)',
    description: 'Percentage penalty for late payments',
    type: 'number',
    category: 'loans',
  },
  // Notification Settings
  {
    key: 'email_notifications',
    value: 'true',
    label: 'Email Notifications',
    description: 'Send email notifications for important events',
    type: 'toggle',
    category: 'notifications',
  },
  {
    key: 'sms_notifications',
    value: 'false',
    label: 'SMS Notifications',
    description: 'Send SMS notifications for important events',
    type: 'toggle',
    category: 'notifications',
  },
  {
    key: 'reminder_days_before',
    value: '3',
    label: 'Payment Reminder (Days)',
    description: 'Days before due date to send payment reminder',
    type: 'number',
    category: 'notifications',
  },
  // Security Settings
  {
    key: 'session_timeout',
    value: '30',
    label: 'Session Timeout (Minutes)',
    description: 'Minutes of inactivity before automatic logout',
    type: 'number',
    category: 'security',
  },
  {
    key: 'password_expiry_days',
    value: '90',
    label: 'Password Expiry (Days)',
    description: 'Days before password must be changed',
    type: 'number',
    category: 'security',
  },
  {
    key: 'max_login_attempts',
    value: '5',
    label: 'Max Login Attempts',
    description: 'Maximum failed login attempts before account lock',
    type: 'number',
    category: 'security',
  },
];

interface SmtpConfig {
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

const DEFAULT_SMTP: SmtpConfig = {
  host: '',
  port: '587',
  secure: false,
  username: '',
  password: '',
  fromEmail: '',
  fromName: 'Kenels LMS',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('organization');

  // SMTP Configuration
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(DEFAULT_SMTP);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [smtpStatus, setSmtpStatus] = useState<'unconfigured' | 'configured' | 'error'>('unconfigured');

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/settings');

        // Populate SMTP config
        if (data.smtp) {
          setSmtpConfig({
            host: data.smtp.host || '',
            port: String(data.smtp.port || '587'),
            secure: data.smtp.secure || false,
            username: data.smtp.username || '',
            password: '', // Never returned from API
            fromEmail: data.smtp.fromEmail || '',
            fromName: data.smtp.fromName || 'Kenels LMS',
          });
          if (data.smtp.host) setSmtpStatus('configured');
        }

        // Populate general/organization settings
        setSettings((prev) =>
          prev.map((s) => {
            if (s.category === 'organization') {
              const keyMap: Record<string, string> = {
                org_name: data.general?.companyName,
                org_email: data.general?.contactEmail,
                org_phone: data.general?.contactPhone,
                org_address: data.general?.address,
              };
              return keyMap[s.key] ? { ...s, value: keyMap[s.key] } : s;
            }
            if (s.category === 'loans') {
              return data.loans?.[s.key] ? { ...s, value: data.loans[s.key] } : s;
            }
            if (s.category === 'notifications') {
              return data.notifications?.[s.key] ? { ...s, value: data.notifications[s.key] } : s;
            }
            if (s.category === 'security') {
              return data.security?.[s.key] ? { ...s, value: data.security[s.key] } : s;
            }
            return s;
          })
        );
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
    setSaved(false);
  };

  const handleToggle = (key: string) => {
    setSettings((prev) =>
      prev.map((s) =>
        s.key === key ? { ...s, value: s.value === 'true' ? 'false' : 'true' } : s
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build payloads by category from current settings
      const orgSettings = settings.filter((s) => s.category === 'organization');
      const loanSettings = settings.filter((s) => s.category === 'loans');
      const notifSettings = settings.filter((s) => s.category === 'notifications');
      const secSettings = settings.filter((s) => s.category === 'security');

      // Save organization/general
      const generalPayload: Record<string, string> = {};
      const orgKeyMap: Record<string, string> = {
        org_name: 'companyName',
        org_email: 'contactEmail',
        org_phone: 'contactPhone',
        org_address: 'address',
      };
      orgSettings.forEach((s) => {
        generalPayload[orgKeyMap[s.key] || s.key] = s.value;
      });

      const toMap = (arr: SystemSetting[]) => {
        const m: Record<string, string> = {};
        arr.forEach((s) => (m[s.key] = s.value));
        return m;
      };

      await Promise.all([
        api.put('/settings/general', generalPayload),
        api.put('/settings/category/loans', toMap(loanSettings)),
        api.put('/settings/category/notifications', toMap(notifSettings)),
        api.put('/settings/category/security', toMap(secSettings)),
      ]);

      setSaved(true);
      toast({
        title: 'Settings saved',
        description: 'All system settings have been saved successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSmtpChange = (key: keyof SmtpConfig, value: string | boolean) => {
    setSmtpConfig((prev) => ({ ...prev, [key]: value }));
    setSmtpStatus('unconfigured');
  };

  const handleSaveSmtp = async () => {
    setSaving(true);
    try {
      await api.put('/settings/smtp', {
        host: smtpConfig.host,
        port: Number(smtpConfig.port),
        secure: smtpConfig.secure,
        username: smtpConfig.username,
        password: smtpConfig.password,
        fromEmail: smtpConfig.fromEmail,
        fromName: smtpConfig.fromName,
      });
      setSmtpStatus('configured');
      toast({
        title: 'SMTP configured',
        description: 'Email settings have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save SMTP settings. Please check the details and try again.',
        variant: 'destructive',
      });
      setSmtpStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address.',
        variant: 'destructive',
      });
      return;
    }

    setTestingEmail(true);
    try {
      await api.post('/settings/smtp/test', {
        config: {
          host: smtpConfig.host,
          port: Number(smtpConfig.port),
          secure: smtpConfig.secure,
          username: smtpConfig.username,
          password: smtpConfig.password,
          fromEmail: smtpConfig.fromEmail,
          fromName: smtpConfig.fromName,
        },
        testEmail: testEmailAddress,
      });
      toast({
        title: 'Test email sent',
        description: `A test email has been sent to ${testEmailAddress}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email. Please verify SMTP settings and try again.',
        variant: 'destructive',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const getSettingsByCategory = (category: string) =>
    settings.filter((s) => s.category === category);

  const renderSetting = (setting: SystemSetting) => {
    if (setting.type === 'toggle') {
      return (
        <div
          key={setting.key}
          className="flex items-center justify-between py-4 border-b last:border-0"
        >
          <div>
            <p className="font-medium text-slate-900">{setting.label}</p>
            <p className="text-sm text-slate-500">{setting.description}</p>
          </div>
          <button
            onClick={() => handleToggle(setting.key)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              setting.value === 'true' ? 'bg-emerald-600' : 'bg-slate-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                setting.value === 'true' ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      );
    }

    return (
      <div key={setting.key} className="py-4 border-b last:border-0">
        <Label htmlFor={setting.key} className="text-slate-900">
          {setting.label}
        </Label>
        <p className="text-xs text-slate-500 mb-2">{setting.description}</p>
        <Input
          id={setting.key}
          type={setting.type === 'number' ? 'number' : 'text'}
          value={setting.value}
          onChange={(e) => handleChange(setting.key, e.target.value)}
          className="max-w-md"
        />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-sm text-slate-600">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <Badge className="bg-emerald-100 text-emerald-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      )}

      {/* System Status */}
      <Card className="border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-emerald-600">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium">API Server</p>
                <p className="text-xs text-emerald-600">Running</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', smtpStatus === 'configured' ? 'bg-emerald-100' : 'bg-amber-100')}>
                {smtpStatus === 'configured' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
              </div>
              <div>
                <p className="text-sm font-medium">Email Service</p>
                <p className={cn('text-xs', smtpStatus === 'configured' ? 'text-emerald-600' : 'text-amber-600')}>
                  {smtpStatus === 'configured' ? 'Configured' : 'Not Configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Last Backup</p>
                <p className="text-xs text-slate-600">Never</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </TabsTrigger>
          <TabsTrigger value="loans" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Loans</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Settings
              </CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getSettingsByCategory('organization').map(renderSetting)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
          <Card className="border-slate-100 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Loan Settings
              </CardTitle>
              <CardDescription>
                Configure default loan parameters and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getSettingsByCategory('loans').map(renderSetting)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card className="border-slate-100 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    SMTP Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure email server settings for sending notifications
                  </CardDescription>
                </div>
                <Badge className={cn(
                  smtpStatus === 'configured' && 'bg-emerald-100 text-emerald-700',
                  smtpStatus === 'unconfigured' && 'bg-amber-100 text-amber-700',
                  smtpStatus === 'error' && 'bg-red-100 text-red-700'
                )}>
                  {smtpStatus === 'configured' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {smtpStatus === 'unconfigured' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {smtpStatus === 'configured' ? 'Configured' : smtpStatus === 'error' ? 'Error' : 'Not Configured'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={smtpConfig.host}
                    onChange={(e) => handleSmtpChange('host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">Port</Label>
                  <Input
                    id="smtp_port"
                    value={smtpConfig.port}
                    onChange={(e) => handleSmtpChange('port', e.target.value)}
                    placeholder="587"
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_username">Username</Label>
                  <Input
                    id="smtp_username"
                    value={smtpConfig.username}
                    onChange={(e) => handleSmtpChange('username', e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">Password / App Password</Label>
                  <div className="relative mt-2">
                    <Input
                      id="smtp_password"
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpConfig.password}
                      onChange={(e) => handleSmtpChange('password', e.target.value)}
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    >
                      {showSmtpPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_from_email">From Email</Label>
                  <Input
                    id="smtp_from_email"
                    type="email"
                    value={smtpConfig.fromEmail}
                    onChange={(e) => handleSmtpChange('fromEmail', e.target.value)}
                    placeholder="noreply@kenelsbureau.com"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_from_name">From Name</Label>
                  <Input
                    id="smtp_from_name"
                    value={smtpConfig.fromName}
                    onChange={(e) => handleSmtpChange('fromName', e.target.value)}
                    placeholder="Kenels LMS"
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-t">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSmtpChange('secure', !smtpConfig.secure)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      smtpConfig.secure ? 'bg-emerald-600' : 'bg-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        smtpConfig.secure ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Use SSL/TLS</span>
                </div>
                <Button
                  onClick={handleSaveSmtp}
                  disabled={saving || !smtpConfig.host}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save SMTP Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Email Configuration
              </CardTitle>
              <CardDescription>
                Send a test email to verify your SMTP settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Enter email address to test"
                  className="flex-1"
                />
                <Button
                  onClick={handleTestEmail}
                  disabled={testingEmail || smtpStatus !== 'configured'}
                  variant="outline"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {testingEmail ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
              {smtpStatus !== 'configured' && (
                <p className="text-xs text-amber-600 mt-2">
                  Save your SMTP settings first before testing
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-100 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Configure email notification templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Payment Reminder', description: 'Sent before payment due date', enabled: true },
                  { name: 'Payment Received', description: 'Confirmation when payment is received', enabled: true },
                  { name: 'Loan Approved', description: 'Notification when loan is approved', enabled: true },
                  { name: 'Loan Disbursed', description: 'Notification when loan is disbursed', enabled: true },
                  { name: 'Overdue Notice', description: 'Sent when payment is overdue', enabled: false },
                  { name: 'KYC Status Update', description: 'Notification for KYC verification status', enabled: false },
                ].map((template) => (
                  <div key={template.name} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{template.name}</p>
                      <p className="text-sm text-slate-500">{template.description}</p>
                    </div>
                    <button
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        template.enabled ? 'bg-emerald-600' : 'bg-slate-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          template.enabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getSettingsByCategory('notifications').map(renderSetting)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and access control settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getSettingsByCategory('security').map(renderSetting)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
