import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { portalService } from '../../services/portalService';
import { usePortalAuthStore } from '../../store/portalAuthStore';
import { Home, Eye, EyeOff, Smartphone, CreditCard, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import { COMPANY_CONFIG, getCurrentYear } from '../../config/company';
import Logo from '../../components/Logo';

export default function PortalLoginPage() {
  const navigate = useNavigate();
  const { setClient } = usePortalAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const result = await portalService.login(email, password);
      localStorage.setItem('portalAccessToken', result.accessToken);
      if (result.client) {
        setClient(result.client);
      }
      navigate('/portal/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-300 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Logo variant="light" size="lg" />
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Manage Your Loans<br />Anytime, Anywhere
              </h1>
              <p className="text-lg text-emerald-100 max-w-md">
                Check your loan balance, view repayment schedules, download statements, 
                and apply for new loans - all from your phone or computer.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: CreditCard, title: 'View Balances', desc: 'Check loan status' },
                { icon: FileText, title: 'Statements', desc: 'Download anytime' },
                { icon: Smartphone, title: 'Apply Online', desc: 'Quick applications' },
                { icon: ArrowRight, title: 'Track Payments', desc: 'Payment history' },
              ].map((feature, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <feature.icon className="h-6 w-6 text-emerald-200 mb-2" />
                  <p className="text-white font-medium text-sm">{feature.title}</p>
                  <p className="text-emerald-200 text-xs">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer - Nelium Systems */}
          <div className="pt-8 border-t border-white/20">
            <p className="text-xs text-emerald-200 mb-2">Powered by</p>
            <a 
              href="https://neliumsystems.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white hover:text-emerald-200 transition-colors group"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                N
              </div>
              <div>
                <span className="font-semibold">Nelium Systems</span>
                <p className="text-xs text-emerald-200 group-hover:text-white">Enterprise Software Solutions</p>
              </div>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Logo variant="dark" size="lg" />
          </div>

          {/* Back to Home */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to access your loan account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full h-12 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link to="/portal/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-12 px-4 pr-12 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-2">Don't have an account?</p>
            <Link 
              to="/portal/register"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
            >
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-8 p-4 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-2">Need help? Contact us</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a href={`mailto:${COMPANY_CONFIG.email}`} className="text-emerald-600 hover:text-emerald-700">
                {COMPANY_CONFIG.email}
              </a>
              <span className="text-slate-300">|</span>
              <a href={`tel:${COMPANY_CONFIG.phoneRaw}`} className="text-emerald-600 hover:text-emerald-700">
                {COMPANY_CONFIG.phone}
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>© {getCurrentYear()} {COMPANY_CONFIG.name}</span>
              <a 
                href="https://neliumsystems.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-slate-600 transition-colors"
              >
                Built by <span className="font-medium text-slate-500">Nelium Systems</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
