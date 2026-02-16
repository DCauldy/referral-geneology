"use client";

import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CompanyForm } from "@/components/companies/company-form";

export default function NewCompanyPage() {
  const router = useRouter();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Companies", href: "/companies" },
          { label: "Add Company" },
        ]}
      />
      <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
        Add Company
      </h1>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        Add a new company to your network.
      </p>

      <div className="mt-6 max-w-2xl">
        <CompanyForm onSuccess={() => router.push("/companies")} />
      </div>
    </div>
  );
}
