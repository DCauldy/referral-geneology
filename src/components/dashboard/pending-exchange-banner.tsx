"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";

export function PendingExchangeBanner() {
  const supabase = useSupabase();
  const { canExchangeReferrals } = usePlanLimits();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchPending() {
      if (!canExchangeReferrals) return;

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { count } = await supabase
        .from("referral_exchanges")
        .select("id", { count: "exact", head: true })
        .eq("receiver_user_id", user.user.id)
        .eq("status", "pending");

      setPendingCount(count || 0);
    }

    fetchPending();
  }, [supabase, canExchangeReferrals]);

  if (!canExchangeReferrals || pendingCount === 0) return null;

  return (
    <Link
      href="/exchange"
      className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-5 py-3 shadow-sm transition-colors hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900 dark:hover:bg-primary-800"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-800">
        <div className="flex h-4 w-4 items-center justify-center">
          {DUOTONE_ICONS.InboxIcon}
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-primary-800 dark:text-primary-100">
          {pendingCount} pending referral{pendingCount !== 1 ? "s" : ""} waiting for review
        </p>
        <p className="text-xs text-primary-500 dark:text-primary-400">
          Review and accept incoming referrals in your exchange inbox.
        </p>
      </div>
      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-500 px-2 text-xs font-bold text-white">
        {pendingCount}
      </span>
    </Link>
  );
}
