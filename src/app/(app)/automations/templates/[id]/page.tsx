"use client";

import { use } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmailTemplateDetail } from "@/components/automations/email-template-detail";

export default function TemplateDetailPage({
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
          { label: "Templates", href: "/automations/templates" },
          { label: "Template Detail" },
        ]}
      />
      <EmailTemplateDetail templateId={id} />
    </div>
  );
}
