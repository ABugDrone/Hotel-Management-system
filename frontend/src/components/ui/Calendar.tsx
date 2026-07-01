import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CalendarProps {
  className?: string;
  date?: Date;
  onSelect?: (date: Date) => void;
  mode?: 'single' | 'range';
  children?: React.ReactNode;
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, date, onSelect, mode = 'single', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md border p-3 shadow-sm',
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Date picker component (simplified for demo)
        </div>
      </div>
    );
  }
);
Calendar.displayName = 'Calendar';

export { Calendar, CalendarIcon };