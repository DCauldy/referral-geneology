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
    <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900">
      {views.map((view) => {
        const active = pathname === view.href;
        const hasAccess = canAccessView(view.view);

        if (!hasAccess) {
          return (
            <Link
              key={view.view}
              href="/settings/billing"
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-600"
            >
              {view.name}
              <span className="rounded bg-zinc-200 px-1 py-0.5 text-[9px] dark:bg-zinc-800">
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
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            )}
          >
            {view.name}
          </Link>
        );
      })}
    </div>
  );
}
