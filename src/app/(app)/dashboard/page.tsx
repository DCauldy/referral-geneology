"use client";

import { useEffect, useRef } from "react";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TopReferrers } from "@/components/dashboard/top-referrers";
import { ExchangeAnalytics } from "@/components/dashboard/exchange-analytics";
import { PendingExchangeBanner } from "@/components/dashboard/pending-exchange-banner";
import { AchievementsWidget } from "@/components/dashboard/achievements-widget";
import { useAchievements } from "@/lib/hooks/use-achievements";
import { getAchievement } from "@/lib/utils/achievements";
import { useToast } from "@/components/providers/toast-provider";

export default function DashboardPage() {
  const { checkAchievements } = useAchievements();
  const toast = useToast();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    checkAchievements().then((newlyUnlocked) => {
      for (const unlock of newlyUnlocked) {
        const def = getAchievement(unlock.achievement_key);
        toast.achievement(
          def?.name || unlock.achievement_key,
          `${def?.description || "New achievement unlocked!"} (+${unlock.points} pts)`
        );
      }
    });
  }, [checkAchievements, toast]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        Your network at a glance. Contacts, companies, deals, and referrals all in one place.
      </p>

      <div className="mt-6 space-y-4">
        <PendingExchangeBanner />
        <KpiGrid />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <RecentActivity />
        </div>
        <div className="space-y-6">
          <TopReferrers />
          <ExchangeAnalytics />
          <AchievementsWidget />
        </div>
      </div>
    </div>
  );
}
