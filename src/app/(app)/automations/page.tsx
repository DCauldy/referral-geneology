"use client";

import { AutomationList } from "@/components/automations/automation-list";

export default function AutomationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Automations
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Build automated sequences to engage your contacts.
        </p>
      </div>
      <AutomationList />
    </div>
  );
}
