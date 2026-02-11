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
    <div className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <button
        onClick={onMenuClick}
        className="text-zinc-500 hover:text-zinc-700 lg:hidden dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Search */}
      <button
        onClick={onSearchClick}
        className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Search contacts, deals...</span>
        <span className="sm:hidden">Search...</span>
        <kbd className="ml-auto hidden rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline dark:bg-zinc-700 dark:text-zinc-400">
          ⌘K
        </kbd>
      </button>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
