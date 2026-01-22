import * as React from 'react';
import { cn } from '../../lib/utils';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const PopoverContext = React.createContext<PopoverContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(value);
      }
      onOpenChange?.(value);
    },
    [controlledOpen, onOpenChange]
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ children, asChild }, ref) => {
    const { open, setOpen, triggerRef } = React.useContext(PopoverContext);

    const handleClick = () => {
      setOpen(!open);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: (node: HTMLElement) => {
          (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === 'function') ref(node as HTMLButtonElement);
          else if (ref) ref.current = node as HTMLButtonElement;
        },
        onClick: (e: React.MouseEvent) => {
          handleClick();
          (children as React.ReactElement<any>).props.onClick?.(e);
        },
      });
    }

    return (
      <button
        ref={(node) => {
          (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        onClick={handleClick}
      >
        {children}
      </button>
    );
  }
);
PopoverTrigger.displayName = 'PopoverTrigger';

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'center', sideOffset = 4, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = React.useContext(PopoverContext);
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        const isInsideTrigger = triggerRef.current?.contains(target);
        const isInsideContent = contentRef.current?.contains(target);

        if (open && !isInsideTrigger && !isInsideContent) {
          setOpen(false);
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open) {
          setOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [open, setOpen, triggerRef]);

    if (!open) return null;

    return (
      <div
        ref={(node) => {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          'absolute z-50 mt-2 rounded-md border border-slate-200 bg-white p-4 shadow-md outline-none',
          'animate-in fade-in-0 zoom-in-95 duration-100',
          'dark:border-slate-700 dark:bg-slate-800',
          align === 'start' && 'left-0',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          align === 'end' && 'right-0',
          className
        )}
        style={{ marginTop: sideOffset }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };
