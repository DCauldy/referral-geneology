"use client";

import { useAchievements } from "@/lib/hooks/use-achievements";
import {
  ACHIEVEMENT_DEFINITIONS,
  CATEGORY_LABELS,
  TIER_STYLES,
  getHighestEarnedTier,
  getNextTier,
  getProgressPercent,
  getMaxPossiblePoints,
  type AchievementCategory,
  type AchievementDef,
  type AchievementTier,
} from "@/lib/utils/achievements";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { cn } from "@/lib/utils/cn";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";
import type { UserAchievement } from "@/types/database";

const TIER_ORDER: AchievementTier[] = ["bronze", "silver", "gold"];

const TIER_COLORS: Record<
  AchievementTier,
  { filled: string; empty: string; ring: string }
> = {
  bronze: {
    filled: "bg-tan-600",
    empty: "bg-tan-200 dark:bg-tan-900/40",
    ring: "ring-tan-500",
  },
  silver: {
    filled: "bg-zinc-400 dark:bg-zinc-300",
    empty: "bg-zinc-200 dark:bg-zinc-700",
    ring: "ring-zinc-400",
  },
  gold: {
    filled: "bg-tan-400",
    empty: "bg-tan-100 dark:bg-tan-900/40",
    ring: "ring-tan-400",
  },
};

function getProgressValue(
  def: AchievementDef,
  progress: Record<string, number | boolean> | null
): number {
  if (!progress) return 0;
  const map: Record<string, string> = {
    first_branch: "contacts",
    first_root: "companies",
    first_fruit: "deals",
    first_growth: "referrals",
    seedling: "onboarding_completed",
    branch_collector: "contacts",
    root_system: "companies",
    abundant_harvest: "won_revenue",
    fruit_bearer: "won_deals",
    growth_spreader: "referrals",
    fruitful_growth: "converted_referrals",
    master_grower: "converted_referrals",
    growth_logger: "activities",
    auto_cultivator: "automations",
    orchard_oracle: "insights",
    steady_grower: "activities",
    seed_sower: "contacts",
    seed_collector: "contacts",
    cross_pollinator: "contacts",
    trusted_grower: "trust_rating",
  };
  const key = map[def.key];
  if (!key) return 0;
  const val = progress[key];
  return typeof val === "boolean" ? (val ? 1 : 0) : (val as number) || 0;
}

function TierDots({
  def,
  earned,
}: {
  def: AchievementDef;
  earned: UserAchievement[];
}) {
  const earnedTiers = new Set(
    earned
      .filter((e) => e.achievement_key === def.key)
      .map((e) => e.tier as AchievementTier)
  );

  if (def.tiers.length === 1) {
    const tier = def.tiers[0].tier;
    const isEarned = earnedTiers.has(tier);
    return (
      <div className="flex items-center gap-1">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-all",
            isEarned
              ? cn(
                  TIER_COLORS[tier].filled,
                  "ring-2",
                  TIER_COLORS[tier].ring,
                  "ring-offset-1 ring-offset-white dark:ring-offset-primary-900"
                )
              : TIER_COLORS[tier].empty
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {TIER_ORDER.map((tier) => {
        const hasTier = def.tiers.some((t) => t.tier === tier);
        if (!hasTier) return null;
        const isEarned = earnedTiers.has(tier);
        return (
          <div
            key={tier}
            title={`${TIER_STYLES[tier].label}${isEarned ? " (earned)" : ""}`}
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-all",
              isEarned
                ? cn(
                    TIER_COLORS[tier].filled,
                    "ring-2",
                    TIER_COLORS[tier].ring,
                    "ring-offset-1 ring-offset-white dark:ring-offset-primary-900"
                  )
                : TIER_COLORS[tier].empty
            )}
          />
        );
      })}
    </div>
  );
}

function AchievementCard({
  def,
  earned,
  progress,
  isExchangeLocked,
}: {
  def: AchievementDef;
  earned: UserAchievement[];
  progress: Record<string, number | boolean> | null;
  isExchangeLocked: boolean;
}) {
  const highestTier = getHighestEarnedTier(
    def.key,
    earned as { achievement_key: string; tier: AchievementTier }[]
  );
  const isUnlocked = highestTier !== null;
  const locked = def.requiresPaid && isExchangeLocked;
  const currentValue = getProgressValue(def, progress);
  const pct = getProgressPercent(def, currentValue, highestTier);
  const next = getNextTier(def, highestTier);
  const isFullyComplete = isUnlocked && !next;

  const earnedTierCount = earned.filter(
    (e) => e.achievement_key === def.key
  ).length;
  const totalTierCount = def.tiers.length;

  const icon = locked
    ? DUOTONE_ICONS.LockClosedIcon
    : DUOTONE_ICONS[def.icon] || DUOTONE_ICONS.TrophyIcon;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border p-5 transition-all",
        locked
          ? "border-primary-100 bg-primary-50/30 opacity-60 dark:border-primary-800/50 dark:bg-primary-950/30"
          : isFullyComplete
            ? "border-tan-300 bg-white shadow-sm dark:border-tan-700/50 dark:bg-primary-900"
            : isUnlocked
              ? "border-primary-200 bg-white shadow-sm dark:border-primary-800 dark:bg-primary-900"
              : "border-primary-100 bg-white dark:border-primary-800/50 dark:bg-primary-900/80"
      )}
    >
      {/* Top row: icon + tier dots */}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
            locked
              ? "bg-primary-100/50 dark:bg-primary-800/30"
              : "bg-primary-50 dark:bg-primary-800"
          )}
        >
          {icon}
        </div>
        <div className="flex items-center gap-2">
          {locked && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              PRO
            </span>
          )}
          {!locked && <TierDots def={def} earned={earned} />}
        </div>
      </div>

      {/* Name + description */}
      <h3 className="mt-3 text-sm font-semibold text-primary-800 dark:text-primary-100">
        {def.name}
      </h3>
      <p className="mt-1 text-xs text-primary-400 dark:text-primary-500">
        {def.description}
      </p>

      {/* Tier progress summary */}
      {!locked && totalTierCount > 1 && (
        <p className="mt-2 text-[10px] font-medium text-primary-300 dark:text-primary-600">
          {earnedTierCount} / {totalTierCount} tiers
        </p>
      )}

      {/* Progress bar */}
      {!locked && next && (
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between text-[10px] text-primary-400 dark:text-primary-500">
            <span>
              {typeof currentValue === "number" && currentValue >= 1000
                ? `${(currentValue / 1000).toFixed(1)}K`
                : currentValue}
              {" / "}
              {next.threshold >= 1000
                ? `${(next.threshold / 1000).toFixed(0)}K`
                : next.threshold}
            </span>
            <span className={cn("font-medium", TIER_STYLES[next.tier].text)}>
              {TIER_STYLES[next.tier].label}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-primary-100 dark:bg-primary-800">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                next.tier === "gold"
                  ? "bg-tan-400"
                  : next.tier === "silver"
                    ? "bg-zinc-400"
                    : "bg-tan-600"
              )}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* All tiers complete */}
      {!locked && isFullyComplete && (
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-tan-400" />
            <p className="text-[10px] font-semibold text-tan-600 dark:text-tan-400">
              Fully cultivated
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AchievementsPage() {
  const { achievements, streak, progress, isLoading } = useAchievements();
  const { isFreePlan } = usePlanLimits();

  const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const maxPoints = getMaxPossiblePoints();
  const totalUnlocked = achievements.length;
  const totalPossible = ACHIEVEMENT_DEFINITIONS.reduce(
    (sum, def) => sum + def.tiers.length,
    0
  );

  const fullyCompleted = ACHIEVEMENT_DEFINITIONS.filter((def) => {
    const earnedTiers = achievements.filter(
      (a) => a.achievement_key === def.key
    );
    return earnedTiers.length === def.tiers.length;
  }).length;

  const categories = Object.keys(CATEGORY_LABELS) as AchievementCategory[];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-primary-100 dark:bg-primary-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[200px] animate-pulse rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
          Achievements
        </h1>
        <p className="mt-1 text-sm text-primary-400 dark:text-primary-500">
          Earn bronze, silver, and gold as your network grows.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Points */}
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-white p-5 shadow-sm dark:border-primary-800 dark:bg-primary-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 shadow-sm dark:bg-primary-800">
            {DUOTONE_ICONS.TrophyIcon}
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
              {totalPoints}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">
              Total Points
            </p>
          </div>
        </div>

        {/* Tiers Unlocked */}
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-white p-5 shadow-sm dark:border-primary-800 dark:bg-primary-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 shadow-sm dark:bg-primary-800">
            {DUOTONE_ICONS.CheckCircleIcon}
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
              {totalUnlocked}
              <span className="text-sm font-normal text-primary-300">
                {" "}
                / {totalPossible}
              </span>
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">
              Tiers Unlocked
            </p>
          </div>
        </div>

        {/* Fully Completed */}
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-white p-5 shadow-sm dark:border-primary-800 dark:bg-primary-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 shadow-sm dark:bg-primary-800">
            {DUOTONE_ICONS.StarIcon}
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
              {fullyCompleted}
              <span className="text-sm font-normal text-primary-300">
                {" "}
                / {ACHIEVEMENT_DEFINITIONS.length}
              </span>
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">
              Fully Cultivated
            </p>
          </div>
        </div>

        {/* Day Streak */}
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-white p-5 shadow-sm dark:border-primary-800 dark:bg-primary-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 shadow-sm dark:bg-primary-800">
            {DUOTONE_ICONS.FireIcon}
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
              {streak?.current_streak || 0}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">
              Day Streak
            </p>
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-primary-400 dark:text-primary-500">
          <span>Overall Progress</span>
          <span>
            {totalPoints} / {maxPoints} points
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-primary-100 dark:bg-primary-800">
          <div
            className="h-full rounded-full bg-primary-500 transition-all"
            style={{
              width: `${maxPoints > 0 ? Math.min((totalPoints / maxPoints) * 100, 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Achievement categories */}
      {categories.map((category) => {
        const defs = ACHIEVEMENT_DEFINITIONS.filter(
          (a) => a.category === category
        );
        if (defs.length === 0) return null;

        const categoryEarned = defs.reduce((sum, def) => {
          return (
            sum +
            achievements.filter((a) => a.achievement_key === def.key).length
          );
        }, 0);
        const categoryTotal = defs.reduce(
          (sum, def) => sum + def.tiers.length,
          0
        );

        return (
          <div key={category}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-primary-800 dark:text-primary-100">
                {CATEGORY_LABELS[category]}
              </h2>
              <span className="text-xs text-primary-300 dark:text-primary-600">
                {categoryEarned} / {categoryTotal} tiers
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {defs.map((def) => (
                <AchievementCard
                  key={def.key}
                  def={def}
                  earned={achievements}
                  progress={progress as Record<string, number | boolean> | null}
                  isExchangeLocked={def.requiresPaid && isFreePlan}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {totalUnlocked === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 shadow-sm dark:bg-primary-800">
            {DUOTONE_ICONS.TrophyIcon}
          </div>
          <p className="mt-4 text-sm text-primary-500 dark:text-primary-400">
            No achievements unlocked yet.
          </p>
          <p className="mt-1 text-xs text-primary-300 dark:text-primary-600">
            Start adding contacts, companies, and deals to unlock your first
            bronze tier.
          </p>
        </div>
      )}

      {/* Tier legend */}
      <div className="flex items-center justify-center gap-6 border-t border-primary-100 pt-6 dark:border-primary-800">
        {TIER_ORDER.map((tier) => (
          <div key={tier} className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                TIER_COLORS[tier].filled
              )}
            />
            <span className="text-xs text-primary-400 dark:text-primary-500">
              {TIER_STYLES[tier].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
