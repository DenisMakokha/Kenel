import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    const isIndeterminate = checked === 'indeterminate';
    const isChecked = checked === true;

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={isIndeterminate ? 'mixed' : isChecked}
        disabled={disabled}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded-sm border border-slate-300 ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white',
          'data-[state=indeterminate]:bg-emerald-600 data-[state=indeterminate]:border-emerald-600 data-[state=indeterminate]:text-white',
          'transition-colors',
          className
        )}
        data-state={isIndeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'}
        onClick={() => onCheckedChange?.(!isChecked)}
        {...props}
      >
        {isIndeterminate ? (
          <Minus className="h-3 w-3" />
        ) : isChecked ? (
          <Check className="h-3 w-3" />
        ) : null}
      </button>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
