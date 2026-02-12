"use client";

import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmailTemplateList } from "@/components/automations/email-template-list";

export default function TemplatesPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Automations", href: "/automations" },
          { label: "Templates" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Templates
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Craft and manage your email templates.
        </p>
      </div>
      <Suspense>
        <EmailTemplateList />
      </Suspense>
    </div>
  );
}
