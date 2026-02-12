"use client";

import Link from "next/link";
import { useAchievements } from "@/lib/hooks/use-achievements";
import {
  getAchievement,
  TIER_STYLES,
  type AchievementTier,
} from "@/lib/utils/achievements";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";
import { cn } from "@/lib/utils/cn";

const TIER_DOT_COLORS: Record<AchievementTier, string> = {
  bronze: "bg-tan-600",
  silver: "bg-zinc-400 dark:bg-zinc-300",
  gold: "bg-tan-400",
};

export function AchievementsWidget() {
  const { achievements, streak, isLoading } = useAchievements();

  const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const recentThree = achievements.slice(0, 3);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
        <div className="h-6 w-32 animate-pulse rounded bg-primary-100 dark:bg-primary-800" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-800 dark:text-primary-100">
          <div className="flex h-6 w-6 items-center justify-center">
            {DUOTONE_ICONS.TrophyIcon}
          </div>
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
          <div className="flex h-4 w-4 items-center justify-center">
            {DUOTONE_ICONS.TrophyIcon}
          </div>
          <span className="text-sm font-bold text-primary-800 dark:text-primary-100">
            {totalPoints}
          </span>
          <span className="text-xs text-primary-400">pts</span>
        </div>
        {streak && streak.current_streak > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex h-4 w-4 items-center justify-center">
              {DUOTONE_ICONS.FireIcon}
            </div>
            <span className="text-sm font-bold text-primary-800 dark:text-primary-100">
              {streak.current_streak}
            </span>
            <span className="text-xs text-primary-400">
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
            const tier = a.tier as AchievementTier;
            const style = TIER_STYLES[tier];
            const icon = def ? DUOTONE_ICONS[def.icon] : DUOTONE_ICONS.TrophyIcon;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-primary-100 p-2 dark:border-primary-800"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-50 dark:bg-primary-800">
                  <div className="flex h-4 w-4 items-center justify-center">
                    {icon}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-primary-800 dark:text-primary-100">
                    {def?.name || a.achievement_key}
                  </p>
                </div>
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    TIER_DOT_COLORS[tier] || "bg-primary-300"
                  )}
                  title={style?.label}
                />
                <span className="text-xs font-medium text-tan-600 dark:text-tan-400">
                  +{a.points}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-primary-400 dark:text-primary-500">
          No achievements yet. Start planting vines to earn your first badge.
        </p>
      )}
    </div>
  );
}
