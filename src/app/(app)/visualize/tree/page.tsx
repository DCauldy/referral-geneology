"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ViewSwitcher } from "@/components/visualizations/shared/view-switcher";
import { TreeView } from "@/components/visualizations/tree/tree-view";

export default function TreeVisualizationPage() {
  return (
    <div className="flex h-full flex-col">
      <Breadcrumbs
        items={[
          { label: "Visualize", href: "/visualize/tree" },
          { label: "Tree View" },
        ]}
      />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
            Tree View
          </h1>
          <p className="mt-1 text-sm text-primary-600/70 dark:text-primary-300/70">
            Trace referral chains from source to destination.
          </p>
        </div>
        <ViewSwitcher />
      </div>

      <TreeView />
    </div>
  );
}
