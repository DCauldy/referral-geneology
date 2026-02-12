"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  BuildingOffice2Icon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils/cn";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: HomeIcon },
  { name: "Users", href: "/admin/users", icon: UsersIcon },
  { name: "Organizations", href: "/admin/organizations", icon: BuildingOffice2Icon },
];

export function AdminSidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const linkClasses = (active: boolean) =>
    cn(
      "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
      active
        ? "bg-red-900/40 text-white"
        : "text-red-200 hover:bg-red-900/30 hover:text-white"
    );

  const iconClasses = (active: boolean) =>
    cn(
      "size-6 shrink-0",
      active ? "text-white" : "text-red-200 group-hover:text-white"
    );

  const sidebarContent = (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-red-950 px-6 pb-4">
      {/* Admin header */}
      <div className="shrink-0 pt-14 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-900">
            <svg className="size-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="font-serif text-sm font-semibold text-white">
            Trellis Admin
          </span>
        </div>
        <p className="mt-2 text-xs text-red-400">
          Platform Administration
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={linkClasses(isActive(item.href))}
                  >
                    <item.icon className={iconClasses(isActive(item.href))} />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          {/* Back to app */}
          <li className="-mx-6 mt-auto">
            <Link
              href="/dashboard"
              className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-red-200 hover:bg-red-900/30 hover:text-white"
            >
              <ArrowLeftIcon className="size-5" />
              Back to App
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        {sidebarContent}
      </div>
    </>
  );
}
