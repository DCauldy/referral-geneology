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
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Add Company
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Plant new roots in your network.
      </p>

      <div className="mt-6 max-w-2xl">
        <CompanyForm onSuccess={() => router.push("/companies")} />
      </div>
    </div>
  );
}
