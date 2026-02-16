"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";

const views = [
  { name: "Tree", href: "/visualize/tree", view: "tree" },
  { name: "Network", href: "/visualize/network", view: "network" },
  { name: "Galaxy", href: "/visualize/galaxy", view: "galaxy" },
];

export function ViewSwitcher() {
  const pathname = usePathname();
  const { canAccessView } = usePlanLimits();

  return (
    <div className="inline-flex rounded-lg border border-primary-200 bg-primary-50 p-1.5 dark:border-primary-800 dark:bg-primary-950">
      {views.map((view) => {
        const active = pathname === view.href;
        const hasAccess = canAccessView(view.view);

        if (!hasAccess) {
          return (
            <Link
              key={view.view}
              href="/settings/billing"
              className="flex items-center gap-1 rounded-md px-4 py-2 text-xs font-medium text-primary-400 dark:text-primary-600"
            >
              {view.name}
              <span className="rounded bg-tan-100 px-1 py-0.5 text-[9px] font-semibold text-tan-700 dark:bg-tan-900 dark:text-tan-300">
                PRO
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={view.view}
            href={view.href}
            className={cn(
              "rounded-md px-4 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-white text-primary-800 shadow-sm dark:bg-primary-900 dark:text-primary-100"
                : "text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-100"
            )}
          >
            {view.name}
          </Link>
        );
      })}
    </div>
  );
}
