"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DealForm } from "@/components/deals/deal-form";
import { useDeal } from "@/lib/hooks/use-deals";
import { Skeleton } from "@/components/shared/loading-skeleton";

export default function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { deal, isLoading } = useDeal(id);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Deals", href: "/deals" },
          { label: "Deal Detail", href: `/deals/${id}` },
          { label: "Edit" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Edit Deal
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Update deal information.
      </p>

      <div className="mt-6 max-w-2xl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : deal ? (
          <DealForm
            deal={deal}
            onSuccess={() => router.push(`/deals/${id}`)}
          />
        ) : (
          <p className="text-sm text-red-500">Deal not found.</p>
        )}
      </div>
    </div>
  );
}
