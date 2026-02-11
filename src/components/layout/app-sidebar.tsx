"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  HomeIcon,
  UsersIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  ShareIcon,
  ChartBarIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useOrg } from "@/components/providers/org-provider";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Contacts", href: "/contacts", icon: UsersIcon },
  { name: "Companies", href: "/companies", icon: BuildingOffice2Icon },
  { name: "Deals", href: "/deals", icon: CurrencyDollarIcon },
  { name: "Referrals", href: "/referrals", icon: ArrowsRightLeftIcon },
];

const visualizations = [
  { name: "Tree View", href: "/visualize/tree", view: "tree" },
  { name: "Network View", href: "/visualize/network", view: "network" },
  { name: "Galaxy View", href: "/visualize/galaxy", view: "galaxy" },
];

const secondaryNav = [
  { name: "Insights", href: "/insights", icon: SparklesIcon, requiresAI: true },
  { name: "Reports", href: "/reports", icon: ChartBarIcon },
  { name: "Import", href: "/import", icon: DocumentArrowDownIcon, requiresImport: true },
  { name: "Settings", href: "/settings/profile", icon: Cog6ToothIcon },
];

export function AppSidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { org } = useOrg();
  const { canAccessView, canAccessAI, canImportExport } = usePlanLimits();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Org switcher */}
      <div className="flex h-16 items-center gap-3 border-b border-amber-200/60 px-4 dark:border-stone-800">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
          {org?.name?.charAt(0)?.toUpperCase() || "R"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
            {org?.name || "My Workspace"}
          </p>
          <p className="text-xs capitalize text-zinc-500">
            {org?.plan || "free"} plan
          </p>
        </div>
        <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Visualizations section */}
        <div className="pt-4">
          <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
            Visualize
          </p>
          <div className="space-y-0.5">
            {visualizations.map((item) => {
              const hasAccess = canAccessView(item.view);
              return (
                <Link
                  key={item.href}
                  href={hasAccess ? item.href : "/settings/billing"}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400"
                      : hasAccess
                        ? "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        : "text-zinc-400 dark:text-zinc-600"
                  )}
                >
                  <ShareIcon className="h-5 w-5 shrink-0" />
                  {item.name}
                  {!hasAccess && (
                    <span className="ml-auto rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800">
                      PRO
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Secondary navigation */}
        <div className="pt-4">
          <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
            More
          </p>
          <div className="space-y-0.5">
            {secondaryNav.map((item) => {
              const locked =
                (item.requiresAI && !canAccessAI) ||
                (item.requiresImport && !canImportExport);
              return (
                <Link
                  key={item.href}
                  href={locked ? "/settings/billing" : item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400"
                      : locked
                        ? "text-zinc-400 dark:text-zinc-600"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                  {locked && (
                    <span className="ml-auto rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800">
                      PRO
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
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
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-amber-50/80 shadow-xl backdrop-blur-sm dark:bg-stone-900">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col border-r border-amber-200/60 bg-amber-50/50 dark:border-stone-800 dark:bg-stone-900">
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
