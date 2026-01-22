import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  visible: boolean;
  order: number;
}

interface DashboardState {
  widgets: Record<string, DashboardWidget[]>;
  getWidgets: (role: string) => DashboardWidget[];
  setWidgets: (role: string, widgets: DashboardWidget[]) => void;
  toggleWidget: (role: string, widgetId: string) => void;
  reorderWidgets: (role: string, startIndex: number, endIndex: number) => void;
  resetToDefault: (role: string) => void;
}

const DEFAULT_ADMIN_WIDGETS: DashboardWidget[] = [
  { id: 'total-clients', type: 'stat', title: 'Total Clients', size: 'small', visible: true, order: 0 },
  { id: 'active-loans', type: 'stat', title: 'Active Loans', size: 'small', visible: true, order: 1 },
  { id: 'total-disbursed', type: 'stat', title: 'Total Disbursed', size: 'small', visible: true, order: 2 },
  { id: 'pending-applications', type: 'stat', title: 'Pending Applications', size: 'small', visible: true, order: 3 },
  { id: 'portfolio-chart', type: 'chart', title: 'Portfolio Overview', size: 'large', visible: true, order: 4 },
  { id: 'recent-applications', type: 'list', title: 'Recent Applications', size: 'medium', visible: true, order: 5 },
  { id: 'arrears-summary', type: 'stat', title: 'Arrears Summary', size: 'medium', visible: true, order: 6 },
  { id: 'collection-rate', type: 'stat', title: 'Collection Rate', size: 'small', visible: true, order: 7 },
  { id: 'upcoming-repayments', type: 'list', title: 'Upcoming Repayments', size: 'medium', visible: false, order: 8 },
  { id: 'kyc-pending', type: 'stat', title: 'KYC Pending', size: 'small', visible: false, order: 9 },
];

const DEFAULT_CREDIT_WIDGETS: DashboardWidget[] = [
  { id: 'my-clients', type: 'stat', title: 'My Clients', size: 'small', visible: true, order: 0 },
  { id: 'pipeline-count', type: 'stat', title: 'Pipeline Count', size: 'small', visible: true, order: 1 },
  { id: 'approved-today', type: 'stat', title: 'Approved Today', size: 'small', visible: true, order: 2 },
  { id: 'conversion-rate', type: 'stat', title: 'Conversion Rate', size: 'small', visible: true, order: 3 },
  { id: 'pipeline-chart', type: 'chart', title: 'Pipeline Status', size: 'large', visible: true, order: 4 },
  { id: 'recent-applications', type: 'list', title: 'Recent Applications', size: 'medium', visible: true, order: 5 },
  { id: 'kyc-reviews', type: 'list', title: 'KYC Reviews', size: 'medium', visible: true, order: 6 },
];

const DEFAULT_FINANCE_WIDGETS: DashboardWidget[] = [
  { id: 'collections-today', type: 'stat', title: 'Collections Today', size: 'small', visible: true, order: 0 },
  { id: 'expected-today', type: 'stat', title: 'Expected Today', size: 'small', visible: true, order: 1 },
  { id: 'arrears-total', type: 'stat', title: 'Total Arrears', size: 'small', visible: true, order: 2 },
  { id: 'collection-rate', type: 'stat', title: 'Collection Rate', size: 'small', visible: true, order: 3 },
  { id: 'collections-chart', type: 'chart', title: 'Collections Trend', size: 'large', visible: true, order: 4 },
  { id: 'recent-payments', type: 'list', title: 'Recent Payments', size: 'medium', visible: true, order: 5 },
  { id: 'overdue-loans', type: 'list', title: 'Overdue Loans', size: 'medium', visible: true, order: 6 },
];

const getDefaultWidgets = (role: string): DashboardWidget[] => {
  switch (role) {
    case 'CREDIT_OFFICER':
      return DEFAULT_CREDIT_WIDGETS;
    case 'FINANCE_OFFICER':
      return DEFAULT_FINANCE_WIDGETS;
    case 'ADMIN':
    default:
      return DEFAULT_ADMIN_WIDGETS;
  }
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: {},

      getWidgets: (role: string) => {
        const state = get();
        if (!state.widgets[role]) {
          return getDefaultWidgets(role);
        }
        return state.widgets[role].sort((a, b) => a.order - b.order);
      },

      setWidgets: (role: string, widgets: DashboardWidget[]) => {
        set((state) => ({
          widgets: {
            ...state.widgets,
            [role]: widgets,
          },
        }));
      },

      toggleWidget: (role: string, widgetId: string) => {
        set((state) => {
          const currentWidgets = state.widgets[role] || getDefaultWidgets(role);
          const updatedWidgets = currentWidgets.map((w) =>
            w.id === widgetId ? { ...w, visible: !w.visible } : w
          );
          return {
            widgets: {
              ...state.widgets,
              [role]: updatedWidgets,
            },
          };
        });
      },

      reorderWidgets: (role: string, startIndex: number, endIndex: number) => {
        set((state) => {
          const currentWidgets = [...(state.widgets[role] || getDefaultWidgets(role))];
          const [removed] = currentWidgets.splice(startIndex, 1);
          currentWidgets.splice(endIndex, 0, removed);
          const reorderedWidgets = currentWidgets.map((w, i) => ({ ...w, order: i }));
          return {
            widgets: {
              ...state.widgets,
              [role]: reorderedWidgets,
            },
          };
        });
      },

      resetToDefault: (role: string) => {
        set((state) => ({
          widgets: {
            ...state.widgets,
            [role]: getDefaultWidgets(role),
          },
        }));
      },
    }),
    {
      name: 'dashboard-widgets',
    }
  )
);
