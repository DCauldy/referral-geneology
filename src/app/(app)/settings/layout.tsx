"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { name: "Profile", href: "/settings/profile" },
  { name: "Organization", href: "/settings/organization" },
  { name: "Team", href: "/settings/team" },
  { name: "Pipeline", href: "/settings/pipeline" },
  { name: "Billing", href: "/settings/billing" },
  { name: "Import / Export", href: "/settings/import-export" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6">
      <h1 className="sr-only">Settings</h1>

      {/* Tab navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav
          className="flex overflow-x-auto px-4 sm:px-6 lg:px-8"
          aria-label="Settings tabs"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 border-b-2 px-4 py-4 text-sm font-medium whitespace-nowrap",
                pathname === tab.href
                  ? "border-primary-500 text-zinc-900 dark:text-white"
                  : "border-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-700 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
