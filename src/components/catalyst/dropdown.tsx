"use client";

import { Fragment } from "react";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  MenuSeparator,
} from "@headlessui/react";
import { cn } from "@/lib/utils/cn";

// --- Dropdown Root ---
export function Dropdown({
  children,
  ...props
}: React.ComponentProps<typeof Menu>) {
  return (
    <Menu as="div" className="relative inline-block text-left" {...props}>
      {children}
    </Menu>
  );
}

// --- Dropdown Button ---
export interface DropdownButtonProps
  extends React.ComponentProps<typeof MenuButton> {}

export function DropdownButton({
  className,
  ...props
}: DropdownButtonProps) {
  return (
    <MenuButton
      className={cn(
        "inline-flex items-center justify-center gap-1.5 text-sm font-medium transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900",
        className
      )}
      {...props}
    />
  );
}

// --- Dropdown Items ---
export type DropdownAnchor =
  | "bottom start"
  | "bottom end"
  | "top start"
  | "top end";

export interface DropdownItemsProps
  extends Omit<React.ComponentProps<typeof MenuItems>, "anchor"> {
  anchor?: DropdownAnchor;
}

export function DropdownItems({
  anchor = "bottom end",
  className,
  ...props
}: DropdownItemsProps) {
  return (
    <MenuItems
      anchor={anchor}
      transition
      className={cn(
        "z-50 min-w-[10rem] rounded-lg bg-white p-1 shadow-lg ring-1 ring-zinc-200",
        "dark:bg-zinc-800 dark:ring-zinc-700",
        // Headless UI v2 transition classes
        "transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0",
        "[--anchor-gap:4px]",
        className
      )}
      {...props}
    />
  );
}

// --- Dropdown Item ---
export interface DropdownItemProps {
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  destructive?: boolean;
}

export function DropdownItem({
  className,
  children,
  disabled,
  onClick,
  destructive,
}: DropdownItemProps) {
  return (
    <MenuItem disabled={disabled}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-100",
          "data-[focus]:bg-zinc-100 dark:data-[focus]:bg-zinc-700/50",
          destructive
            ? "text-red-600 dark:text-red-400"
            : "text-zinc-700 dark:text-zinc-300",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {children}
      </button>
    </MenuItem>
  );
}

// --- Dropdown Separator ---
export function DropdownSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <MenuSeparator
      className={cn(
        "my-1 h-px bg-zinc-200 dark:bg-zinc-700",
        className
      )}
      {...props}
    />
  );
}
