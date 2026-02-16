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
          <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
            Network View
          </h1>
          <p className="mt-1 text-sm text-primary-600/70 dark:text-primary-300/70">
            Explore the connections across your referral network.
          </p>
        </div>
        <ViewSwitcher />
      </div>

      <NetworkView />
    </div>
  );
}
