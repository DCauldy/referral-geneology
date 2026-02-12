"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ViewSwitcher } from "@/components/visualizations/shared/view-switcher";
import { NetworkView } from "@/components/visualizations/network/network-view";

export default function NetworkVisualizationPage() {
  return (
    <div className="flex h-full flex-col">
      <Breadcrumbs
        items={[
          { label: "Visualize", href: "/visualize/tree" },
          { label: "Network View" },
        ]}
      />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Network View
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Explore the connections across your referral network.
          </p>
        </div>
        <ViewSwitcher />
      </div>

      <div className="min-h-[600px] flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <NetworkView />
      </div>
    </div>
  );
}
