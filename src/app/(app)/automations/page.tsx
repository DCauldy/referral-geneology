"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AutomationList } from "@/components/automations/automation-list";

export default function AutomationsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Automations" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Automations
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Build nurture sequences that tend your branches on autopilot.
        </p>
      </div>
      <AutomationList />
    </div>
  );
}
