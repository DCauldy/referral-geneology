"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { KpiCard } from "./kpi-card";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import {
  UsersIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface OrgStats {
  total_contacts: number;
  total_companies: number;
  total_deals: number;
  total_referrals: number;
  total_deal_value: number;
  won_deal_value: number;
  pipeline_value: number;
  conversion_rate: number;
}

export function KpiGrid() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!org) return;

      // Try materialized view first, fallback to direct queries
      const { data: mvData } = await supabase
        .from("mv_org_stats")
        .select("*")
        .eq("org_id", org.id)
        .single();

      if (mvData) {
        setStats(mvData);
        setIsLoading(false);
        return;
      }

      // Fallback: direct counts
      const [contacts, companies, deals, referrals] = await Promise.all([
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("org_id", org.id),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("org_id", org.id),
        supabase.from("deals").select("id, value, status", { count: "exact" }).eq("org_id", org.id),
        supabase.from("referrals").select("id, status", { count: "exact" }).eq("org_id", org.id),
      ]);

      const dealData = deals.data || [];
      const refData = referrals.data || [];

      setStats({
        total_contacts: contacts.count || 0,
        total_companies: companies.count || 0,
        total_deals: deals.count || 0,
        total_referrals: referrals.count || 0,
        total_deal_value: dealData.reduce((sum, d) => sum + (d.value || 0), 0),
        won_deal_value: dealData.filter((d) => d.status === "won").reduce((sum, d) => sum + (d.value || 0), 0),
        pipeline_value: dealData.filter((d) => d.status === "open").reduce((sum, d) => sum + (d.value || 0), 0),
        conversion_rate:
          refData.length > 0
            ? Math.round(
                (refData.filter((r) => r.status === "converted").length / refData.length) * 100
              )
            : 0,
      });
      setIsLoading(false);
    }

    fetchStats();
  }, [supabase, org]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        title="Branches"
        value={formatNumber(stats.total_contacts)}
        icon={UsersIcon}
      />
      <KpiCard
        title="Roots"
        value={formatNumber(stats.total_companies)}
        icon={BuildingOffice2Icon}
      />
      <KpiCard
        title="New Growth"
        value={formatNumber(stats.total_referrals)}
        icon={ArrowsRightLeftIcon}
      />
      <KpiCard
        title="Grove Value"
        value={formatCurrency(stats.pipeline_value)}
        icon={CurrencyDollarIcon}
      />
      <KpiCard
        title="Harvest"
        value={formatCurrency(stats.won_deal_value)}
        icon={ArrowTrendingUpIcon}
      />
      <KpiCard
        title="Yield Rate"
        value={`${stats.conversion_rate}%`}
        icon={ChartBarIcon}
      />
    </div>
  );
}
