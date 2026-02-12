"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { cn } from "@/lib/utils/cn";
import {
  HomeIcon,
  UsersIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronUpIcon,
  BoltIcon,
  EnvelopeIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  TrophyIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useOrg } from "@/components/providers/org-provider";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils/format";

function TreeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className={className}>
      <circle cx="10" cy="3.5" r="2" strokeWidth="1.5" />
      <circle cx="4.5" cy="13" r="2" strokeWidth="1.5" />
      <circle cx="15.5" cy="13" r="2" strokeWidth="1.5" />
      <path d="M10 5.5V8.5M10 8.5L4.5 11M10 8.5L15.5 11" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NetworkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className={className}>
      <circle cx="10" cy="10" r="2" strokeWidth="1.5" />
      <circle cx="3.5" cy="5" r="1.5" strokeWidth="1.5" />
      <circle cx="16.5" cy="5" r="1.5" strokeWidth="1.5" />
      <circle cx="4" cy="16" r="1.5" strokeWidth="1.5" />
      <circle cx="16" cy="15" r="1.5" strokeWidth="1.5" />
      <path d="M8.2 8.8L4.7 6.2M11.8 8.8L15.3 6.2M8.5 11.5L5.2 14.8M11.5 11.5L14.8 13.8" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function GalaxyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" stroke="none" className={className}>
      <circle cx="10" cy="10" r="2.2" opacity="0.9" />
      <circle cx="5" cy="7" r="1.2" opacity="0.7" />
      <circle cx="15" cy="7" r="1" opacity="0.6" />
      <circle cx="4" cy="13" r="0.9" opacity="0.5" />
      <circle cx="14.5" cy="14" r="1.3" opacity="0.65" />
      <circle cx="7.5" cy="15.5" r="0.7" opacity="0.4" />
      <circle cx="12" cy="4.5" r="0.8" opacity="0.45" />
      <circle cx="7" cy="4" r="0.6" opacity="0.35" />
      <circle cx="16.5" cy="11" r="0.7" opacity="0.4" />
    </svg>
  );
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Contacts", href: "/contacts", icon: UsersIcon },
  { name: "Companies", href: "/companies", icon: BuildingOffice2Icon },
  { name: "Deals", href: "/deals", icon: CurrencyDollarIcon },
  { name: "Referrals", href: "/referrals", icon: ArrowsRightLeftIcon },
  { name: "Exchange", href: "/exchange", icon: ArrowTopRightOnSquareIcon, requiresExchange: true },
  { name: "Directory", href: "/directory", icon: GlobeAltIcon, requiresExchange: true },
];

const visualizations = [
  { name: "Tree View", href: "/visualize/tree", view: "tree", icon: TreeIcon },
  { name: "Network View", href: "/visualize/network", view: "network", icon: NetworkIcon },
  { name: "Galaxy View", href: "/visualize/galaxy", view: "galaxy", icon: GalaxyIcon },
];

const automateNav = [
  { name: "Automations", href: "/automations", icon: BoltIcon },
  { name: "Templates", href: "/automations/templates", icon: EnvelopeIcon },
];

const secondaryNav: {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAI?: boolean;
  requiresImport?: boolean;
  requiresPaid?: boolean;
}[] = [
  { name: "Insights", href: "/insights", icon: SparklesIcon, requiresAI: true },
  { name: "Reports", href: "/reports", icon: ChartBarIcon },
  { name: "Achievements", href: "/achievements", icon: TrophyIcon },
  { name: "Leaderboard", href: "/leaderboard", icon: ChartBarSquareIcon, requiresPaid: true },
];

export function AppSidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { org, profile } = useOrg();
  const { canAccessView, canAccessAI, canImportExport, canAccessAutomations, canExchangeReferrals } = usePlanLimits();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/automations") return pathname === "/automations" || (pathname.startsWith("/automations/") && !pathname.startsWith("/automations/templates"));
    return pathname.startsWith(href);
  }

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

  const linkClasses = (active: boolean, locked?: boolean) =>
    cn(
      "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
      active
        ? "bg-tan-800/40 text-white"
        : locked
          ? "text-primary-200/50"
          : "text-primary-200 hover:bg-primary-900 hover:text-white"
    );

  const iconClasses = (active: boolean) =>
    cn("size-6 shrink-0", active ? "text-white" : "text-primary-200 group-hover:text-white");

  const sidebarContent = (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-primary-800 px-6 pb-4">
      {/* Logo + plan */}
      <div className="shrink-0 pt-14 pb-4">
        <div className="flex items-center gap-2">
          <svg className="h-8 w-8 shrink-0" viewBox="0 0 48 48" fill="none">
            <line x1="24" y1="6" x2="12" y2="18" stroke="#e0e9df" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="24" y1="6" x2="36" y2="18" stroke="#e0e9df" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="12" y1="18" x2="8" y2="32" stroke="#e0e9df" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="12" y1="18" x2="24" y2="32" stroke="#e0e9df" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="36" y1="18" x2="24" y2="32" stroke="#e0e9df" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="36" y1="18" x2="40" y2="32" stroke="#e0e9df" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="8" y1="32" x2="16" y2="42" stroke="#e0e9df" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="24" y1="32" x2="16" y2="42" stroke="#e0e9df" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="24" y1="32" x2="32" y2="42" stroke="#e0e9df" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="40" y1="32" x2="32" y2="42" stroke="#e0e9df" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="12" y1="18" x2="36" y2="18" stroke="#e0e9df" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
            <line x1="8" y1="32" x2="40" y2="32" stroke="#e0e9df" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
            <circle cx="24" cy="6" r="3.5" fill="#5d8a5a" stroke="#e0e9df" strokeWidth="1.5" />
            <circle cx="12" cy="18" r="3" fill="#96b593" stroke="#e0e9df" strokeWidth="1.5" />
            <circle cx="36" cy="18" r="3" fill="#96b593" stroke="#e0e9df" strokeWidth="1.5" />
            <circle cx="8" cy="32" r="2.5" fill="#c4a96a" stroke="#e0e9df" strokeWidth="1.2" />
            <circle cx="24" cy="32" r="3" fill="#96b593" stroke="#e0e9df" strokeWidth="1.5" />
            <circle cx="40" cy="32" r="2.5" fill="#c4a96a" stroke="#e0e9df" strokeWidth="1.2" />
            <circle cx="16" cy="42" r="2.5" fill="#b09352" stroke="#e0e9df" strokeWidth="1.2" />
            <circle cx="32" cy="42" r="2.5" fill="#b09352" stroke="#e0e9df" strokeWidth="1.2" />
          </svg>
          <span className="font-serif text-sm font-semibold text-white">
            Trellis
          </span>
        </div>
        <p className="mt-2 text-xs capitalize text-tan-400">
          {org?.plan || "free"} plan
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {/* Main nav */}
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const locked = item.requiresExchange && !canExchangeReferrals;
                return (
                  <li key={item.href}>
                    <Link
                      href={locked ? "/settings/billing" : item.href}
                      onClick={onClose}
                      className={linkClasses(isActive(item.href), locked)}
                    >
                      <item.icon className={iconClasses(isActive(item.href))} />
                      {item.name}
                      {locked && (
                        <span className="ml-auto w-9 min-w-max rounded-full bg-tan-700/50 px-2.5 py-0.5 text-center text-xs/5 font-medium text-tan-200">
                          PRO
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Visualize section */}
          <li>
            <div className="text-xs/6 font-semibold text-tan-400">
              Visualize
            </div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {visualizations.map((item) => {
                const hasAccess = canAccessView(item.view);
                return (
                  <li key={item.href}>
                    <Link
                      href={hasAccess ? item.href : "/settings/billing"}
                      onClick={onClose}
                      className={linkClasses(isActive(item.href), !hasAccess)}
                    >
                      <item.icon className={iconClasses(isActive(item.href))} />
                      {item.name}
                      {!hasAccess && (
                        <span className="ml-auto w-9 min-w-max rounded-full bg-tan-700/50 px-2.5 py-0.5 text-center text-xs/5 font-medium text-tan-200">
                          PRO
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Automate section */}
          <li>
            <div className="text-xs/6 font-semibold text-tan-400">
              Automate
            </div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {automateNav.map((item) => {
                const hasAccess = canAccessAutomations;
                return (
                  <li key={item.href}>
                    <Link
                      href={hasAccess ? item.href : "/settings/billing"}
                      onClick={onClose}
                      className={linkClasses(isActive(item.href), !hasAccess)}
                    >
                      <item.icon className={iconClasses(isActive(item.href))} />
                      {item.name}
                      {!hasAccess && (
                        <span className="ml-auto w-9 min-w-max rounded-full bg-tan-700/50 px-2.5 py-0.5 text-center text-xs/5 font-medium text-tan-200">
                          PRO
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* More section */}
          <li>
            <div className="text-xs/6 font-semibold text-tan-400">
              Grow
            </div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {secondaryNav.map((item) => {
                const locked =
                  (item.requiresAI && !canAccessAI) ||
                  (item.requiresImport && !canImportExport) ||
                  (item.requiresPaid && org?.plan === "free");
                return (
                  <li key={item.href}>
                    <Link
                      href={locked ? "/settings/billing" : item.href}
                      onClick={onClose}
                      className={linkClasses(isActive(item.href), locked)}
                    >
                      <item.icon className={iconClasses(isActive(item.href))} />
                      {item.name}
                      {locked && (
                        <span className="ml-auto w-9 min-w-max rounded-full bg-tan-700/50 px-2.5 py-0.5 text-center text-xs/5 font-medium text-tan-200">
                          PRO
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* User profile footer */}
          <li className="-mx-6 mt-auto">
            <Popover className="relative">
              <PopoverButton className="flex w-full items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-primary-900 focus:outline-none">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="size-8 rounded-full bg-primary-900"
                  />
                ) : (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tan-800 text-xs font-medium text-tan-200">
                    {initials}
                  </div>
                )}
                <span className="truncate">
                  {profile?.full_name || "User"}
                </span>
                <ChevronUpIcon className="ml-auto size-4 text-primary-300" />
              </PopoverButton>
              <PopoverPanel
                anchor="top start"
                className="z-50 mb-2 ml-4 w-52 rounded-xl border border-tan-800 bg-primary-900 py-1 shadow-lg"
              >
                {({ close }) => (
                  <>
                    <Link
                      href="/settings/profile"
                      onClick={() => { close(); onClose?.(); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-primary-100 hover:bg-primary-800"
                    >
                      <UserCircleIcon className="size-4" />
                      Profile
                    </Link>
                    <Link
                      href="/settings/billing"
                      onClick={() => { close(); onClose?.(); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-primary-100 hover:bg-primary-800"
                    >
                      <CreditCardIcon className="size-4" />
                      Billing
                    </Link>
                    <Link
                      href="/settings/organization"
                      onClick={() => { close(); onClose?.(); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-primary-100 hover:bg-primary-800"
                    >
                      <Cog6ToothIcon className="size-4" />
                      Settings
                    </Link>
                    <Link
                      href={canImportExport ? "/import" : "/settings/billing"}
                      onClick={() => { close(); onClose?.(); }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm hover:bg-primary-800",
                        canImportExport ? "text-primary-100" : "text-primary-100/50"
                      )}
                    >
                      <DocumentArrowDownIcon className="size-4" />
                      Import
                      {!canImportExport && (
                        <span className="ml-auto rounded-full bg-tan-700/50 px-2 py-0.5 text-[10px] font-medium text-tan-200">
                          PRO
                        </span>
                      )}
                    </Link>
                    {profile?.is_platform_admin && (
                      <>
                        <div className="my-1 border-t border-tan-800" />
                        <Link
                          href="/admin"
                          onClick={() => { close(); onClose?.(); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-tan-400 hover:bg-primary-800"
                        >
                          <ShieldCheckIcon className="size-4" />
                          Admin Panel
                        </Link>
                      </>
                    )}
                    <div className="my-1 border-t border-tan-800" />
                    <button
                      onClick={() => { close(); handleSignOut(); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-primary-800"
                    >
                      <ArrowRightStartOnRectangleIcon className="size-4" />
                      Sign out
                    </button>
                  </>
                )}
              </PopoverPanel>
            </Popover>
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
