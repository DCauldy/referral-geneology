"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { useTrustScore } from "@/lib/hooks/use-trust-score";
import { cn } from "@/lib/utils/cn";
import { formatNumber, getInitials } from "@/lib/utils/format";
import {
  ChartBarIcon,
  ArrowsRightLeftIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface MonthlyVolume {
  month: string;
  sent: number;
  received: number;
}

interface IndustryBreakdown {
  industry: string;
  count: number;
}

interface PartnerStats {
  user_id: string;
  name: string;
  total: number;
  accepted: number;
  converted: number;
}

interface ReportData {
  totalExchanges: number;
  totalSent: number;
  totalReceived: number;
  totalAccepted: number;
  totalConverted: number;
  totalDeclined: number;
  acceptanceRate: number;
  conversionRate: number;
  uniquePartners: number;
  uniqueOrgs: number;
  monthlyVolume: MonthlyVolume[];
  industryBreakdown: IndustryBreakdown[];
  topPartners: PartnerStats[];
}

function StatCard({
  label,
  value,
  subLabel,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary-50 p-2 dark:bg-primary-950">
          <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
          {subLabel && (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{subLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FunnelBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-900 dark:text-white">
          {value} ({Math.round(pct)}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
    </div>
  );
}

function PartnerRow({ partner, rank }: { partner: PartnerStats; rank: number }) {
  const { score } = useTrustScore(partner.user_id);

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
        {rank}
      </span>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
        {getInitials(partner.name.split(" ")[0], partner.name.split(" ").slice(1).join(" ") || undefined)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
            {partner.name}
          </p>
          {score && score.trust_rating > 0 && (
            <span className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-medium",
              score.trust_rating >= 70 ? "text-emerald-600 dark:text-emerald-400" :
                score.trust_rating >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-zinc-400"
            )}>
              <ShieldCheckIcon className="h-3 w-3" />
              {Math.round(score.trust_rating)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-zinc-500">{partner.total} total</span>
        <span className="text-green-600 dark:text-green-400">{partner.accepted} accepted</span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          {partner.converted} converted
        </span>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const { canExchangeReferrals } = usePlanLimits();
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      if (!org) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        // Fetch all exchanges
        const [sentRes, receivedRes] = await Promise.all([
          supabase
            .from("referral_exchanges")
            .select("id, status, receiver_status, receiver_user_id, receiver_email, contact_snapshot, created_at")
            .eq("sender_org_id", org.id),
          supabase
            .from("referral_exchanges")
            .select("id, status, receiver_status, sender_user_id, sender_org_id, contact_snapshot, created_at")
            .eq("receiver_user_id", user.user.id),
        ]);

        const sent = sentRes.data || [];
        const received = receivedRes.data || [];
        const all = [...sent, ...received];

        const totalAccepted = all.filter((e) => e.status === "accepted").length;
        const totalConverted = all.filter((e) => e.receiver_status === "converted").length;
        const totalDeclined = all.filter((e) => e.status === "declined").length;

        // Monthly volume (last 6 months)
        const monthlyMap = new Map<string, { sent: number; received: number }>();
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toISOString().slice(0, 7);
          monthlyMap.set(key, { sent: 0, received: 0 });
        }
        sent.forEach((e) => {
          const key = e.created_at.slice(0, 7);
          const entry = monthlyMap.get(key);
          if (entry) entry.sent++;
        });
        received.forEach((e) => {
          const key = e.created_at.slice(0, 7);
          const entry = monthlyMap.get(key);
          if (entry) entry.received++;
        });
        const monthlyVolume = Array.from(monthlyMap.entries()).map(([month, v]) => ({
          month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          ...v,
        }));

        // Industry breakdown from contact snapshots
        const industryMap = new Map<string, number>();
        all.forEach((e) => {
          const snapshot = e.contact_snapshot as { industry?: string } | null;
          const ind = snapshot?.industry || "Unknown";
          industryMap.set(ind, (industryMap.get(ind) || 0) + 1);
        });
        const industryBreakdown = Array.from(industryMap.entries())
          .map(([industry, count]) => ({ industry, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        // Unique partners
        const partnerIds = new Set<string>();
        const orgIds = new Set<string>();
        orgIds.add(org.id);
        sent.forEach((e) => {
          if (e.receiver_user_id) partnerIds.add(e.receiver_user_id);
        });
        received.forEach((e) => {
          if (e.sender_user_id) partnerIds.add(e.sender_user_id);
          if (e.sender_org_id) orgIds.add(e.sender_org_id);
        });

        // Top partners from received exchanges
        const partnerStatsMap = new Map<string, PartnerStats>();
        received.forEach((e) => {
          const pid = e.sender_user_id;
          if (!pid) return;
          const existing = partnerStatsMap.get(pid);
          if (existing) {
            existing.total++;
            if (e.status === "accepted") existing.accepted++;
            if (e.receiver_status === "converted") existing.converted++;
          } else {
            partnerStatsMap.set(pid, {
              user_id: pid,
              name: "Network Partner",
              total: 1,
              accepted: e.status === "accepted" ? 1 : 0,
              converted: e.receiver_status === "converted" ? 1 : 0,
            });
          }
        });

        // Enrich names
        const pids = Array.from(partnerStatsMap.keys());
        if (pids.length > 0) {
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("id, full_name")
            .in("id", pids);
          profiles?.forEach((p) => {
            const ps = partnerStatsMap.get(p.id);
            if (ps) ps.name = p.full_name || "Network Partner";
          });
        }

        const topPartners = Array.from(partnerStatsMap.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        setData({
          totalExchanges: all.length,
          totalSent: sent.length,
          totalReceived: received.length,
          totalAccepted,
          totalConverted,
          totalDeclined,
          acceptanceRate: all.length > 0 ? Math.round((totalAccepted / all.length) * 100) : 0,
          conversionRate: totalAccepted > 0 ? Math.round((totalConverted / totalAccepted) * 100) : 0,
          uniquePartners: partnerIds.size,
          uniqueOrgs: orgIds.size,
          monthlyVolume,
          industryBreakdown,
          topPartners,
        });
      } catch {
        // Non-critical
      } finally {
        setIsLoading(false);
      }
    }

    fetchReportData();
  }, [supabase, org]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Reports
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Measure the reach and impact of your referral network.
      </p>

      {isLoading ? (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
          ))}
        </div>
      ) : !data || data.totalExchanges === 0 ? (
        <div className="mt-6 space-y-6">
          {/* Basic org stats */}
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
            <ChartBarIcon className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-white">
              {canExchangeReferrals
                ? "No exchange data yet"
                : "Upgrade to unlock network reports"}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {canExchangeReferrals
                ? "Start sharing referrals with other users to see your network reports come to life."
                : "Network reports show exchange analytics, partner leaderboards, and conversion funnels."}
            </p>
            {canExchangeReferrals ? (
              <Link
                href="/directory"
                className="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                Browse Directory
              </Link>
            ) : (
              <Link
                href="/settings/billing"
                className="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Exchanges"
              value={formatNumber(data.totalExchanges)}
              subLabel={`${data.totalSent} sent, ${data.totalReceived} received`}
              icon={ArrowsRightLeftIcon}
            />
            <StatCard
              label="Network Reach"
              value={`${data.uniquePartners} partners`}
              subLabel={`Across ${data.uniqueOrgs} organizations`}
              icon={GlobeAltIcon}
            />
            <StatCard
              label="Acceptance Rate"
              value={`${data.acceptanceRate}%`}
              subLabel={`${data.totalAccepted} of ${data.totalExchanges} exchanges`}
              icon={CheckCircleIcon}
            />
            <StatCard
              label="Conversion Rate"
              value={`${data.conversionRate}%`}
              subLabel={`${data.totalConverted} converted from ${data.totalAccepted} accepted`}
              icon={ArrowTrendingUpIcon}
            />
          </div>

          {/* Two-column layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Conversion Funnel */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Exchange Funnel
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                How referrals progress through the exchange pipeline
              </p>
              <div className="mt-4 space-y-3">
                <FunnelBar
                  label="Total Sent"
                  value={data.totalSent}
                  total={data.totalExchanges}
                  color="bg-blue-500"
                />
                <FunnelBar
                  label="Total Received"
                  value={data.totalReceived}
                  total={data.totalExchanges}
                  color="bg-indigo-500"
                />
                <FunnelBar
                  label="Accepted"
                  value={data.totalAccepted}
                  total={data.totalExchanges}
                  color="bg-green-500"
                />
                <FunnelBar
                  label="Declined"
                  value={data.totalDeclined}
                  total={data.totalExchanges}
                  color="bg-red-400"
                />
                <FunnelBar
                  label="Converted"
                  value={data.totalConverted}
                  total={data.totalExchanges}
                  color="bg-emerald-500"
                />
              </div>
            </div>

            {/* Monthly Volume */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Monthly Volume
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Exchange activity over the last 6 months
              </p>
              <div className="mt-4 space-y-2">
                {data.monthlyVolume.map((m) => {
                  const total = m.sent + m.received;
                  const maxVolume = Math.max(
                    ...data.monthlyVolume.map((v) => v.sent + v.received),
                    1
                  );
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {m.month}
                      </span>
                      <div className="flex-1">
                        <div className="flex h-5 overflow-hidden rounded-md">
                          {m.sent > 0 && (
                            <div
                              className="bg-blue-400 dark:bg-blue-500"
                              style={{ width: `${(m.sent / maxVolume) * 100}%` }}
                              title={`${m.sent} sent`}
                            />
                          )}
                          {m.received > 0 && (
                            <div
                              className="bg-teal-400 dark:bg-teal-500"
                              style={{ width: `${(m.received / maxVolume) * 100}%` }}
                              title={`${m.received} received`}
                            />
                          )}
                          {total === 0 && (
                            <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800" />
                          )}
                        </div>
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-medium text-zinc-900 dark:text-white">
                        {total}
                      </span>
                    </div>
                  );
                })}
                <div className="mt-2 flex items-center gap-4 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm bg-blue-400" /> Sent
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm bg-teal-400" /> Received
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Partners */}
            {data.topPartners.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Top Exchange Partners
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Partners you exchange the most referrals with
                </p>
                <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.topPartners.map((partner, i) => (
                    <PartnerRow key={partner.user_id} partner={partner} rank={i + 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Industry Breakdown */}
            {data.industryBreakdown.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Industries by Exchange Volume
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Which industries your network exchanges touch most
                </p>
                <div className="mt-4 space-y-2">
                  {data.industryBreakdown.map((ind) => {
                    const maxCount = data.industryBreakdown[0]?.count || 1;
                    return (
                      <div key={ind.industry} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 truncate text-xs text-zinc-600 dark:text-zinc-400">
                          {ind.industry}
                        </span>
                        <div className="flex-1">
                          <div className="h-4 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-md bg-primary-400 dark:bg-primary-500"
                              style={{ width: `${(ind.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-6 shrink-0 text-right text-xs font-medium text-zinc-900 dark:text-white">
                          {ind.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
