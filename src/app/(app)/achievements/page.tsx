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
import {
  TrophyIcon,
  FireIcon,
  LockClosedIcon,
  UserPlusIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  UsersIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BoltIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import type { UserAchievement } from "@/types/database";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlusIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  UsersIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BoltIcon,
  TrophyIcon,
  FireIcon,
  StarIcon,
};

const TIER_ORDER: AchievementTier[] = ["bronze", "silver", "gold"];

const TIER_COLORS: Record<AchievementTier, { filled: string; empty: string; ring: string }> = {
  bronze: {
    filled: "bg-amber-500",
    empty: "bg-amber-200 dark:bg-amber-900/40",
    ring: "ring-amber-400",
  },
  silver: {
    filled: "bg-zinc-400 dark:bg-zinc-300",
    empty: "bg-zinc-200 dark:bg-zinc-700",
    ring: "ring-zinc-400",
  },
  gold: {
    filled: "bg-yellow-400",
    empty: "bg-yellow-200 dark:bg-yellow-900/40",
    ring: "ring-yellow-400",
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

  // For single-tier achievements, show a single dot
  if (def.tiers.length === 1) {
    const tier = def.tiers[0].tier;
    const isEarned = earnedTiers.has(tier);
    return (
      <div className="flex items-center gap-1">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-all",
            isEarned
              ? cn(TIER_COLORS[tier].filled, "ring-2", TIER_COLORS[tier].ring, "ring-offset-1 ring-offset-white dark:ring-offset-zinc-900")
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
                ? cn(TIER_COLORS[tier].filled, "ring-2", TIER_COLORS[tier].ring, "ring-offset-1 ring-offset-white dark:ring-offset-zinc-900")
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
  const Icon = ICON_MAP[def.icon] || TrophyIcon;
  const currentValue = getProgressValue(def, progress);
  const pct = getProgressPercent(def, currentValue, highestTier);
  const next = getNextTier(def, highestTier);
  const isFullyComplete = isUnlocked && !next;

  // Calculate earned tier count for this achievement
  const earnedTierCount = earned.filter(
    (e) => e.achievement_key === def.key
  ).length;
  const totalTierCount = def.tiers.length;

  // Icon background color based on highest tier
  const iconBg = isUnlocked && highestTier
    ? TIER_STYLES[highestTier].bg
    : "bg-zinc-100 dark:bg-zinc-800";
  const iconColor = isUnlocked && highestTier
    ? TIER_STYLES[highestTier].text
    : "text-zinc-400 dark:text-zinc-500";

  // Card border based on completion
  const cardBorder = locked
    ? "border-zinc-200 dark:border-zinc-800"
    : isFullyComplete
      ? "border-yellow-300 dark:border-yellow-700/50"
      : isUnlocked && highestTier
        ? TIER_STYLES[highestTier].border
        : "border-zinc-200 dark:border-zinc-800";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border p-4 transition-all",
        locked
          ? "bg-zinc-50 opacity-60 dark:bg-zinc-900/50"
          : isFullyComplete
            ? "bg-gradient-to-br from-yellow-50/80 to-white shadow-sm dark:from-yellow-950/10 dark:to-zinc-900"
            : isUnlocked
              ? "bg-white shadow-sm dark:bg-zinc-900"
              : "bg-white opacity-75 dark:bg-zinc-900",
        cardBorder
      )}
    >
      {/* Completion glow for fully maxed achievements */}
      {isFullyComplete && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400/5 to-transparent" />
      )}

      {/* Top row: icon + tier dots + badges */}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            iconBg
          )}
        >
          {locked ? (
            <LockClosedIcon className="h-5 w-5 text-zinc-400" />
          ) : (
            <Icon className={cn("h-5 w-5", iconColor)} />
          )}
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
      <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
        {def.name}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {def.description}
      </p>

      {/* Tier progress summary */}
      {!locked && totalTierCount > 1 && (
        <p className="mt-2 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          {earnedTierCount} / {totalTierCount} tiers
        </p>
      )}

      {/* Progress bar (only if there's a next tier to reach) */}
      {!locked && next && (
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
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
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                next.tier === "gold"
                  ? "bg-yellow-500"
                  : next.tier === "silver"
                    ? "bg-zinc-400"
                    : "bg-amber-500"
              )}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* All tiers complete */}
      {!locked && isFullyComplete && (
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-1">
            <StarIcon className="h-3.5 w-3.5 text-yellow-500" />
            <p className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400">
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

  // Count fully completed achievements (all tiers earned)
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
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[200px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Achievements
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Earn bronze, silver, and gold as your trellis grows.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Points */}
        <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 dark:border-yellow-800/50 dark:bg-yellow-950/20">
          <TrophyIcon className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {totalPoints}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">
              Total Points
            </p>
          </div>
        </div>

        {/* Tiers Unlocked */}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <CheckCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {totalUnlocked}
              <span className="text-sm font-normal text-zinc-400">
                {" "}
                / {totalPossible}
              </span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Tiers Unlocked
            </p>
          </div>
        </div>

        {/* Fully Completed */}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <StarIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {fullyCompleted}
              <span className="text-sm font-normal text-zinc-400">
                {" "}
                / {ACHIEVEMENT_DEFINITIONS.length}
              </span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Fully Cultivated
            </p>
          </div>
        </div>

        {/* Day Streak */}
        {streak && streak.current_streak > 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 dark:border-orange-800/50 dark:bg-orange-950/20">
            <FireIcon className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {streak.current_streak}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-500">
                Day Streak
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <FireIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                0
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Day Streak
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Overall Progress</span>
          <span>
            {totalPoints} / {maxPoints} points
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-zinc-400 to-yellow-400 transition-all"
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

        // Count earned tiers in this category
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
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {CATEGORY_LABELS[category]}
              </h2>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
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
          <TrophyIcon className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            No achievements unlocked yet.
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Start adding contacts, companies, and deals to unlock your first
            bronze tier.
          </p>
        </div>
      )}

      {/* Tier legend */}
      <div className="flex items-center justify-center gap-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        {TIER_ORDER.map((tier) => (
          <div key={tier} className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                TIER_COLORS[tier].filled
              )}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {TIER_STYLES[tier].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
