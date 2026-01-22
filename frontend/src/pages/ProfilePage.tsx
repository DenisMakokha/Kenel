import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Camera,
  Save,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  LogOut,
  Trash2,
  MapPin,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn, formatDateTime } from '../lib/utils';
import api from '../lib/api';
import { useToast } from '../components/ui/use-toast';

interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  ip: string;
  timestamp: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState('');

  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Activity log state
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (activeTab === 'security') {
      loadSessions();
      loadActivityLog();
    }
  }, [activeTab]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', 'Please select an image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Please select an image smaller than 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update user in store with new photo URL
      if (response.data?.photoUrl) {
        setProfilePhoto(response.data.photoUrl);
        setUser({ ...user!, profilePhoto: response.data.photoUrl });
      }

      toast.success('Photo updated', 'Your profile photo has been updated successfully.');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to upload profile photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await api.delete('/users/me/photo');
      setProfilePhoto(null);
      setUser({ ...user!, profilePhoto: undefined });
      toast.success('Photo removed', 'Your profile photo has been removed.');
    } catch (error) {
      // Remove locally anyway
      setProfilePhoto(null);
      toast.success('Photo removed', 'Your profile photo has been removed.');
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await api.get('/auth/sessions');
      setSessions(response.data.sessions || []);
    } catch (error) {
      setSessions([]);
      toast({
        title: 'Error',
        description: 'Failed to load active sessions.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadActivityLog = async () => {
    try {
      const response = await api.get('/auth/activity');
      setActivityLog(response.data.activities || []);
    } catch (error) {
      setActivityLog([]);
      toast({
        title: 'Error',
        description: 'Failed to load activity log.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', {
        firstName,
        lastName,
        phone,
      });
      setUser({ ...user!, firstName, lastName });
      setSaved(true);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully.',
      });
      setPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to change password.',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      toast({
        title: 'Session revoked',
        description: 'The session has been logged out.',
      });
    } catch (error) {
      toast({
        title: 'Not available',
        description:
          (error as any)?.response?.data?.message ||
          'Session revocation is not available yet.',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('This will log you out from all other devices. Continue?')) return;
    try {
      await api.delete('/auth/sessions');
      toast({
        title: 'Sessions revoked',
        description: 'All other sessions have been logged out.',
      });
    } catch (error) {
      toast({
        title: 'Not available',
        description:
          (error as any)?.response?.data?.message ||
          'Revoking sessions is not available yet.',
        variant: 'destructive',
      });
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('android')) {
      return Smartphone;
    }
    return Monitor;
  };

  const passwordStrength = (password: string): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: '', color: '', width: '0%' };
    if (password.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (password.length < 8) return { label: 'Fair', color: 'bg-amber-500', width: '50%' };
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { label: 'Good', color: 'bg-emerald-500', width: '75%' };
    }
    return { label: 'Strong', color: 'bg-emerald-600', width: '100%' };
  };

  const strength = passwordStrength(newPassword);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Profile</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage your account settings and security
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative group">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              
              {/* Profile photo or initials */}
              <div 
                onClick={handlePhotoClick}
                className="h-24 w-24 rounded-full overflow-hidden cursor-pointer ring-4 ring-white dark:ring-slate-800 shadow-lg"
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingPhoto ? (
                    <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              
              {/* Camera button */}
              <button 
                onClick={handlePhotoClick}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
              >
                <Camera className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {user?.role?.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="text-slate-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              {/* Photo actions */}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePhotoClick}
                  disabled={uploadingPhoto}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {profilePhoto && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setSaved(false); }}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setSaved(false); }}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="pl-9 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Contact an administrator to change your email address
                </p>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setSaved(false); }}
                    placeholder="+254 700 000 000"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                {saved && (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Saved
                  </Badge>
                )}
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Password Section */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password
              </CardTitle>
              <CardDescription>
                Change your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Last changed: <span className="font-medium">30 days ago</span>
                  </p>
                </div>
                <Button onClick={() => setPasswordModal(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Authenticator App</p>
                      <p className="text-sm text-slate-500">Use Google Authenticator or similar</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => toast.info('2FA Setup', 'Authenticator app setup will be available soon.')}>
                    Set up
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Email Verification</p>
                      <p className="text-sm text-slate-500">Receive codes via email</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">SMS Verification</p>
                      <p className="text-sm text-slate-500">Receive codes via SMS</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => toast.info('2FA Setup', 'SMS verification setup will be available soon.')}>
                    Set up
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription>
                    Manage your active sessions across devices
                  </CardDescription>
                </div>
                {sessions.filter((s) => !s.isCurrent).length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out all others
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => {
                    const DeviceIcon = getDeviceIcon(session.device);
                    return (
                      <div
                        key={session.id}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-lg border',
                          session.isCurrent
                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                            : 'border-slate-200 dark:border-slate-700'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'h-10 w-10 rounded-lg flex items-center justify-center',
                            session.isCurrent ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-slate-100 dark:bg-slate-700'
                          )}>
                            <DeviceIcon className={cn(
                              'h-5 w-5',
                              session.isCurrent ? 'text-emerald-600' : 'text-slate-500'
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {session.device}
                              </p>
                              {session.isCurrent && (
                                <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{session.browser}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {session.ip}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {session.isCurrent ? 'Active now' : formatDateTime(session.lastActive)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeSession(session.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your recent account activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityLog.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-500">
                        IP: {activity.ip}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Change Modal */}
      <Dialog open={passwordModal} onOpenChange={setPasswordModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative mt-2">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative mt-2">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Password strength</span>
                    <span className={cn(
                      strength.label === 'Weak' && 'text-red-500',
                      strength.label === 'Fair' && 'text-amber-500',
                      strength.label === 'Good' && 'text-emerald-500',
                      strength.label === 'Strong' && 'text-emerald-600'
                    )}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full transition-all', strength.color)}
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-2"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Password requirements:
              </p>
              <ul className="text-xs text-slate-500 mt-1 space-y-1">
                <li className={cn(newPassword.length >= 8 && 'text-emerald-600')}>
                  • At least 8 characters
                </li>
                <li className={cn(/[A-Z]/.test(newPassword) && 'text-emerald-600')}>
                  • At least one uppercase letter
                </li>
                <li className={cn(/[0-9]/.test(newPassword) && 'text-emerald-600')}>
                  • At least one number
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || changingPassword}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
