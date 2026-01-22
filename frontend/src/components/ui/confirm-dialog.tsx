import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Button } from "./button"
import { AlertTriangle, Trash2, CheckCircle, Info } from "lucide-react"
import { cn } from "../../lib/utils"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "default" | "danger" | "warning" | "success" | "info"
  loading?: boolean
}

const variantConfig = {
  default: {
    icon: Info,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    buttonClass: "bg-slate-900 hover:bg-slate-800",
  },
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    buttonClass: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    buttonClass: "bg-amber-600 hover:bg-amber-700",
  },
  success: {
    icon: CheckCircle,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    buttonClass: "bg-blue-600 hover:bg-blue-700",
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm()
    if (!loading) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0", config.iconBg)}>
              <Icon className={cn("h-6 w-6", config.iconColor)} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-2">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            className={config.buttonClass}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
import { useState, useCallback } from "react"

interface UseConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmDialogProps["variant"]
}

export function useConfirm(options: UseConfirmOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback(() => {
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolveRef?.(true)
    setIsOpen(false)
  }, [resolveRef])

  const handleCancel = useCallback(() => {
    resolveRef?.(false)
    setIsOpen(false)
  }, [resolveRef])

  const ConfirmDialogComponent = useCallback(() => (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={options.title}
      description={options.description}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      loading={loading}
    />
  ), [isOpen, loading, options, handleConfirm, handleCancel])

  return {
    confirm,
    setLoading,
    ConfirmDialog: ConfirmDialogComponent,
  }
}

// Pre-configured confirm dialogs
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  onConfirm: () => void
  loading?: boolean
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${itemName}?`}
      description={`Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="danger"
      onConfirm={onConfirm}
      loading={loading}
    />
  )
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out?"
      description="Are you sure you want to sign out of your account?"
      confirmLabel="Sign out"
      variant="warning"
      onConfirm={onConfirm}
    />
  )
}
