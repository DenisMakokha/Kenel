import { create } from 'zustand'
import type { ToastProps } from '../components/ui/toast'

interface ToastState {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastProps = { ...toast, id }
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto-remove after duration (default 5 seconds)
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}))

export function useToast() {
  const { toasts, addToast, removeToast, clearToasts } = useToastStore()

  const toast = Object.assign(
    (t: Omit<ToastProps, 'id'>) => addToast(t),
    {
      success: (title: string, description?: string) =>
        addToast({ title, description, variant: 'success' }),
      error: (title: string, description?: string) =>
        addToast({ title, description, variant: 'error' }),
      destructive: (title: string, description?: string) =>
        addToast({ title, description, variant: 'destructive' }),
      warning: (title: string, description?: string) =>
        addToast({ title, description, variant: 'warning' }),
      info: (title: string, description?: string) =>
        addToast({ title, description, variant: 'info' }),
      default: (title: string, description?: string) =>
        addToast({ title, description, variant: 'default' }),
    },
  )

  return {
    toasts,
    toast,
    addToast,
    removeToast,
    clearToasts,
  }
}

// Export a standalone toast function for use outside of React components
export const toast = Object.assign(
  (t: Omit<ToastProps, 'id'>) => useToastStore.getState().addToast(t),
  {
    success: (title: string, description?: string) =>
      useToastStore.getState().addToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) =>
      useToastStore.getState().addToast({ title, description, variant: 'error' }),
    destructive: (title: string, description?: string) =>
      useToastStore.getState().addToast({ title, description, variant: 'destructive' }),
    warning: (title: string, description?: string) =>
      useToastStore.getState().addToast({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) =>
      useToastStore.getState().addToast({ title, description, variant: 'info' }),
    default: (title: string, description?: string) =>
      useToastStore.getState().addToast({ title, description, variant: 'default' }),
  },
)
