import { Toast, ToastProps } from "./toast"
import { useToast } from "../../hooks/useToast"

export function Toaster() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast: ToastProps) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
