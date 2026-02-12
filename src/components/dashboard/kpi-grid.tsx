"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { KpiCard } from "./kpi-card";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import {
  UsersIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  PaperAirplaneIcon,
  InboxIcon,
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

interface ExchangeStats {
  seeds_shared: number;
  seeds_received: number;
  cross_network_yield: number;
}

export function KpiGrid() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const { canExchangeReferrals } = usePlanLimits();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [exchangeStats, setExchangeStats] = useState<ExchangeStats | null>(null);
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
      // Fetch exchange stats if on paid plan
      if (canExchangeReferrals) {
        try {
          const { data: user } = await supabase.auth.getUser();
          if (user.user) {
            const [sentRes, receivedRes] = await Promise.all([
              supabase
                .from("referral_exchanges")
                .select("id, status", { count: "exact" })
                .eq("sender_org_id", org.id),
              supabase
                .from("referral_exchanges")
                .select("id, status", { count: "exact" })
                .eq("receiver_user_id", user.user.id),
            ]);

            const sent = sentRes.data || [];
            const received = receivedRes.data || [];
            const acceptedReceived = received.filter((r) => r.status === "accepted").length;

            setExchangeStats({
              seeds_shared: sent.length,
              seeds_received: received.length,
              cross_network_yield:
                received.length > 0
                  ? Math.round((acceptedReceived / received.length) * 100)
                  : 0,
            });
          }
        } catch {
          // Exchange stats are non-critical
        }
      }

      setIsLoading(false);
    }

    fetchStats();
  }, [supabase, org, canExchangeReferrals]);

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
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Contacts"
          value={formatNumber(stats.total_contacts)}
          icon={UsersIcon}
        />
        <KpiCard
          title="Companies"
          value={formatNumber(stats.total_companies)}
          icon={BuildingOffice2Icon}
        />
        <KpiCard
          title="Referrals"
          value={formatNumber(stats.total_referrals)}
          icon={ArrowsRightLeftIcon}
        />
        <KpiCard
          title="Pipeline"
          value={formatCurrency(stats.pipeline_value)}
          icon={CurrencyDollarIcon}
        />
        <KpiCard
          title="Won Revenue"
          value={formatCurrency(stats.won_deal_value)}
          icon={ArrowTrendingUpIcon}
        />
        <KpiCard
          title="Conversion Rate"
          value={`${stats.conversion_rate}%`}
          icon={ChartBarIcon}
        />
      </div>

      {canExchangeReferrals && exchangeStats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="Referrals Shared"
            value={formatNumber(exchangeStats.seeds_shared)}
            icon={PaperAirplaneIcon}
          />
          <KpiCard
            title="Referrals Received"
            value={formatNumber(exchangeStats.seeds_received)}
            icon={InboxIcon}
          />
          <KpiCard
            title="Exchange Conversion"
            value={`${exchangeStats.cross_network_yield}%`}
            icon={ArrowsRightLeftIcon}
          />
        </div>
      )}
    </div>
  );
}
