"use client";

import { SettingsSection } from "@/components/settings/settings-section";
import { PipelineStageEditor } from "@/components/settings/pipeline-stage-editor";

export default function PipelineSettingsPage() {
  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      <SettingsSection
        title="Pipeline Stages"
        description="Configure the stages that deals move through in your pipeline."
      >
        <PipelineStageEditor />
      </SettingsSection>
    </div>
  );
}
