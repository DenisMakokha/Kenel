import type { ReactNode } from 'react';
import { AppShell } from '../shared/AppShell';
import { creditOfficerNavConfig } from '../shared/navConfigs';

interface CreditOfficerLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for Credit Officer role.
 * Uses the shared AppShell with credit-specific navigation.
 */
export function CreditOfficerLayout({ children }: CreditOfficerLayoutProps) {
  return <AppShell config={creditOfficerNavConfig}>{children}</AppShell>;
}

export default CreditOfficerLayout;
