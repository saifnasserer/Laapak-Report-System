'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Table = React.forwardRef<
    HTMLTableElement,
    React.TableHTMLAttributes<HTMLTableElement> & { headers?: (string | React.ReactNode)[], wrapperClassName?: string }
>(({ className, headers, wrapperClassName, children, ...props }, ref) => (
    <div className={cn("relative w-full overflow-auto rounded-xl", wrapperClassName)}>
        <table
            ref={ref}
            className={cn("w-full caption-bottom text-sm", className)}
            {...props}
        >
            {headers && (
                <thead className="bg-surface-variant/30">
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index} className="px-8 py-4 text-sm font-bold text-secondary/60 text-right">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
            )}
            {headers ? (
                <tbody className="divide-y divide-black/5">
                    {children}
                </tbody>
            ) : children}
        </table>
    </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn(className)} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn("divide-y divide-black/5", className)}
        {...props}
    />
));
TableBody.displayName = "TableBody";

export const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            "h-12 px-4 text-right align-middle font-medium text-secondary/60 [&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    />
));
TableHead.displayName = "TableHead";

export const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            "transition-colors hover:bg-primary/5 data-[state=selected]:bg-muted group",
            className
        )}
        {...props}
    />
));
TableRow.displayName = "TableRow";

export const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
        {...props}
    />
));
TableCell.displayName = "TableCell";
