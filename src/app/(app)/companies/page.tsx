"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CompanyList } from "@/components/companies/company-list";

export default function CompaniesPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Companies" }]} />
      <CompanyList />
    </div>
  );
}
