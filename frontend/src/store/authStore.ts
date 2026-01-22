import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          hasHydrated: true, // Mark as hydrated when user is set (e.g., after login)
        }),
      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, isAuthenticated: false });
      },
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
