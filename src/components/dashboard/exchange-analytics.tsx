"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { useTrustScore } from "@/lib/hooks/use-trust-score";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/format";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";

interface ExchangePartner {
  user_id: string;
  name: string;
  org_name: string | null;
  exchange_count: number;
  accepted_count: number;
  converted_count: number;
}

interface ExchangeStats {
  total_sent: number;
  total_received: number;
  total_accepted: number;
  total_converted: number;
  unique_partners: number;
  unique_orgs: number;
  partners: ExchangePartner[];
}

function PartnerRow({ partner, rank }: { partner: ExchangePartner; rank: number }) {
  const { score } = useTrustScore(partner.user_id);

  return (
    <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-primary-50 dark:hover:bg-primary-800/50">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-800 dark:text-primary-300">
        {rank}
      </span>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600 dark:bg-primary-800 dark:text-primary-300">
        {getInitials(partner.name.split(" ")[0], partner.name.split(" ").slice(1).join(" ") || undefined)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-primary-800 dark:text-primary-100">
            {partner.name}
          </p>
          {score && score.trust_rating > 0 && (
            <span className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-medium",
              score.trust_rating >= 70 ? "text-emerald-600 dark:text-emerald-400" :
                score.trust_rating >= 40 ? "text-tan-600 dark:text-tan-400" : "text-primary-400"
            )}>
              <span className="flex h-3 w-3 items-center justify-center">{DUOTONE_ICONS.ShieldCheckIcon}</span>
              {Math.round(score.trust_rating)}
            </span>
          )}
        </div>
        {partner.org_name && (
          <p className="truncate text-xs text-primary-400">{partner.org_name}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-primary-800 dark:text-primary-100">
          {partner.exchange_count}
        </p>
        <p className="text-xs text-primary-400">exchanges</p>
      </div>
    </div>
  );
}

export function ExchangeAnalytics() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const { canExchangeReferrals } = usePlanLimits();
  const [stats, setStats] = useState<ExchangeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!org || !canExchangeReferrals) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        // Fetch all exchanges involving this org
        const [sentRes, receivedRes] = await Promise.all([
          supabase
            .from("referral_exchanges")
            .select("id, status, receiver_status, receiver_email, receiver_user_id, created_at")
            .eq("sender_org_id", org.id),
          supabase
            .from("referral_exchanges")
            .select("id, status, receiver_status, sender_user_id, sender_org_id, created_at")
            .eq("receiver_user_id", user.user.id),
        ]);

        const sent = sentRes.data || [];
        const received = receivedRes.data || [];

        // Compute partner stats from sent exchanges
        const partnerMap = new Map<string, ExchangePartner>();

        // Count unique receiver user IDs
        const uniqueReceiverIds = new Set<string>();
        sent.forEach((ex) => {
          if (ex.receiver_user_id) uniqueReceiverIds.add(ex.receiver_user_id);
        });

        // Count unique sender orgs from received
        const uniqueOrgIds = new Set<string>();
        uniqueOrgIds.add(org.id);
        received.forEach((ex) => {
          if (ex.sender_org_id) uniqueOrgIds.add(ex.sender_org_id);
        });

        // Build partner list from received exchanges (senders to us)
        for (const ex of received) {
          const key = ex.sender_user_id;
          if (!key) continue;
          const existing = partnerMap.get(key);
          if (existing) {
            existing.exchange_count++;
            if (ex.status === "accepted") existing.accepted_count++;
            if (ex.receiver_status === "converted") existing.converted_count++;
          } else {
            partnerMap.set(key, {
              user_id: key,
              name: "Network Partner",
              org_name: null,
              exchange_count: 1,
              accepted_count: ex.status === "accepted" ? 1 : 0,
              converted_count: ex.receiver_status === "converted" ? 1 : 0,
            });
          }
        }

        // Enrich partner names from user_profiles
        const partnerIds = Array.from(partnerMap.keys());
        if (partnerIds.length > 0) {
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("id, full_name")
            .in("id", partnerIds);

          profiles?.forEach((p) => {
            const partner = partnerMap.get(p.id);
            if (partner) partner.name = p.full_name || "Network Partner";
          });
        }

        const partners = Array.from(partnerMap.values())
          .sort((a, b) => b.exchange_count - a.exchange_count)
          .slice(0, 5);

        setStats({
          total_sent: sent.length,
          total_received: received.length,
          total_accepted:
            sent.filter((e) => e.status === "accepted").length +
            received.filter((e) => e.status === "accepted").length,
          total_converted:
            sent.filter((e) => e.receiver_status === "converted").length +
            received.filter((e) => e.receiver_status === "converted").length,
          unique_partners: uniqueReceiverIds.size + partnerMap.size,
          unique_orgs: uniqueOrgIds.size,
          partners,
        });
      } catch {
        // Non-critical
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [supabase, org, canExchangeReferrals]);

  if (!canExchangeReferrals) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
        <div className="h-6 w-40 animate-pulse rounded bg-primary-100 dark:bg-primary-800" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || (stats.total_sent === 0 && stats.total_received === 0)) {
    return (
      <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-800 dark:text-primary-100">
          <div className="flex h-6 w-6 items-center justify-center">
            {DUOTONE_ICONS.ArrowsRightLeftIcon}
          </div>
          Network Exchange
        </h3>
        <p className="mt-3 text-center text-sm text-primary-400 dark:text-primary-500">
          No exchange activity yet. Share referrals with other users to see your network analytics.
        </p>
        <div className="mt-3 text-center">
          <Link
            href="/directory"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Browse the directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-800 dark:text-primary-100">
          <div className="flex h-6 w-6 items-center justify-center">
            {DUOTONE_ICONS.ArrowsRightLeftIcon}
          </div>
          Network Exchange
        </h3>
        <Link
          href="/exchange"
          className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          View all
        </Link>
      </div>

      {/* Mini stats row */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {[
          { label: "Sent", value: stats.total_sent },
          { label: "Received", value: stats.total_received },
          { label: "Accepted", value: stats.total_accepted },
          { label: "Converted", value: stats.total_converted },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-serif text-lg font-bold text-primary-800 dark:text-primary-100">{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-tan-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Network reach */}
      <div className="mt-4 flex items-center gap-4 rounded-lg bg-primary-50 px-3 py-2 dark:bg-primary-800/50">
        <div className="flex h-5 w-5 items-center justify-center">
          {DUOTONE_ICONS.GlobeAltIcon}
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-primary-700 dark:text-primary-300">
            Network Reach
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-primary-600 dark:text-primary-400">
            <strong>{stats.unique_partners}</strong> partners
          </span>
          <span className="text-primary-600 dark:text-primary-400">
            <strong>{stats.unique_orgs}</strong> organizations
          </span>
        </div>
      </div>

      {/* Top exchange partners */}
      {stats.partners.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-tan-500">
            Top Exchange Partners
          </p>
          <div className="space-y-1">
            {stats.partners.map((partner, i) => (
              <PartnerRow key={partner.user_id} partner={partner} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
