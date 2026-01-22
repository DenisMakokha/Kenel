import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import type { DateRange as DayPickerDateRange } from 'react-day-picker';

export type DateRange = DayPickerDateRange;

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className,
  align = 'start',
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onChange?.(range);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
    onChange?.(undefined);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>{placeholder}</span>
            )}
            {date && (
              <X
                className="ml-auto h-4 w-4 text-slate-400 hover:text-slate-600"
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
          <div className="flex items-center justify-between p-3 border-t">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  handleSelect({ from: today, to: today });
                }}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  handleSelect({ from: weekAgo, to: today });
                }}
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setDate(monthAgo.getDate() - 30);
                  handleSelect({ from: monthAgo, to: today });
                }}
              >
                Last 30 days
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelect(undefined)}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
