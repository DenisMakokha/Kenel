import type { ReactNode } from 'react';
import { AppShell } from '../shared/AppShell';
import { financeOfficerNavConfig } from '../shared/navConfigs';

interface FinanceOfficerLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for Finance Officer role.
 * Uses the shared AppShell with finance-specific navigation.
 */
export function FinanceOfficerLayout({ children }: FinanceOfficerLayoutProps) {
  return <AppShell config={financeOfficerNavConfig}>{children}</AppShell>;
}

export default FinanceOfficerLayout;
