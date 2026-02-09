import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft, Mail, CheckCircle, Loader2, Phone } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Logo from '../../components/Logo';
import portalApi from '../../lib/portalApi';

type Step = 'method' | 'verify' | 'reset' | 'success';
type ResetMethod = 'email' | 'phone';

export default function PortalForgotPasswordPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<ResetMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (method === 'email' && !email) {
      toast.error('Email required', 'Please enter your email address');
      return;
    }
    
    if (method === 'phone' && !phone) {
      toast.error('Phone required', 'Please enter your phone number');
      return;
    }

    if (method === 'phone') {
      toast.error('Not available', 'SMS reset is not available yet. Please use email.');
      return;
    }

    setLoading(true);
    try {
      await portalApi.post('/portal/auth/forgot-password', { email });
      toast.success('Code sent', 'Check your email for the verification code.');
      setStep('verify');
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Invalid OTP', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      await portalApi.post('/portal/auth/verify-otp', { email, otp });
      toast.success('Verified', 'Code verified successfully.');
      setStep('reset');
    } catch (error: any) {
      toast.error('Invalid code', error.response?.data?.message || 'The verification code is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Password required', 'Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match', 'Please make sure both passwords are the same');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password too short', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await portalApi.post('/portal/auth/reset-password', { email, otp, newPassword });
      toast.success('Success', 'Your password has been reset successfully.');
      setStep('success');
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Logo variant="dark" size="xl" />
          </div>
        </div>

        {/* Method Selection Step */}
        {step === 'method' && (
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Reset Password</CardTitle>
              <CardDescription>
                Choose how you'd like to receive your verification code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOTP} className="space-y-4">
                {/* Method Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      method === 'email'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Mail className={`h-6 w-6 mx-auto mb-2 ${method === 'email' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <p className={`text-sm font-medium ${method === 'email' ? 'text-emerald-700' : 'text-slate-600'}`}>
                      Email
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('phone')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      method === 'phone'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Phone className={`h-6 w-6 mx-auto mb-2 ${method === 'phone' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <p className={`text-sm font-medium ${method === 'phone' ? 'text-emerald-700' : 'text-slate-600'}`}>
                      SMS
                    </p>
                  </button>
                </div>

                {/* Input Field */}
                {method === 'email' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="tel"
                        placeholder="0712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    to="/portal/login"
                    className="text-sm text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* OTP Verification Step */}
        {step === 'verify' && (
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Enter Verification Code</CardTitle>
              <CardDescription>
                We sent a 6-digit code to {method === 'email' ? email : phone}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Verification Code</label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <div className="text-center text-sm text-slate-500">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={() => setStep('method')}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    Resend
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Reset Password Step */}
        {step === 'reset' && (
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Create New Password</CardTitle>
              <CardDescription>
                Enter your new password below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>Password must:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Be at least 8 characters long</li>
                    <li>Include at least one uppercase letter</li>
                    <li>Include at least one number</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <Card className="border-emerald-200 bg-emerald-50 shadow-lg">
            <CardContent className="py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-emerald-900 mb-2">Password Reset!</h2>
              <p className="text-emerald-700 mb-6">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <Link to="/portal/login">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
