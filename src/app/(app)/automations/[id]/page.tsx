"use client";

import { use } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AutomationDetail } from "@/components/automations/automation-detail";

export default function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Automations", href: "/automations" },
          { label: "Automation Detail" },
        ]}
      />
      <AutomationDetail automationId={id} />
    </div>
  );
}
