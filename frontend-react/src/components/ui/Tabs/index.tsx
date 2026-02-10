import React, { createContext, useContext, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TabsContextType {
    value?: string;
    onValueChange?: (value: string) => void;
}

const TabsContext = createContext<TabsContextType>({});

export interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    children: React.ReactNode;
}

export const Tabs = ({ defaultValue, value, onValueChange, className, children }: TabsProps) => {
    const [activeTab, setActiveTab] = useState(value || defaultValue || '');

    const handleValueChange = (newValue: string) => {
        if (value === undefined) {
            setActiveTab(newValue);
        }
        onValueChange?.(newValue);
    };

    const currentValue = value !== undefined ? value : activeTab;

    return (
        <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
            <div className={cn('w-full', className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

export const TabsList = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={cn('inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', className)}>
        {children}
    </div>
);

export interface TabsTriggerProps {
    value: string;
    className?: string;
    children: React.ReactNode;
    disabled?: boolean;
}

export const TabsTrigger = ({ value, className, children, disabled }: TabsTriggerProps) => {
    const { value: activeValue, onValueChange } = useContext(TabsContext);
    const isActive = activeValue === value;

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onValueChange?.(value)}
            data-state={isActive ? 'active' : 'inactive'}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                isActive && 'bg-background text-foreground shadow-sm',
                className
            )}
        >
            {children}
        </button>
    );
};

export const TabsContent = ({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) => {
    const { value: activeValue } = useContext(TabsContext);
    if (activeValue !== value) return null;

    return (
        <div
            className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}
        >
            {children}
        </div>
    );
};
