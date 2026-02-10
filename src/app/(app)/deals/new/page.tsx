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
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Add Deal
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Create a new deal in your pipeline.
      </p>

      <div className="mt-6 max-w-2xl">
        <DealForm onSuccess={() => router.push("/deals")} />
      </div>
    </div>
  );
}
