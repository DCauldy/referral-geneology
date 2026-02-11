"use client";

import Link from "next/link";
import { useAchievements } from "@/lib/hooks/use-achievements";
import {
  getAchievement,
  TIER_STYLES,
  type AchievementTier,
} from "@/lib/utils/achievements";
import {
  TrophyIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils/cn";

export function AchievementsWidget() {
  const { achievements, streak, isLoading } = useAchievements();

  const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const recentThree = achievements.slice(0, 3);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <TrophyIcon className="h-4 w-4 text-yellow-500" />
          Achievements
        </h3>
        <Link
          href="/achievements"
          className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          View all
        </Link>
      </div>

      {/* Points + streak row */}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <TrophyIcon className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-bold text-zinc-900 dark:text-white">
            {totalPoints}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">pts</span>
        </div>
        {streak && streak.current_streak > 0 && (
          <div className="flex items-center gap-1.5">
            <FireIcon className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold text-zinc-900 dark:text-white">
              {streak.current_streak}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              day streak
            </span>
          </div>
        )}
      </div>

      {/* Recent achievements */}
      {recentThree.length > 0 ? (
        <div className="mt-4 space-y-2">
          {recentThree.map((a) => {
            const def = getAchievement(a.achievement_key);
            const style = TIER_STYLES[a.tier as AchievementTier];
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-100 p-2 dark:border-zinc-800"
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md",
                    style?.bg || "bg-zinc-100 dark:bg-zinc-800"
                  )}
                >
                  <TrophyIcon
                    className={cn(
                      "h-3.5 w-3.5",
                      style?.text || "text-zinc-400"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-900 dark:text-white">
                    {def?.name || a.achievement_key}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    style?.bg,
                    style?.text
                  )}
                >
                  {style?.label}
                </span>
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                  +{a.points}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Your garden of achievements is waiting to bloom. Start growing your network to earn badges.
        </p>
      )}
    </div>
  );
}
