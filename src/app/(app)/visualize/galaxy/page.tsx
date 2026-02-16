"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ViewSwitcher } from "@/components/visualizations/shared/view-switcher";
import { GalaxyView } from "@/components/visualizations/galaxy/galaxy-view";

export default function GalaxyVisualizationPage() {
  return (
    <div className="flex h-full flex-col">
      <Breadcrumbs
        items={[
          { label: "Visualize", href: "/visualize/tree" },
          { label: "Galaxy View" },
        ]}
      />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
            Galaxy View
          </h1>
          <p className="mt-1 text-sm text-primary-600/70 dark:text-primary-300/70">
            A bird&apos;s-eye view of your entire referral network.
          </p>
        </div>
        <ViewSwitcher />
      </div>

      <GalaxyView />
    </div>
  );
}
