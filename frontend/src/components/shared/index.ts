// Shared layout components
export { AppShell } from './AppShell';
export type { NavItem, NavSection, AppShellConfig } from './AppShell';

// Navigation configurations
export {
  adminNavConfig,
  creditOfficerNavConfig,
  financeOfficerNavConfig,
  getNavConfigForRole,
} from './navConfigs';

// Role-based components
export { RoleBasedLayout } from './RoleBasedLayout';
export { RoleBasedRedirect } from './RoleBasedRedirect';
