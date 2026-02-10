"use client";

import { forwardRef, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, helperText, autoResize, className, id, onChange, ...props },
    ref
  ) {
    const inputId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const resize = useCallback(() => {
      const el = internalRef.current;
      if (el && autoResize) {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }
    }, [autoResize]);

    useEffect(() => {
      resize();
    }, [resize, props.value, props.defaultValue]);

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
        <textarea
          ref={setRefs}
          id={inputId}
          rows={props.rows ?? 3}
          className={cn(
            "block w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition-colors duration-150",
            "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
            "dark:bg-zinc-900 dark:text-zinc-100",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-red-500 focus:ring-red-500/30 dark:border-red-400"
              : "border-zinc-300 focus:border-primary-500 focus:ring-primary-500/30 dark:border-zinc-600 dark:focus:border-primary-400",
            "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400",
            autoResize && "resize-none overflow-hidden",
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
          onChange={(e) => {
            onChange?.(e);
            resize();
          }}
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
  }
);
