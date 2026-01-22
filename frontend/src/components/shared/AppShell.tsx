import type { ReactNode, ElementType } from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Settings, User, ChevronDown } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useAuthStore } from '../../store/authStore';
import Logo from '../Logo';
import { authService } from '../../services/authService';
import { cn } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ThemeToggle } from '../ui/theme-toggle';
import { NotificationBell } from '../ui/notification-bell';

export interface NavItem {
  label: string;
  to?: string;
  icon: ElementType<{ className?: string }>;
  disabled?: boolean;
  isFuture?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface AppShellConfig {
  /** Title shown in sidebar header */
  title: string;
  /** Subtitle shown below title (e.g., "Admin Console", "Credit", "Finance") */
  subtitle: string;
  /** Navigation sections to display */
  navSections: NavSection[];
  /** Base path for dashboard (used for active item detection fallback) */
  dashboardPath: string;
}

interface AppShellProps {
  children: ReactNode;
  config: AppShellConfig;
}

function getActiveItemLabel(pathname: string, navSections: NavSection[]): string {
  for (const section of navSections) {
    for (const item of section.items) {
      if (!item.to) continue;
      const basePath = item.to.split('?')[0];
      if (pathname === basePath || (basePath !== '/' && pathname.startsWith(basePath + '/'))) {
        return item.label;
      }
    }
  }
  return 'Dashboard';
}

export function AppShell({ children, config }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeLabel = getActiveItemLabel(location.pathname, config.navSections);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout errors for now
    } finally {
      logout();
      navigate('/login');
    }
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;

    if (!item.to || item.disabled) {
      return (
        <div
          key={item.label}
          className={cn(
            'flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-400 dark:text-slate-500',
            item.disabled && 'cursor-default',
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </div>
          {item.isFuture && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-dashed">
              Soon
            </Badge>
          )}
        </div>
      );
    }

    const basePath = item.to.split('?')[0];
    const isActive =
      location.pathname === basePath || (basePath !== '/' && location.pathname.startsWith(basePath + '/'));

    return (
      <button
        key={item.label}
        type="button"
        onClick={() => {
          navigate(item.to!);
          setSidebarOpen(false);
        }}
        className={cn(
          'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-l-4 border-emerald-600 pl-2'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
        )}
      >
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              'h-4 w-4',
              isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400',
            )}
          />
          <span>{item.label}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-60 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-6 shadow-sm transition-transform overflow-y-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <Logo variant="dark" size="sm" />
          </div>
          <button
            type="button"
            className="md:hidden rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
        <nav className="space-y-5 text-sm">
          {config.navSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {section.label}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => renderNavItem(item))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col md:ml-60">
        <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <div className="flex h-14 items-center justify-between px-3 md:px-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="mr-1 rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden"
                onClick={() => setSidebarOpen((open) => !open)}
              >
                <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{activeLabel}</div>
            </div>
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications Bell */}
              <NotificationBell />

              {/* User Avatar & Dropdown */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {user.role.replace('_', ' ')}
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.firstName} {user.lastName}</span>
                        <span className="text-xs font-normal text-slate-500">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-6 md:px-4 md:py-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
