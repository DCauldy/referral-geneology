"use client";

import { useEffect, useState } from "react";

interface PlanStats {
  planDistribution: { free: number; pro: number; team: number };
  totalOrgs: number;
}

const planColors: Record<string, string> = {
  free: "bg-zinc-400",
  pro: "bg-primary-600",
  team: "bg-tan-500",
};

const planLabels: Record<string, string> = {
  free: "Free",
  pro: "Pro ($29)",
  team: "Team ($79)",
};

export function PlanDistribution() {
  const [stats, setStats] = useState<PlanStats | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats({
            planDistribution: data.planDistribution,
            totalOrgs: data.totalOrgs,
          });
        }
      } catch (err) {
        console.error("Failed to load plan distribution:", err);
      }
    }
    load();
  }, []);

  if (!stats) {
    return (
      <div className="h-48 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
    );
  }

  const total = stats.totalOrgs || 1;
  const plans = Object.entries(stats.planDistribution) as [string, number][];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Plan Distribution
      </h3>

      {/* Bar chart */}
      <div className="mt-4 flex h-8 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {plans.map(([plan, count]) => {
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={plan}
              className={`${planColors[plan]} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${planLabels[plan]}: ${count}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {plans.map(([plan, count]) => {
          const pct = ((count / total) * 100).toFixed(1);
          return (
            <div key={plan} className="flex items-center gap-2">
              <div className={`size-3 rounded-full ${planColors[plan]}`} />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {planLabels[plan]}: {count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
