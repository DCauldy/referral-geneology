"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { getInitials, getFullName, formatCurrency } from "@/lib/utils/format";

interface TopReferrer {
  id: string;
  first_name: string;
  last_name: string | null;
  referral_score: number;
  lifetime_referral_value: number;
  referral_count: number;
}

export function TopReferrers() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [referrers, setReferrers] = useState<TopReferrer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTopReferrers() {
      if (!org) return;

      // Get contacts with highest referral scores
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, referral_score, lifetime_referral_value")
        .eq("org_id", org.id)
        .gt("referral_score", 0)
        .order("referral_score", { ascending: false })
        .limit(5);

      if (!contacts || contacts.length === 0) {
        setReferrers([]);
        setIsLoading(false);
        return;
      }

      // Get referral counts
      const { data: referralCounts } = await supabase
        .from("referrals")
        .select("referrer_id")
        .eq("org_id", org.id)
        .in(
          "referrer_id",
          contacts.map((c) => c.id)
        );

      const countMap = new Map<string, number>();
      referralCounts?.forEach((r) => {
        countMap.set(r.referrer_id, (countMap.get(r.referrer_id) || 0) + 1);
      });

      setReferrers(
        contacts.map((c) => ({
          ...c,
          referral_count: countMap.get(c.id) || 0,
        }))
      );
      setIsLoading(false);
    }

    fetchTopReferrers();
  }, [supabase, org]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (referrers.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No referrers yet. Create referrals to see top referrers.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {referrers.map((referrer, index) => (
        <Link
          key={referrer.id}
          href={`/contacts/${referrer.id}`}
          className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            {index + 1}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {getInitials(referrer.first_name, referrer.last_name || undefined)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
              {getFullName(referrer.first_name, referrer.last_name || undefined)}
            </p>
            <p className="text-xs text-zinc-500">
              {referrer.referral_count} referrals
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {formatCurrency(referrer.lifetime_referral_value)}
            </p>
            <p className="text-xs text-zinc-500">Score: {referrer.referral_score}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
