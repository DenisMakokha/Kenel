import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortalClient } from '../types/portal';

interface PortalAuthState {
  client: PortalClient | null;
  isAuthenticated: boolean;
  setClient: (client: PortalClient | null) => void;
  logout: () => void;
}

export const usePortalAuthStore = create<PortalAuthState>()(
  persist(
    (set) => ({
      client: null,
      isAuthenticated: false,
      setClient: (client) =>
        set({
          client,
          isAuthenticated: !!client,
        }),
      logout: () => {
        localStorage.removeItem('portalAccessToken');
        localStorage.removeItem('lastActivityTimestamp');
        set({ client: null, isAuthenticated: false });
      },
    }),
    {
      name: 'portal-auth-storage',
    },
  ),
);
