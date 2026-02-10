"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, helperText, className, id, children, ...props }, ref) {
    const inputId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              "block w-full appearance-none rounded-md border bg-white py-2 pl-3 pr-10 text-sm text-zinc-900 shadow-sm transition-colors duration-150",
              "dark:bg-zinc-900 dark:text-zinc-100",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              error
                ? "border-red-500 focus:ring-red-500/30 dark:border-red-400"
                : "border-zinc-300 focus:border-primary-500 focus:ring-primary-500/30 dark:border-zinc-600 dark:focus:border-primary-400",
              "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400",
              className
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          >
            {children}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
