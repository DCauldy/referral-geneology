"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useAchievements } from "@/lib/hooks/use-achievements";
import {
  ACHIEVEMENT_DEFINITIONS,
  CATEGORY_LABELS,
  TIER_STYLES,
  getHighestEarnedTier,
  getNextTier,
  getProgressPercent,
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
    auto_cultivator: "activities",
    orchard_oracle: "activities",
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
  const tierStyle = highestTier ? TIER_STYLES[highestTier] : null;
  const Icon = ICON_MAP[def.icon] || TrophyIcon;
  const currentValue = getProgressValue(def, progress);
  const pct = getProgressPercent(def, currentValue, highestTier);
  const next = getNextTier(def, highestTier);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border p-4 transition-shadow",
        locked
          ? "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/50"
          : isUnlocked
            ? cn("bg-white shadow-sm dark:bg-zinc-900", tierStyle?.border || "border-zinc-200 dark:border-zinc-800")
            : "border-zinc-200 bg-white opacity-75 dark:border-zinc-800 dark:bg-zinc-900"
      )}
    >
      {/* Top row: icon + tier badge */}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            isUnlocked && tierStyle
              ? tierStyle.bg
              : "bg-zinc-100 dark:bg-zinc-800"
          )}
        >
          {locked ? (
            <LockClosedIcon className="h-5 w-5 text-zinc-400" />
          ) : (
            <Icon
              className={cn(
                "h-5 w-5",
                isUnlocked && tierStyle
                  ? tierStyle.text
                  : "text-zinc-400 dark:text-zinc-500"
              )}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {locked && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              PRO
            </span>
          )}
          {isUnlocked && tierStyle && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                tierStyle.bg,
                tierStyle.text
              )}
            >
              {TIER_STYLES[highestTier].label}
            </span>
          )}
        </div>
      </div>

      {/* Name + description */}
      <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
        {def.name}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {def.description}
      </p>

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
            <span>{TIER_STYLES[next.tier].label}</span>
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
      {!locked && !next && isUnlocked && (
        <div className="mt-auto pt-3">
          <p className="text-[10px] font-medium text-green-600 dark:text-green-400">
            All tiers complete
          </p>
        </div>
      )}
    </div>
  );
}

export default function AchievementsPage() {
  const { achievements, streak, progress, isLoading } = useAchievements();
  const { isFreePlan } = usePlanLimits();

  const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const totalUnlocked = achievements.length;
  const totalPossible = ACHIEVEMENT_DEFINITIONS.reduce(
    (sum, def) => sum + def.tiers.length,
    0
  );

  const categories = Object.keys(CATEGORY_LABELS) as AchievementCategory[];

  if (isLoading) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Achievements" }]} />
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[180px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Achievements" }]} />

      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Achievements
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Watch your accomplishments blossom as you nurture your network.
          </p>
        </div>

        {/* Summary card */}
        <div className="flex flex-wrap gap-4">
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
                Unlocked
              </p>
            </div>
          </div>

          {streak && (
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
          )}
        </div>

        {/* Achievement categories */}
        {categories.map((category) => {
          const defs = ACHIEVEMENT_DEFINITIONS.filter(
            (a) => a.category === category
          );
          if (defs.length === 0) return null;

          return (
            <div key={category}>
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                {CATEGORY_LABELS[category]}
              </h2>
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
              Your garden of achievements is waiting to bloom.
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Start adding contacts, companies, and deals to unlock your first achievements.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
