"use client";

import { Suspense } from "react";
import { CompanyList } from "@/components/companies/company-list";

export default function CompaniesPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
        Companies
      </h1>
      <p className="mt-1 mb-6 text-sm text-primary-500 dark:text-primary-400">
        Manage your companies and organizations.
      </p>
      <Suspense>
        <CompanyList />
      </Suspense>
    </div>
  );
}
