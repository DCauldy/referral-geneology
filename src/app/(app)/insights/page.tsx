"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { InsightList } from "@/components/insights/insight-list";

export default function InsightsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "AI Insights" }]} />
      <InsightList />
    </div>
  );
}
