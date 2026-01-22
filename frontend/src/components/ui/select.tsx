import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

// Context for Select state management
interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  disabled: boolean
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used within a Select")
  }
  return context
}

// Root Select component
interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}

function Select({ value, defaultValue = "", onValueChange, disabled = false, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)

  const currentValue = value !== undefined ? value : internalValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (disabled) return
      if (value === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
      setOpen(false)
    },
    [value, onValueChange, disabled]
  )

  return (
    <SelectContext.Provider
      value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen, disabled }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

// SelectTrigger
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, disabled } = useSelectContext()

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => {
          if (!disabled) setOpen(!open)
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={disabled || props.disabled}
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

// SelectValue
interface SelectValueProps {
  placeholder?: string
}

function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useSelectContext()
  return <span className={cn(!value && "text-muted-foreground")}>{value || placeholder}</span>
}

// SelectContent
interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

function SelectContent({ children, className }: SelectContentProps) {
  const { open, setOpen } = useSelectContext()
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        // Check if click is on the trigger button
        const trigger = contentRef.current.parentElement?.querySelector('button')
        if (trigger && !trigger.contains(event.target as Node)) {
          setOpen(false)
        }
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      {children}
    </div>
  )
}

// SelectItem
interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

function SelectItem({ value, children, className, disabled }: SelectItemProps) {
  const { value: selectedValue, onValueChange } = useSelectContext()
  const isSelected = selectedValue === value

  return (
    <div
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {children}
    </div>
  )
}

// SelectGroup
function SelectGroup({ children }: { children: React.ReactNode }) {
  return <div className="py-1">{children}</div>
}

// SelectLabel
function SelectLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold text-muted-foreground", className)}>
      {children}
    </div>
  )
}

// SelectSeparator
function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
