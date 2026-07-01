import * as React from 'react';
import { cn } from '../../lib/utils';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

const useSelectContext = () => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error('Select components must be used within <Select>');
  return ctx;
};

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onChange?: (e: any) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const Select = ({ value, defaultValue, onValueChange, onChange, children, className }: SelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const selectedValue = value ?? internalValue;

  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
    if (onChange) {
      onChange({ target: { value: newValue } });
    }
    if (!onValueChange && !onChange) {
      setInternalValue(newValue);
    }
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value: selectedValue, onValueChange: handleValueChange, open, setOpen }}>
      <div className={cn('relative', className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { setOpen } = useSelectContext();
    return (
      <div
        ref={ref}
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 opacity-50"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

const SelectValue = ({ placeholder, children }: SelectValueProps) => {
  const { value } = useSelectContext();
  return (
    <span className="truncate">
      {children || (value || <span className="text-muted-foreground">{placeholder}</span>)}
    </span>
  );
};

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useSelectContext();
    if (!open) return null;
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={() => useSelectContext().setOpen(false)} />
        <div
          ref={ref}
          className={cn(
            'absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
            className
          )}
          {...props}
        >
          <div className="p-1">{children}</div>
        </div>
      </>
    );
  }
);
SelectContent.displayName = 'SelectContent';

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useSelectContext();
    const isSelected = selectedValue === value;
    return (
      <div
        ref={ref}
        onClick={() => onValueChange(value)}
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
          isSelected && 'bg-accent text-accent-foreground',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';

const SelectGroup = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

const SelectLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('py-1.5 px-2 text-sm font-semibold', className)}>
    {children}
  </div>
);

const SelectSeparator = ({ className }: { className?: string }) => (
  <div className={cn('-mx-1 my-1 h-px bg-muted', className)} />
);

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
