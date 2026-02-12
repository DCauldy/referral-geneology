"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { getInitials, getFullName, formatCurrency } from "@/lib/utils/format";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";

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
      <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
        <div className="h-6 w-32 animate-pulse rounded bg-primary-100 dark:bg-primary-800" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-800 dark:text-primary-100">
        <div className="flex h-6 w-6 items-center justify-center">
          {DUOTONE_ICONS.StarIcon}
        </div>
        Top Referrers
      </h3>

      {referrers.length === 0 ? (
        <p className="mt-4 text-center text-sm text-primary-400 dark:text-primary-500">
          No top referrers yet. Create referrals to see who drives the most value.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {referrers.map((referrer, index) => (
            <Link
              key={referrer.id}
              href={`/contacts/${referrer.id}`}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-primary-50 dark:hover:bg-primary-800/50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-800 dark:text-primary-300">
                {index + 1}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600 dark:bg-primary-800 dark:text-primary-300">
                {getInitials(referrer.first_name, referrer.last_name || undefined)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-primary-800 dark:text-primary-100">
                  {getFullName(referrer.first_name, referrer.last_name || undefined)}
                </p>
                <p className="text-xs text-primary-400">
                  {referrer.referral_count} referrals
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary-800 dark:text-primary-100">
                  {formatCurrency(referrer.lifetime_referral_value)}
                </p>
                <p className="text-xs text-primary-400">Score: {referrer.referral_score}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
