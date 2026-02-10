// @ts-nocheck
"use client";

import {
  Fieldset as HeadlessFieldset,
  Field as HeadlessField,
  Label as HeadlessLabel,
  Description as HeadlessDescription,
} from "@headlessui/react";
import { cn } from "@/lib/utils/cn";

// --- Fieldset ---
export interface FieldsetProps
  extends React.ComponentProps<typeof HeadlessFieldset> {
  legend?: string;
}

export function Fieldset({
  legend,
  className,
  children,
  ...props
}: FieldsetProps) {
  return (
    <HeadlessFieldset className={cn("space-y-6", className)} {...props}>
      {legend && (
        <legend className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {legend}
        </legend>
      )}
      {children}
    </HeadlessFieldset>
  );
}

// --- Field ---
export interface FieldProps
  extends React.ComponentProps<typeof HeadlessField> {}

export function Field({ className, ...props }: FieldProps) {
  return <HeadlessField className={cn("space-y-1.5", className)} {...props} />;
}

// --- Label ---
export interface LabelProps
  extends React.ComponentProps<typeof HeadlessLabel> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <HeadlessLabel
      className={cn(
        "block text-sm font-medium text-zinc-700 dark:text-zinc-300",
        "data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  );
}

// --- Description ---
export interface DescriptionProps
  extends React.ComponentProps<typeof HeadlessDescription> {}

export function Description({ className, ...props }: DescriptionProps) {
  return (
    <HeadlessDescription
      className={cn(
        "text-sm text-zinc-500 dark:text-zinc-400",
        "data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  );
}

// --- ErrorMessage ---
export interface ErrorMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function ErrorMessage({ className, ...props }: ErrorMessageProps) {
  return (
    <p
      className={cn("text-sm text-red-600 dark:text-red-400", className)}
      role="alert"
      {...props}
    />
  );
}
