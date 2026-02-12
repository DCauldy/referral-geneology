"use client";

import { Suspense } from "react";
import { CompanyList } from "@/components/companies/company-list";

export default function CompaniesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Companies
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Manage the organizations in your network.
      </p>
      <Suspense>
        <CompanyList />
      </Suspense>
    </div>
  );
}
