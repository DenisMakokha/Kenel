import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Logo from '../components/Logo';

type Step = 'email' | 'sent' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email required', 'Please enter your email address');
      return;
    }

    toast.error(
      'Not available',
      'Password reset is not available yet. Please contact support to reset your account.'
    );
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

    toast.error(
      'Not available',
      'Password reset is not available yet. Please contact support to reset your account.'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Logo variant="dark" size="xl" />
          </div>
        </div>

        {/* Email Step */}
        {step === 'email' && (
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Forgot Password?</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendResetLink} className="space-y-4">
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
                    'Send Reset Link'
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
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

        {/* Email Sent Step */}
        {step === 'sent' && (
          <Card className="border-slate-200 shadow-lg">
            <CardContent className="py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Check Your Email</h2>
              <p className="text-slate-500 mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Didn't receive the email? Check your spam folder or
              </p>
              <Button
                variant="outline"
                onClick={() => setStep('email')}
                className="mb-4"
              >
                Try a different email
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reset Password Step */}
        {step === 'reset' && (
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Reset Password</CardTitle>
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
              <Link to="/login">
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
