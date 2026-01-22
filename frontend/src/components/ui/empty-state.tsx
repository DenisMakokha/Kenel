import { LucideIcon, FileX, Search, Inbox } from "lucide-react"
import { Button } from "./button"
import { cn } from "../../lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
  variant?: "default" | "compact" | "card"
}

export function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Icon className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button size="sm" className="mt-3" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    )
  }

  if (variant === "card") {
    return (
      <div className={cn(
        "rounded-lg border border-slate-200 bg-white p-8 text-center",
        className
      )}>
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500 max-w-md mx-auto">{description}</p>
        )}
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex items-center justify-center gap-3 mt-4">
            {secondaryActionLabel && onSecondaryAction && (
              <Button variant="outline" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            )}
            {actionLabel && onAction && (
              <Button onClick={onAction}>
                {actionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 text-center",
      className
    )}>
      <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
        <Icon className="h-10 w-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-md">{description}</p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 mt-6">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Pre-configured empty states for common scenarios
export function NoSearchResults({ 
  searchTerm, 
  onClear 
}: { 
  searchTerm?: string
  onClear?: () => void 
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={searchTerm 
        ? `No results match "${searchTerm}". Try adjusting your search or filters.`
        : "Try adjusting your search or filters to find what you're looking for."
      }
      actionLabel={onClear ? "Clear search" : undefined}
      onAction={onClear}
      variant="compact"
    />
  )
}

export function NoDataYet({ 
  entity, 
  actionLabel, 
  onAction 
}: { 
  entity: string
  actionLabel?: string
  onAction?: () => void 
}) {
  return (
    <EmptyState
      icon={Inbox}
      title={`No ${entity} yet`}
      description={`${entity.charAt(0).toUpperCase() + entity.slice(1)} will appear here once they're created.`}
      actionLabel={actionLabel}
      onAction={onAction}
      variant="card"
    />
  )
}
