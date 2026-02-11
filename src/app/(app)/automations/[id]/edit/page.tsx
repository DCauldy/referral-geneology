"use client";

import { use } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AutomationForm } from "@/components/automations/automation-form";
import { useAutomation } from "@/lib/hooks/use-automations";

export default function EditAutomationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { automation, isLoading } = useAutomation(id);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Automations", href: "/automations" },
          { label: "Edit Automation" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Edit Automation
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Adjust the settings for this nurture sequence.
        </p>
      </div>
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-32 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ) : automation ? (
        <AutomationForm automation={automation} />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Automation not found.
        </p>
      )}
    </div>
  );
}
