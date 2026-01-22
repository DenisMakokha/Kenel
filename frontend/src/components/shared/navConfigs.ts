import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Settings,
  LifeBuoy,
  FileSpreadsheet,
  FilePieChart,
  Wallet,
  Receipt,
  Download,
  CreditCard,
  PieChart,
  FolderKanban,
  UserCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import type { AppShellConfig } from './AppShell';

/**
 * Admin navigation configuration
 * Full system access: clients, loans, products, reports, system settings
 */
export const adminNavConfig: AppShellConfig = {
  title: 'Kenels LMS',
  subtitle: 'Admin Console',
  dashboardPath: '/admin/dashboard',
  navSections: [
    {
      label: 'Overview',
      items: [
        {
          label: 'Dashboard',
          to: '/admin/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: 'Clients',
      items: [
        {
          label: 'All Clients',
          to: '/clients',
          icon: Users,
        },
        {
          label: 'KYC Reviews',
          to: '/kyc-reviews',
          icon: ClipboardList,
        },
        {
          label: 'Documents',
          to: '/documents',
          icon: FileText,
        },
      ],
    },
    {
      label: 'Loans',
      items: [
        {
          label: 'Applications',
          to: '/loan-applications',
          icon: ClipboardList,
        },
        {
          label: 'Active Loans',
          to: '/loans',
          icon: FileText,
        },
        {
          label: 'Repayments',
          to: '/repayments',
          icon: FileSpreadsheet,
        },
        {
          label: 'Arrears',
          to: '/reports/aging',
          icon: TrendingUp,
        },
        {
          label: 'Write-offs',
          to: '/write-offs',
          icon: FileText,
        },
      ],
    },
    {
      label: 'Products & Config',
      items: [
        {
          label: 'Loan Products',
          to: '/loan-products',
          icon: BarChart3,
        },
        {
          label: 'Interest Rates',
          to: '/interest-rates',
          icon: FilePieChart,
        },
        {
          label: 'Fee Templates',
          to: '/fee-templates',
          icon: Settings,
        },
      ],
    },
    {
      label: 'Reporting',
      items: [
        {
          label: 'Portfolio Dashboard',
          to: '/reports/portfolio',
          icon: BarChart3,
        },
        {
          label: 'Aging Analysis',
          to: '/reports/aging',
          icon: TrendingUp,
        },
        {
          label: 'Export Center',
          icon: FileText,
          disabled: true,
          isFuture: true,
        },
      ],
    },
    {
      label: 'System',
      items: [
        {
          label: 'Users & Roles',
          to: '/users',
          icon: Users,
        },
        {
          label: 'Audit Logs',
          to: '/audit-logs',
          icon: FileText,
        },
        {
          label: 'System Status',
          to: '/system-status',
          icon: ShieldCheck,
        },
        {
          label: 'Settings',
          to: '/settings',
          icon: Settings,
        },
      ],
    },
    {
      label: 'Support',
      items: [
        {
          label: 'Help Center',
          icon: LifeBuoy,
          disabled: true,
          isFuture: true,
        },
      ],
    },
  ],
};

/**
 * Credit Officer navigation configuration
 * Focus: Application pipeline, KYC, client management, portfolio monitoring
 * No access to: System settings, user management, product config
 */
export const creditOfficerNavConfig: AppShellConfig = {
  title: 'Kenels LMS',
  subtitle: 'Credit',
  dashboardPath: '/credit/dashboard',
  navSections: [
    {
      label: 'Overview',
      items: [
        {
          label: 'Dashboard',
          to: '/credit/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: 'Applications',
      items: [
        {
          label: 'My Pipeline',
          to: '/credit/pipeline',
          icon: FolderKanban,
        },
        {
          label: 'All Applications',
          to: '/loan-applications',
          icon: ClipboardList,
        },
      ],
    },
    {
      label: 'Clients',
      items: [
        {
          label: 'My Clients',
          to: '/credit/clients',
          icon: Users,
        },
        {
          label: 'KYC Reviews',
          to: '/kyc-reviews',
          icon: UserCheck,
        },
      ],
    },
    {
      label: 'Loans',
      items: [
        {
          label: 'Active Loans',
          to: '/loans',
          icon: FileText,
        },
      ],
    },
    {
      label: 'Reports',
      items: [
        {
          label: 'My Portfolio',
          to: '/credit/portfolio',
          icon: PieChart,
        },
        {
          label: 'Conversion Funnel',
          to: '/credit/conversion-funnel',
          icon: TrendingUp,
          isFuture: true,
        },
      ],
    },
    {
      label: 'Support',
      items: [
        {
          label: 'Help Center',
          to: '/help',
          icon: LifeBuoy,
          isFuture: true,
        },
      ],
    },
  ],
};

/**
 * Finance Officer navigation configuration
 * Focus: Repayments, collections, arrears, receipts, financial reporting
 * No access to: Loan product config, user management
 */
export const financeOfficerNavConfig: AppShellConfig = {
  title: 'Kenels LMS',
  subtitle: 'Finance',
  dashboardPath: '/finance/dashboard',
  navSections: [
    {
      label: 'Overview',
      items: [
        {
          label: 'Dashboard',
          to: '/finance/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: 'Loans',
      items: [
        {
          label: 'Active Loans',
          to: '/loans',
          icon: FileText,
        },
        {
          label: 'Pending Disbursements',
          to: '/finance/pending-disbursements',
          icon: CreditCard,
        },
        {
          label: 'Arrears',
          to: '/finance/arrears',
          icon: AlertTriangle,
        },
        {
          label: 'Closed Loans',
          to: '/finance/closed-loans',
          icon: FileText,
        },
      ],
    },
    {
      label: 'Repayments',
      items: [
        {
          label: 'Post Repayment',
          to: '/finance/post-repayment',
          icon: Wallet,
        },
        {
          label: "Today's Postings",
          to: '/finance/postings',
          icon: Clock,
        },
        {
          label: 'Reversals',
          to: '/finance/reversals',
          icon: FileSpreadsheet,
          isFuture: true,
        },
      ],
    },
    {
      label: 'Receipts & Statements',
      items: [
        {
          label: 'Receipt Lookup',
          to: '/finance/receipts',
          icon: Receipt,
        },
        {
          label: 'Statements',
          to: '/finance/statements',
          icon: FileText,
          isFuture: true,
        },
      ],
    },
    {
      label: 'Reports',
      items: [
        {
          label: 'Collections Summary',
          to: '/finance/collections',
          icon: BarChart3,
        },
        {
          label: 'Cashflow',
          to: '/finance/cashflow',
          icon: CreditCard,
          isFuture: true,
        },
        {
          label: 'Allocation Breakdown',
          to: '/finance/allocation',
          icon: PieChart,
          isFuture: true,
        },
      ],
    },
    {
      label: 'System',
      items: [
        {
          label: 'Export to Accounting',
          to: '/finance/export',
          icon: Download,
          isFuture: true,
        },
        {
          label: 'Payment Channels',
          to: '/finance/payment-channels',
          icon: CreditCard,
          isFuture: true,
        },
      ],
    },
    {
      label: 'Support',
      items: [
        {
          label: 'Help Center',
          to: '/help',
          icon: LifeBuoy,
          isFuture: true,
        },
      ],
    },
  ],
};

/**
 * Get navigation config based on user role
 */
export function getNavConfigForRole(role: string): AppShellConfig {
  switch (role) {
    case 'CREDIT_OFFICER':
      return creditOfficerNavConfig;
    case 'FINANCE_OFFICER':
      return financeOfficerNavConfig;
    case 'ADMIN':
    default:
      return adminNavConfig;
  }
}
