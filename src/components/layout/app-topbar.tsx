"use client";

import {
  Bars3Icon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/components/providers/theme-provider";

export function AppTopbar({
  onMenuClick,
  onSearchClick,
}: {
  onMenuClick: () => void;
  onSearchClick?: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-primary-200/50 bg-white/80 px-4 backdrop-blur-sm dark:border-primary-900 dark:bg-primary-950/80">
      <button
        onClick={onMenuClick}
        className="text-zinc-500 hover:text-zinc-700 lg:hidden dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Search */}
      <button
        onClick={onSearchClick}
        className="flex flex-1 items-center gap-2 rounded-lg border border-primary-200 bg-primary-50/50 px-3 py-1.5 text-sm text-zinc-500 hover:bg-primary-100/50 dark:border-primary-800 dark:bg-primary-950 dark:hover:bg-primary-900"
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Search contacts, deals...</span>
        <span className="sm:hidden">Search...</span>
        <kbd className="ml-auto hidden rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-600 sm:inline dark:bg-primary-900 dark:text-primary-300">
          ⌘K
        </kbd>
      </button>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="rounded-lg p-2 text-zinc-500 hover:bg-primary-100/50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-primary-900 dark:hover:text-zinc-200"
      >
        {resolvedTheme === "dark" ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
