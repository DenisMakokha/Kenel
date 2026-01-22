import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
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
} from 'lucide-react';
import { usePortalAuthStore } from '../../store/portalAuthStore';
import { portalService } from '../../services/portalService';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

export default function PortalProfilePage() {
  const { client, setClient } = usePortalAuthStore();
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

  const [showNokDialog, setShowNokDialog] = useState(false);
  const [showRefereeDialog, setShowRefereeDialog] = useState(false);
  const [savingContacts, setSavingContacts] = useState(false);
  const [nokForm, setNokForm] = useState({
    fullName: '',
    relation: '',
    phone: '',
    email: '',
    address: '',
    isPrimary: true,
  });
  const [refereeForm, setRefereeForm] = useState({
    fullName: '',
    phone: '',
    relation: '',
    idNumber: '',
    employerName: '',
    address: '',
  });

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
                      toast.error(
                        err.response?.data?.message
                          || 'Failed to update profile. Please try again.',
                      );
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
                    <Input
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      disabled
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Last Name</label>
                    <Input
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Email Address</label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Phone Number</label>
                  <Input
                    value={profileForm.phonePrimary}
                    onChange={(e) => setProfileForm({ ...profileForm, phonePrimary: e.target.value })}
                    disabled
                  />
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

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg">KYC Checklist</CardTitle>
            <CardDescription>Complete these items to finish your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={!!client?.residentialAddress} readOnly />
                <span className="text-sm text-slate-700">Address Provided</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={(client?.nextOfKin || []).length > 0} readOnly />
                <span className="text-sm text-slate-700">Next of Kin Added</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={(client?.referees || []).length > 0} readOnly />
                <span className="text-sm text-slate-700">Referees Added</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Next of Kin & Referees</CardTitle>
              <CardDescription>Add your next of kin and referees for KYC completion</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowNokDialog(true)}>
                Add Next of Kin
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowRefereeDialog(true)}>
                Add Referee
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Next of Kin</p>
                <Badge className="bg-slate-100 text-slate-700">{(client?.nextOfKin || []).length}</Badge>
              </div>
              {(client?.nextOfKin || []).length === 0 ? (
                <p className="text-sm text-slate-500">No next of kin added yet.</p>
              ) : (
                <div className="space-y-3">
                  {(client?.nextOfKin || []).map((nok) => (
                    <div key={nok.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{nok.fullName}</p>
                          <p className="text-xs text-slate-500">{nok.relation}</p>
                          <p className="text-xs text-slate-500 mt-1">{nok.phone}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {nok.isPrimary ? (
                            <Badge className="bg-emerald-100 text-emerald-700">Primary</Badge>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={savingContacts}
                            onClick={async () => {
                              if (!confirm('Remove this next of kin?')) return;
                              setSavingContacts(true);
                              try {
                                await portalService.removeNextOfKin(nok.id);
                                const me = await portalService.getMe();
                                setClient(me);
                                toast.success('Next of kin removed');
                              } catch {
                                toast.error('Failed to remove next of kin');
                              } finally {
                                setSavingContacts(false);
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Referees</p>
                <Badge className="bg-slate-100 text-slate-700">{(client?.referees || []).length}</Badge>
              </div>
              {(client?.referees || []).length === 0 ? (
                <p className="text-sm text-slate-500">No referees added yet.</p>
              ) : (
                <div className="space-y-3">
                  {(client?.referees || []).map((referee) => (
                    <div key={referee.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{referee.fullName}</p>
                          <p className="text-xs text-slate-500">{referee.relation || 'Referee'}</p>
                          <p className="text-xs text-slate-500 mt-1">{referee.phone}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={savingContacts}
                          onClick={async () => {
                            if (!confirm('Remove this referee?')) return;
                            setSavingContacts(true);
                            try {
                              await portalService.removeReferee(referee.id);
                              const me = await portalService.getMe();
                              setClient(me);
                              toast.success('Referee removed');
                            } catch {
                              toast.error('Failed to remove referee');
                            } finally {
                              setSavingContacts(false);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                    <Shield className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">
                      Two-factor authentication is not available yet.
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled>
                  <Smartphone className="h-4 w-4 mr-1" />
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
                  } catch (err) {
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

      <Dialog open={showNokDialog} onOpenChange={setShowNokDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Next of Kin</DialogTitle>
            <DialogDescription>Provide details for your next of kin contact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Full Name</label>
              <Input value={nokForm.fullName} onChange={(e) => setNokForm({ ...nokForm, fullName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Relation</label>
              <Input value={nokForm.relation} onChange={(e) => setNokForm({ ...nokForm, relation: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Phone</label>
              <Input value={nokForm.phone} onChange={(e) => setNokForm({ ...nokForm, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Email (optional)</label>
              <Input value={nokForm.email} onChange={(e) => setNokForm({ ...nokForm, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Address (optional)</label>
              <Input value={nokForm.address} onChange={(e) => setNokForm({ ...nokForm, address: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={nokForm.isPrimary}
                onChange={(e) => setNokForm({ ...nokForm, isPrimary: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Set as primary</span>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNokDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={savingContacts}
              onClick={async () => {
                if (!nokForm.fullName || !nokForm.relation || !nokForm.phone) {
                  toast.error('Please fill in full name, relation and phone');
                  return;
                }
                setSavingContacts(true);
                try {
                  await portalService.addNextOfKin({
                    fullName: nokForm.fullName,
                    relation: nokForm.relation,
                    phone: nokForm.phone,
                    email: nokForm.email || undefined,
                    address: nokForm.address || undefined,
                    isPrimary: nokForm.isPrimary,
                  });
                  const me = await portalService.getMe();
                  setClient(me);
                  setNokForm({
                    fullName: '',
                    relation: '',
                    phone: '',
                    email: '',
                    address: '',
                    isPrimary: true,
                  });
                  setShowNokDialog(false);
                  toast.success('Next of kin added');
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to add next of kin');
                } finally {
                  setSavingContacts(false);
                }
              }}
            >
              {savingContacts ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRefereeDialog} onOpenChange={setShowRefereeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Referee</DialogTitle>
            <DialogDescription>Provide details for a referee contact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Full Name</label>
              <Input value={refereeForm.fullName} onChange={(e) => setRefereeForm({ ...refereeForm, fullName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Phone</label>
              <Input value={refereeForm.phone} onChange={(e) => setRefereeForm({ ...refereeForm, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Relation (optional)</label>
              <Input value={refereeForm.relation} onChange={(e) => setRefereeForm({ ...refereeForm, relation: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">ID Number (optional)</label>
              <Input value={refereeForm.idNumber} onChange={(e) => setRefereeForm({ ...refereeForm, idNumber: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Employer (optional)</label>
              <Input value={refereeForm.employerName} onChange={(e) => setRefereeForm({ ...refereeForm, employerName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Address (optional)</label>
              <Input value={refereeForm.address} onChange={(e) => setRefereeForm({ ...refereeForm, address: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRefereeDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={savingContacts}
              onClick={async () => {
                if (!refereeForm.fullName || !refereeForm.phone) {
                  toast.error('Please fill in full name and phone');
                  return;
                }
                setSavingContacts(true);
                try {
                  await portalService.addReferee({
                    fullName: refereeForm.fullName,
                    phone: refereeForm.phone,
                    relation: refereeForm.relation || undefined,
                    idNumber: refereeForm.idNumber || undefined,
                    employerName: refereeForm.employerName || undefined,
                    address: refereeForm.address || undefined,
                  });
                  const me = await portalService.getMe();
                  setClient(me);
                  setRefereeForm({
                    fullName: '',
                    phone: '',
                    relation: '',
                    idNumber: '',
                    employerName: '',
                    address: '',
                  });
                  setShowRefereeDialog(false);
                  toast.success('Referee added');
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to add referee');
                } finally {
                  setSavingContacts(false);
                }
              }}
            >
              {savingContacts ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
