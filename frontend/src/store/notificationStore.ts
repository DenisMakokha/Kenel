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
      // Fetch staff notifications
      const [notificationsRes, countRes] = await Promise.all([
        api.get('/staff-notifications'),
        api.get<{ count: number }>('/staff-notifications/count'),
      ]);

      const notifications = (notificationsRes.data || []).map((n: any) => ({
        id: n.id,
        type: n.type === 'kyc_review' || n.type === 'loan_application' ? 'info' : n.type,
        title: n.title,
        message: n.message,
        read: n.isRead,
        createdAt: n.createdAt,
        link: n.linkUrl,
      }));

      set({
        notifications,
        unreadCount: countRes.data.count || 0,
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
      .patch(`/staff-notifications/${id}/read`)
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
        toast.error(message || 'Failed to mark notification as read.');
      });
  },

  markAllAsRead: () => {
    api
      .patch('/staff-notifications/read-all')
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
