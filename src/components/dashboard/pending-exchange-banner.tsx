"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { InboxIcon } from "@heroicons/react/24/outline";

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
      href="/referrals/exchange"
      className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 transition-colors hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/30 dark:hover:bg-teal-950/50"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
        <InboxIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
          {pendingCount} pending referral{pendingCount !== 1 ? "s" : ""} waiting for review
        </p>
        <p className="text-xs text-teal-600 dark:text-teal-400">
          Review and accept incoming referrals in your exchange inbox.
        </p>
      </div>
      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-teal-600 px-2 text-xs font-bold text-white">
        {pendingCount}
      </span>
    </Link>
  );
}
