"use client";

import { use } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CompanyDetail } from "@/components/companies/company-detail";

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Companies", href: "/companies" },
          { label: "Company Detail" },
        ]}
      />
      <CompanyDetail companyId={id} />
    </div>
  );
}
