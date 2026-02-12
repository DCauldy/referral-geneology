"use client";

import { use } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmailTemplateForm } from "@/components/automations/email-template-form";
import { useEmailTemplate } from "@/lib/hooks/use-email-templates";

export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { template, isLoading } = useEmailTemplate(id);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Automations", href: "/automations" },
          { label: "Templates", href: "/automations/templates" },
          { label: "Edit Template" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Edit Template
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Edit this email template.
        </p>
      </div>
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ) : template ? (
        <EmailTemplateForm template={template} />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Template not found.
        </p>
      )}
    </div>
  );
}
