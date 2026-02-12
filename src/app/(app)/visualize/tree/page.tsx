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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Tree View
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Trace referral chains from source to destination.
          </p>
        </div>
        <ViewSwitcher />
      </div>

      <div className="min-h-[600px] flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <TreeView />
      </div>
    </div>
  );
}
