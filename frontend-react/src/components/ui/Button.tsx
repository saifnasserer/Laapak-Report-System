import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, icon, iconPosition = 'left', children, ...props }, ref) => {
        const variants = {
            primary: 'bg-primary text-primary-foreground hover:opacity-90',
            secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
            outline: 'border border-primary text-primary hover:bg-primary/10',
            ghost: 'text-primary hover:bg-primary/10',
            destructive: 'bg-destructive text-white hover:opacity-90',
        };

        const sizes = {
            sm: 'px-4 py-2 text-sm',
            md: 'px-6 py-3 text-base',
            lg: 'px-8 py-4 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'no-ripple inline-flex items-center justify-center gap-2 font-semibold rounded-button disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all',
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                    <>
                        {icon && iconPosition === 'left' && icon}
                        {children}
                        {icon && iconPosition === 'right' && icon}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
