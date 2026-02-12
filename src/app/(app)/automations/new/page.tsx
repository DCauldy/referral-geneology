"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AutomationForm } from "@/components/automations/automation-form";

export default function NewAutomationPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Automations", href: "/automations" },
          { label: "New Automation" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          New Automation
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Set up a new automation sequence.
        </p>
      </div>
      <AutomationForm />
    </div>
  );
}
