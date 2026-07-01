import * as React from 'react';
import { cn } from '../../lib/utils';

interface PopoverProps {
  children: React.ReactNode;
}

const Popover = ({ children }: PopoverProps) => {
  return <div className="relative">{children}</div>;
};

interface PopoverTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const PopoverTrigger = ({ children, onClick }: PopoverTriggerProps) => (
  <div onClick={onClick}>{children}</div>
);

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };