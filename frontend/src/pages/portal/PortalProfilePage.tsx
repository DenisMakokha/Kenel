import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  AlertTriangle,
  Edit2,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { usePortalAuthStore } from '../../store/portalAuthStore';
import { portalService } from '../../services/portalService';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function PortalProfilePage() {
  const { client, setClient } = usePortalAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileForm, setProfileForm] = useState({
    firstName: client?.firstName || '',
    lastName: client?.lastName || '',
    email: client?.email || '',
    phonePrimary: client?.phonePrimary || '',
    residentialAddress: client?.residentialAddress || '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    paymentReminders: true,
    emailNotifications: true,
    smsNotifications: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      if (!client) return;
      try {
        const me = await portalService.getMe();
        setClient(me);
        setProfileForm({
          firstName: me.firstName || '',
          lastName: me.lastName || '',
          email: me.email || '',
          phonePrimary: me.phonePrimary || '',
          residentialAddress: me.residentialAddress || '',
        });
      } catch {
        // ignore
      }
    };
    hydrate();
  }, [client?.id, setClient]);

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'PENDING_REVIEW':
        return (
          <Badge className="bg-amber-100 text-amber-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700">
            {status}
          </Badge>
        );
    }
  };

  // Calculate KYC completion
  const getKycProgress = () => {
    const c = client as any;
    const docs = c?.documents || [];
    const hasDoc = (type: string) => docs.some((d: any) => d.documentType === type);

    const items = [
      !!(c?.firstName && c?.lastName && (c?.idNumber || c?.nationalId) && c?.dateOfBirth),
      !!c?.residentialAddress,
      !!(c?.employerName || c?.employer),
      (c?.nextOfKin || []).length > 0,
      (c?.referees || []).length >= 2,
      hasDoc('NATIONAL_ID') || hasDoc('PASSPORT'),
      hasDoc('KRA_PIN'),
      hasDoc('BANK_STATEMENT'),
      hasDoc('EMPLOYMENT_CONTRACT') || hasDoc('EMPLOYMENT_LETTER') || hasDoc('CONTRACT'),
      hasDoc('PROOF_OF_RESIDENCE'),
    ];

    const completed = items.filter(Boolean).length;
    return { completed, total: items.length, percentage: Math.round((completed / items.length) * 100) };
  };

  const kycProgress = getKycProgress();

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">Manage your account information and settings</p>
      </div>

      {/* Profile Card */}
      <Card className="border-slate-200 bg-white overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-500 to-emerald-600" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="h-24 w-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-3xl font-bold text-emerald-600">
                {client?.firstName?.[0]}{client?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 pb-2">
              <h2 className="text-xl font-bold text-slate-900">
                {client?.firstName} {client?.lastName}
              </h2>
              <p className="text-sm text-slate-500">{client?.clientCode}</p>
            </div>
            <div className="pb-2">{getKycStatusBadge(client?.kycStatus || 'UNVERIFIED')}</div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Progress Card */}
      {kycProgress.percentage < 100 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900">Complete Your KYC</p>
                  <p className="text-sm text-amber-700">{kycProgress.completed}/{kycProgress.total} items completed ({kycProgress.percentage}%)</p>
                </div>
              </div>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => navigate('/portal/kyc')}
              >
                Complete KYC
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="mt-3 h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${kycProgress.percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>Your basic profile details</CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await portalService.updateProfile(profileForm);
                      const me = await portalService.getMe();
                      setClient(me);
                      setIsEditing(false);
                      toast.success('Profile updated');
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Failed to update profile');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">First Name</label>
                    <Input value={profileForm.firstName} disabled />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Last Name</label>
                    <Input value={profileForm.lastName} disabled />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Email Address</label>
                  <Input type="email" value={profileForm.email} disabled />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Phone Number</label>
                  <Input value={profileForm.phonePrimary} disabled />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Address</label>
                  <Input
                    value={profileForm.residentialAddress}
                    onChange={(e) => setProfileForm({ ...profileForm, residentialAddress: e.target.value })}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Name, email and phone are locked. Contact support to change them.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Full Name</p>
                    <p className="text-sm font-medium text-slate-900">
                      {client?.firstName} {client?.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Email Address</p>
                    <p className="text-sm font-medium text-slate-900">
                      {client?.email || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Phone Number</p>
                    <p className="text-sm font-medium text-slate-900">
                      {client?.phonePrimary || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="text-sm font-medium text-slate-900">
                      {client?.residentialAddress || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Member Since</p>
                    <p className="text-sm font-medium text-slate-900">
                      {(client as any)?.createdAt ? formatDate((client as any).createdAt) : 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Security Settings</CardTitle>
            <CardDescription>Manage your password and security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Change Password</p>
                  <p className="text-xs text-slate-500">Update your account password</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 mb-1 block">New Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Confirm New Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>

                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={changingPassword}
                  onClick={async () => {
                    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                      toast.error('Passwords do not match');
                      return;
                    }
                    if (passwordForm.newPassword.length < 8) {
                      toast.error('Password must be at least 8 characters');
                      return;
                    }
                    if (!passwordForm.currentPassword) {
                      toast.error('Please enter your current password');
                      return;
                    }
                    setChangingPassword(true);
                    try {
                      await portalService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
                      toast.success('Password updated successfully');
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Failed to update password');
                    } finally {
                      setChangingPassword(false);
                    }
                  }}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-slate-100">
                    <Smartphone className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">Coming soon</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Enable
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-slate-200 bg-white md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
            <CardDescription>Choose how you want to receive updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Payment Reminders</p>
                    <p className="text-xs text-slate-500">Get notified before due dates</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationPrefs.paymentReminders}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, paymentReminders: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                    <p className="text-xs text-slate-500">Receive updates via email</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationPrefs.emailNotifications}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailNotifications: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">SMS Notifications</p>
                    <p className="text-xs text-slate-500">Receive updates via SMS</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationPrefs.smsNotifications}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, smsNotifications: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={savingPrefs}
                onClick={async () => {
                  setSavingPrefs(true);
                  try {
                    await portalService.updateNotificationPreferences(notificationPrefs);
                    toast.success('Preferences saved successfully');
                  } catch {
                    toast.error('Failed to save preferences');
                  } finally {
                    setSavingPrefs(false);
                  }
                }}
              >
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
