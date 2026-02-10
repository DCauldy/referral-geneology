"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  inputSize?: "sm" | "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, className, id, inputSize = "md", ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-sm",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
  };

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
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "block w-full rounded-md border bg-white text-zinc-900 shadow-sm transition-colors duration-150",
          "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
          "dark:bg-zinc-900 dark:text-zinc-100",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          error
            ? "border-red-500 focus:ring-red-500/30 dark:border-red-400"
            : "border-zinc-300 focus:border-primary-500 focus:ring-primary-500/30 dark:border-zinc-600 dark:focus:border-primary-400",
          "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400",
          sizeStyles[inputSize],
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
      />
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
});
