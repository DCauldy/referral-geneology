"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

// --- Navbar ---
export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {}

export function Navbar({ className, ...props }: NavbarProps) {
  return (
    <nav
      className={cn(
        "flex items-center gap-2 text-sm",
        className
      )}
      {...props}
    />
  );
}

// --- NavbarSection ---
export interface NavbarSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function NavbarSection({ className, ...props }: NavbarSectionProps) {
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

// --- NavbarSpacer ---
export function NavbarSpacer() {
  return <div className="flex-1" aria-hidden="true" />;
}

// --- NavbarItem ---
export interface NavbarItemProps {
  href?: string;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function NavbarItem({
  href,
  active: activeProp,
  className,
  children,
  onClick,
}: NavbarItemProps) {
  const pathname = usePathname();

  const isActive =
    activeProp !== undefined
      ? activeProp
      : href
        ? pathname === href
        : false;

  const classes = cn(
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
    isActive
      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {children}
    </button>
  );
}

// --- NavbarLabel ---
export interface NavbarLabelProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

export function NavbarLabel({ className, ...props }: NavbarLabelProps) {
  return <span className={cn("truncate", className)} {...props} />;
}
