"use client";

import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DealForm } from "@/components/deals/deal-form";

export default function NewDealPage() {
  const router = useRouter();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Deals", href: "/deals" },
          { label: "Add Deal" },
        ]}
      />
      <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
        Add Deal
      </h1>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        Add a new deal to your pipeline.
      </p>

      <div className="mt-6 max-w-2xl">
        <DealForm onSuccess={() => router.push("/deals")} />
      </div>
    </div>
  );
}
