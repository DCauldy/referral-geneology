"use client";

import {
  Switch as HeadlessSwitch,
  Field,
  Label,
} from "@headlessui/react";
import { cn } from "@/lib/utils/cn";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
  color?: "primary" | "green" | "red" | "blue";
}

const colorStyles = {
  primary: "data-[checked]:bg-primary-600 dark:data-[checked]:bg-primary-500",
  green: "data-[checked]:bg-green-600 dark:data-[checked]:bg-green-500",
  red: "data-[checked]:bg-red-600 dark:data-[checked]:bg-red-500",
  blue: "data-[checked]:bg-blue-600 dark:data-[checked]:bg-blue-500",
  amber: "data-[checked]:bg-amber-600 dark:data-[checked]:bg-amber-500",
};

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  name,
  className,
  color = "primary",
}: SwitchProps) {
  const toggle = (
    <HeadlessSwitch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      name={name}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
        "bg-zinc-200 dark:bg-zinc-700",
        colorStyles[color],
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out",
          "translate-x-0 data-[checked]:translate-x-5"
        )}
        data-checked={checked || undefined}
        style={{ transform: checked ? "translateX(1.25rem)" : "translateX(0)" }}
      />
    </HeadlessSwitch>
  );

  if (!label) return toggle;

  return (
    <Field className="flex items-center gap-3">
      {toggle}
      <div>
        <Label className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
    </Field>
  );
}
