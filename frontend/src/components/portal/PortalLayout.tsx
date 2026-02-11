import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { usePortalAuthStore } from '../../store/portalAuthStore';
import { Button } from '../ui/button';
import WhatsAppButton from '../WhatsAppButton';
import { portalService } from '../../services/portalService';
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Logo from '../Logo';
import { NotificationDropdown } from './NotificationDropdown';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

const navItems = [
  { path: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/portal/loans', label: 'My Loans', icon: CreditCard },
  { path: '/portal/statements', label: 'Statements', icon: FileText },
  { path: '/portal/kyc', label: 'KYC & Documents', icon: Shield },
  { path: '/portal/profile', label: 'My Profile', icon: User },
];

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, isAuthenticated, logout } = usePortalAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/portal/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await portalService.logout();
    } catch {
      // ignore logout errors for now
    }
    logout();
    navigate('/portal/login');
  }, [logout, navigate]);

  // Auto-logout after 15 minutes of inactivity for portal clients
  useInactivityLogout({ timeoutMinutes: 15, onLogout: handleLogout, enabled: isAuthenticated });

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-slate-600" />
              ) : (
                <Menu className="h-5 w-5 text-slate-600" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/portal/dashboard')}>
              <Logo variant="dark" size="md" />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationDropdown />

            {/* User info */}
            {client && (
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-900">
                    {client.firstName} {client.lastName}
                  </div>
                  <div className="text-xs text-slate-500">{client.clientCode}</div>
                </div>
                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-emerald-700">
                    {client.firstName?.[0]}{client.lastName?.[0]}
                  </span>
                </div>
              </div>
            )}

            {/* Logout button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r bg-white">
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className={cn('h-5 w-5', active ? 'text-emerald-600' : 'text-slate-400')} />
                  {item.label}
                  {active && <ChevronRight className="h-4 w-4 ml-auto text-emerald-400" />}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600 font-medium">Need assistance?</p>
              <p className="text-xs text-slate-500 mt-1">Contact our support team</p>
              <Button variant="link" className="p-0 h-auto text-xs text-emerald-600 mt-2">
                Get Help →
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            'fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-200 ease-in-out md:hidden',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo variant="dark" size="sm" />
            </div>
            <button
              className="p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Mobile user info */}
          {client && (
            <div className="p-4 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-emerald-700">
                    {client.firstName?.[0]}{client.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {client.firstName} {client.lastName}
                  </div>
                  <div className="text-xs text-slate-500">{client.clientCode}</div>
                </div>
              </div>
            </div>
          )}

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className={cn('h-5 w-5', active ? 'text-emerald-600' : 'text-slate-400')} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1',
                  active ? 'text-emerald-600' : 'text-slate-400'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* WhatsApp Chat Button */}
      <WhatsAppButton />
    </div>
  );
}
