import * as React from "react"
import { cn } from "../../lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
  contentRef: React.RefObject<HTMLDivElement>
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  contentRef: { current: null },
})

const DropdownMenu = ({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = React.useCallback((value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }, [controlledOpen, onOpenChange])

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, setOpen])

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const isInsideTrigger = triggerRef.current?.contains(target)
      const isInsideContent = contentRef.current?.contains(target)
      
      if (open && !isInsideTrigger && !isInsideContent) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, setOpen])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<HTMLElement, DropdownMenuTriggerProps>(
  ({ children, asChild }, ref) => {
    const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)

    const handleClick = () => {
      setOpen(!open)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: (node: HTMLElement) => {
          (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        },
        onClick: (e: React.MouseEvent) => {
          handleClick()
          ;(children as React.ReactElement<any>).props.onClick?.(e)
        },
        "aria-expanded": open,
        "aria-haspopup": true,
      })
    }

    return (
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        onClick={handleClick}
        aria-expanded={open}
        aria-haspopup
      >
        {children}
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "end", children, ...props }, ref) => {
    const { open, contentRef } = React.useContext(DropdownMenuContext)

    if (!open) return null

    return (
      <div
        ref={(node) => {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        className={cn(
          "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-lg",
          "animate-in fade-in-0 zoom-in-95 duration-100",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "end" && "right-0",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, disabled, onClick, children, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext)

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return
      onClick?.(e)
      setOpen(false)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
          "hover:bg-slate-100 focus:bg-slate-100",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-slate-900", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-slate-200", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
