"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmailTemplateForm } from "@/components/automations/email-template-form";

export default function NewTemplatePage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Automations", href: "/automations" },
          { label: "Templates", href: "/automations/templates" },
          { label: "New Template" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          New Template
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Create a new email template.
        </p>
      </div>
      <EmailTemplateForm />
    </div>
  );
}
