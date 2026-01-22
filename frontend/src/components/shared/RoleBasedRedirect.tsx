import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';

/**
 * Redirects authenticated users to their role-specific dashboard.
 * - Admin -> /dashboard
 * - Credit Officer -> /credit/dashboard
 * - Finance Officer -> /finance/dashboard
 * - Client -> /portal/dashboard
 */
export function RoleBasedRedirect() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  // Wait for zustand to hydrate from localStorage before checking auth
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case UserRole.CREDIT_OFFICER:
      return <Navigate to="/credit/dashboard" replace />;
    case UserRole.FINANCE_OFFICER:
      return <Navigate to="/finance/dashboard" replace />;
    case UserRole.CLIENT:
      return <Navigate to="/portal/dashboard" replace />;
    case UserRole.ADMIN:
    default:
      return <Navigate to="/admin/dashboard" replace />;
  }
}

export default RoleBasedRedirect;
