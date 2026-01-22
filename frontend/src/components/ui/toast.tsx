import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning" | "info" | "destructive"
  duration?: number
  onClose?: () => void
}

const toastVariants = {
  default: "bg-white border-slate-200",
  success: "bg-emerald-50 border-emerald-200",
  error: "bg-red-50 border-red-200",
  destructive: "bg-red-50 border-red-200",
  warning: "bg-amber-50 border-amber-200",
  info: "bg-blue-50 border-blue-200",
}

const toastIconColors = {
  default: "text-slate-600",
  success: "text-emerald-600",
  error: "text-red-600",
  destructive: "text-red-600",
  warning: "text-amber-600",
  info: "text-blue-600",
}

const toastTitleColors = {
  default: "text-slate-900",
  success: "text-emerald-900",
  error: "text-red-900",
  destructive: "text-red-900",
  warning: "text-amber-900",
  info: "text-blue-900",
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ title, description, variant = "default", onClose }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-auto w-full max-w-sm rounded-lg border shadow-lg p-4",
          "animate-in slide-in-from-right-full duration-300",
          toastVariants[variant]
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {title && (
              <p className={cn("text-sm font-semibold", toastTitleColors[variant])}>
                {title}
              </p>
            )}
            {description && (
              <p className={cn("text-sm mt-1", toastIconColors[variant])}>
                {description}
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
Toast.displayName = "Toast"
