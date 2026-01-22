import type { ReactNode } from 'react';
import { AppShell } from '../shared/AppShell';
import { adminNavConfig } from '../shared/navConfigs';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for Admin role.
 * Uses the shared AppShell with admin-specific navigation.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  return <AppShell config={adminNavConfig}>{children}</AppShell>;
}

export default AdminLayout;
