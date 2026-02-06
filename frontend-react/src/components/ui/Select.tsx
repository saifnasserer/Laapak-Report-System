'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectContextType {
    open: boolean;
    setOpen: (open: boolean) => void;
    value: string;
    onValueChange: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const Select = ({ children, value, onValueChange, open, onOpenChange }: { children: React.ReactNode, value?: string, onValueChange?: (value: string) => void, open?: boolean, onOpenChange?: (open: boolean) => void }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    // Controlled or uncontrolled open state
    const isControlledOpen = open !== undefined;
    const currentOpen = isControlledOpen ? open : isOpen;
    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlledOpen) setIsOpen(newOpen);
        onOpenChange?.(newOpen);
    };

    return (
        <SelectContext.Provider value={{ open: currentOpen, setOpen: handleOpenChange, value: value || '', onValueChange: onValueChange || (() => { }) }}>
            <div className="relative inline-block w-full">
                {children}
            </div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext)!;

    return (
        <button
            ref={ref}
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
});
SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
    placeholder?: string;
    label?: string;
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(({ className, placeholder, label, ...props }, ref) => {
    const { value } = React.useContext(SelectContext)!;
    return (
        <span ref={ref} className={cn("block truncate px-1", className)} {...props}>
            {label || value || placeholder}
        </span>
    );
});
SelectValue.displayName = "SelectValue";

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
    position?: "popper" | "item-aligned";
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(({ className, children, position = "popper", ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext)!;
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contentRef.current && !contentRef.current.contains(event.target as Node) && !(event.target as Element).closest('button')) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open, setOpen]);

    if (!open) return null;

    return (
        <div
            ref={contentRef}
            className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
                position === "popper" && "top-[calc(100%+4px)] w-full",
                className
            )}
            {...props}
        >
            <div className="p-1">{children}</div>
        </div>
    );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(({ className, children, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext)!;
    const isSelected = selectedValue === value;

    return (
        <div
            ref={ref}
            onClick={(e) => {
                e.stopPropagation();
                onValueChange(value);
                setOpen(false);
            }}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                className
            )}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
            </span>
            <span className="truncate">{children}</span>
        </div>
    );
});
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
