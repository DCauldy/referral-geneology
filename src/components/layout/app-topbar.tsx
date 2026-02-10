"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useOrg } from "@/components/providers/org-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils/format";

export function AppTopbar({
  onMenuClick,
  onSearchClick,
}: {
  onMenuClick: () => void;
  onSearchClick?: () => void;
}) {
  const router = useRouter();
  const { profile } = useOrg();
  const { resolvedTheme, setTheme } = useTheme();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile?.full_name
    ? getInitials(
        profile.full_name.split(" ")[0],
        profile.full_name.split(" ").slice(1).join(" ")
      )
    : "?";

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

      {/* User menu */}
      <Menu as="div" className="relative">
        <MenuButton className="flex items-center gap-2 rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {initials}
            </div>
          )}
        </MenuButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {profile?.full_name || "User"}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {profile?.job_title || ""}
              </p>
            </div>
            <div className="border-t border-zinc-100 dark:border-zinc-700" />
            <MenuItem>
              <button
                onClick={() => router.push("/settings/profile")}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 data-[focus]:bg-zinc-100 dark:text-zinc-300 dark:data-[focus]:bg-zinc-700"
              >
                <UserCircleIcon className="h-4 w-4" />
                Profile
              </button>
            </MenuItem>
            <MenuItem>
              <button
                onClick={() => router.push("/settings/organization")}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 data-[focus]:bg-zinc-100 dark:text-zinc-300 dark:data-[focus]:bg-zinc-700"
              >
                <Cog6ToothIcon className="h-4 w-4" />
                Settings
              </button>
            </MenuItem>
            <div className="border-t border-zinc-100 dark:border-zinc-700" />
            <MenuItem>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 data-[focus]:bg-zinc-100 dark:text-red-400 dark:data-[focus]:bg-zinc-700"
              >
                <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                Sign out
              </button>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );
}
