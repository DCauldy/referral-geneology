"use client";

import { use } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DealDetail } from "@/components/deals/deal-detail";

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Deals", href: "/deals" },
          { label: "Deal Detail" },
        ]}
      />
      <DealDetail dealId={id} />
    </div>
  );
}
