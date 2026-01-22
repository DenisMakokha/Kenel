import type { ReactNode } from 'react';
import { AppShell } from './AppShell';
import { getNavConfigForRole } from './navConfigs';
import { useAuthStore } from '../../store/authStore';

interface RoleBasedLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper that automatically selects the appropriate navigation
 * configuration based on the current user's role.
 * 
 * This provides a DRY approach where shared pages (like /loans, /clients)
 * can use this wrapper and get the correct sidebar for their role.
 */
export function RoleBasedLayout({ children }: RoleBasedLayoutProps) {
  const { user } = useAuthStore();
  const config = getNavConfigForRole(user?.role || 'ADMIN');
  
  return <AppShell config={config}>{children}</AppShell>;
}

export default RoleBasedLayout;
