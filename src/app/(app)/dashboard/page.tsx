"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TopReferrers } from "@/components/dashboard/top-referrers";

export default function DashboardPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard" }]} />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        A canopy view of your tree — branches, roots, fruit, and new growth at a glance.
      </p>

      <div className="mt-6">
        <KpiGrid />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <TopReferrers />
      </div>
    </div>
  );
}
