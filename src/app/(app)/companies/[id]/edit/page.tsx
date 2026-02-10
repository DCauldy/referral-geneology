"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CompanyForm } from "@/components/companies/company-form";
import { useCompany } from "@/lib/hooks/use-companies";
import { Skeleton } from "@/components/shared/loading-skeleton";

export default function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { company, isLoading } = useCompany(id);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Companies", href: "/companies" },
          { label: "Company Detail", href: `/companies/${id}` },
          { label: "Edit" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Edit Company
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Update company information.
      </p>

      <div className="mt-6 max-w-2xl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : company ? (
          <CompanyForm
            company={company}
            onSuccess={() => router.push(`/companies/${id}`)}
          />
        ) : (
          <p className="text-sm text-red-500">Company not found.</p>
        )}
      </div>
    </div>
  );
}
