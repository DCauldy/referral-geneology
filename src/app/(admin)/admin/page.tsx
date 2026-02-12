"use client";

import { AdminKpiGrid } from "@/components/admin/admin-kpi-grid";
import { PlanDistribution } from "@/components/admin/plan-distribution";
import { RecentSignups } from "@/components/admin/recent-signups";
import { TopOrganizations } from "@/components/admin/top-organizations";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Platform Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of all platform activity and metrics.
        </p>
      </div>

      <AdminKpiGrid />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PlanDistribution />
        <TopOrganizations />
      </div>

      <RecentSignups />
    </div>
  );
}
