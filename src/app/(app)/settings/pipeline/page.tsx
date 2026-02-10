"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PipelineStageEditor } from "@/components/settings/pipeline-stage-editor";

export default function PipelineSettingsPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings/profile" },
          { label: "Pipeline" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Pipeline Settings
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Configure deal stages, colors, and order.
      </p>

      <div className="mt-6 max-w-2xl">
        <PipelineStageEditor />
      </div>
    </div>
  );
}
