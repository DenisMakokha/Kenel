import { create } from 'zustand';
import api from '../lib/api';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  lastFetched: Date | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  lastFetched: null,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ notifications: Notification[]; unreadCount?: number }>(
        '/notifications',
      );

      const notifications = response.data.notifications || [];
      set({
        notifications,
        unreadCount:
          typeof response.data.unreadCount === 'number'
            ? response.data.unreadCount
            : notifications.filter((n) => !n.read).length,
        lastFetched: new Date(),
        loading: false,
      });
    } catch {
      set({
        notifications: [],
        unreadCount: 0,
        lastFetched: new Date(),
        loading: false,
      });
    }
  },

  markAsRead: (id) => {
    api
      .post(`/notifications/${id}/read`)
      .then(() => {
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          );
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        });
      })
      .catch((err: any) => {
        const message = err?.response?.data?.message;
        toast.error(message || 'This action is not available yet.');
      });
  },

  markAllAsRead: () => {
    api
      .post('/notifications/read-all')
      .then(() => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      })
      .catch((err: any) => {
        const message = err?.response?.data?.message;
        toast.error(message || 'This action is not available yet.');
      });
  },

  clearNotification: (id) => {
    api
      .delete(`/notifications/${id}`)
      .then(() => {
        set((state) => {
          const notifications = state.notifications.filter((n) => n.id !== id);
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        });
      })
      .catch((err: any) => {
        const message = err?.response?.data?.message;
        toast.error(message || 'This action is not available yet.');
      });
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));

// Polling interval for real-time notifications (30 seconds)
let pollingInterval: NodeJS.Timeout | null = null;

export function startNotificationPolling() {
  if (pollingInterval) return;
  
  // Initial fetch
  useNotificationStore.getState().fetchNotifications();
  
  // Poll every 30 seconds
  pollingInterval = setInterval(() => {
    useNotificationStore.getState().fetchNotifications();
  }, 30000);
}

export function stopNotificationPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}
