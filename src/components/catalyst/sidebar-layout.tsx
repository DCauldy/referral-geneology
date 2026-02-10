"use client";

import { createContext, useContext, useState, useCallback } from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogBackdrop,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

// --- Sidebar Context ---
interface SidebarContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  setOpen: () => {},
});

// --- SidebarLayout ---
export interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  navbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SidebarLayout({
  sidebar,
  navbar,
  children,
  className,
}: SidebarLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className={cn("relative flex min-h-screen", className)}>
        {/* Mobile sidebar drawer */}
        <MobileSidebar>{sidebar}</MobileSidebar>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
          {sidebar}
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col lg:pl-64">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-zinc-200 bg-white px-4 dark:border-zinc-700 dark:bg-zinc-900 lg:hidden">
            <button
              type="button"
              className="-m-2 p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={() => setOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            {navbar && <div className="flex flex-1">{navbar}</div>}
          </div>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

function MobileSidebar({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useContext(SidebarContext);

  return (
    <HeadlessDialog
      open={open}
      onClose={() => setOpen(false)}
      className="relative z-50 lg:hidden"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 transition-opacity duration-300 data-[closed]:opacity-0 dark:bg-black/50"
      />
      <div className="fixed inset-0 flex">
        <DialogPanel
          transition
          className="relative flex w-64 max-w-xs flex-1 transition-transform duration-300 ease-in-out data-[closed]:-translate-x-full"
        >
          <div className="absolute right-0 top-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-white hover:text-zinc-300"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          {children}
        </DialogPanel>
      </div>
    </HeadlessDialog>
  );
}

// --- Sidebar ---
export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  return (
    <nav
      className={cn(
        "flex h-full flex-col overflow-y-auto border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
        className
      )}
      {...props}
    />
  );
}

// --- SidebarHeader ---
export interface SidebarHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeader({ className, ...props }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center border-b border-zinc-200 px-4 dark:border-zinc-700",
        className
      )}
      {...props}
    />
  );
}

// --- SidebarBody ---
export interface SidebarBodyProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarBody({ className, ...props }: SidebarBodyProps) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto px-3 py-4", className)}
      {...props}
    />
  );
}

// --- SidebarFooter ---
export interface SidebarFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarFooter({ className, ...props }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-zinc-200 px-3 py-3 dark:border-zinc-700",
        className
      )}
      {...props}
    />
  );
}

// --- SidebarSection ---
export interface SidebarSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function SidebarSection({
  title,
  className,
  children,
  ...props
}: SidebarSectionProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {title && (
        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
      )}
      <ul role="list" className="space-y-1">
        {children}
      </ul>
    </div>
  );
}

// --- SidebarSpacer ---
export function SidebarSpacer() {
  return <div className="flex-1" aria-hidden="true" />;
}

// --- SidebarItem ---
export interface SidebarItemProps {
  href?: string;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function SidebarItem({
  href,
  active: activeProp,
  className,
  children,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname();
  const { setOpen } = useContext(SidebarContext);

  const isActive =
    activeProp !== undefined
      ? activeProp
      : href
        ? pathname === href || pathname.startsWith(href + "/")
        : false;

  const itemClasses = cn(
    "group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors duration-150",
    isActive
      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
    className
  );

  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };

  if (href) {
    return (
      <li>
        <Link href={href} className={itemClasses} onClick={handleClick}>
          {children}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" className={itemClasses} onClick={handleClick}>
        {children}
      </button>
    </li>
  );
}

// --- SidebarLabel ---
export interface SidebarLabelProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

export function SidebarLabel({ className, ...props }: SidebarLabelProps) {
  return <span className={cn("truncate", className)} {...props} />;
}
