export type AchievementTier = "bronze" | "silver" | "gold";

export type AchievementCategory =
  | "getting_started"
  | "growth"
  | "networking"
  | "exchange"
  | "engagement"
  | "streaks";

export interface AchievementTierDef {
  tier: AchievementTier;
  threshold: number;
  points: number;
}

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string; // heroicon name
  requiresPaid: boolean;
  /** Single-tier achievements only have a gold entry */
  tiers: AchievementTierDef[];
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  getting_started: "Getting Started",
  growth: "Growth",
  networking: "Networking",
  exchange: "Exchange",
  engagement: "Engagement",
  streaks: "Streaks",
};

export const TIER_STYLES: Record<
  AchievementTier,
  { bg: string; text: string; border: string; label: string }
> = {
  bronze: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-700",
    label: "Bronze",
  },
  silver: {
    bg: "bg-zinc-100 dark:bg-zinc-700/50",
    text: "text-zinc-600 dark:text-zinc-300",
    border: "border-zinc-300 dark:border-zinc-600",
    label: "Silver",
  },
  gold: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-400 dark:border-yellow-600",
    label: "Gold",
  },
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  // ---- Getting Started ----
  {
    key: "first_branch",
    name: "First Branch",
    description: "Plant your first branch in the tree.",
    category: "getting_started",
    icon: "UserPlusIcon",
    requiresPaid: false,
    tiers: [{ tier: "gold", threshold: 1, points: 10 }],
  },
  {
    key: "first_root",
    name: "First Root",
    description: "Anchor your first root in the network.",
    category: "getting_started",
    icon: "BuildingOffice2Icon",
    requiresPaid: false,
    tiers: [{ tier: "gold", threshold: 1, points: 10 }],
  },
  {
    key: "first_fruit",
    name: "First Fruit",
    description: "Your tree has borne its first fruit.",
    category: "getting_started",
    icon: "CurrencyDollarIcon",
    requiresPaid: false,
    tiers: [{ tier: "gold", threshold: 1, points: 10 }],
  },
  {
    key: "first_growth",
    name: "First Growth",
    description: "Watch the first new growth sprout from your branches.",
    category: "getting_started",
    icon: "ArrowsRightLeftIcon",
    requiresPaid: false,
    tiers: [{ tier: "gold", threshold: 1, points: 10 }],
  },
  {
    key: "seedling",
    name: "Seedling",
    description: "Complete onboarding and plant your seedling.",
    category: "getting_started",
    icon: "SparklesIcon",
    requiresPaid: false,
    tiers: [{ tier: "gold", threshold: 1, points: 15 }],
  },

  // ---- Growth ----
  {
    key: "branch_collector",
    name: "Branch Collector",
    description: "Grow your tree with more branches.",
    category: "growth",
    icon: "UsersIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 10, points: 10 },
      { tier: "silver", threshold: 50, points: 25 },
      { tier: "gold", threshold: 100, points: 50 },
    ],
  },
  {
    key: "root_system",
    name: "Root System",
    description: "Establish deep roots across many companies.",
    category: "growth",
    icon: "BuildingOffice2Icon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 5, points: 10 },
      { tier: "silver", threshold: 25, points: 25 },
      { tier: "gold", threshold: 100, points: 50 },
    ],
  },
  {
    key: "abundant_harvest",
    name: "Abundant Harvest",
    description: "Reap the rewards of a bountiful grove.",
    category: "growth",
    icon: "CurrencyDollarIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 1000, points: 15 },
      { tier: "silver", threshold: 10000, points: 35 },
      { tier: "gold", threshold: 100000, points: 75 },
    ],
  },
  {
    key: "fruit_bearer",
    name: "Fruit Bearer",
    description: "Nurture your deals until they ripen into fruit.",
    category: "growth",
    icon: "TrophyIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 5, points: 10 },
      { tier: "silver", threshold: 25, points: 25 },
      { tier: "gold", threshold: 100, points: 50 },
    ],
  },

  // ---- Networking ----
  {
    key: "growth_spreader",
    name: "Growth Spreader",
    description: "Spread new growth throughout the network.",
    category: "networking",
    icon: "ArrowsRightLeftIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 10, points: 10 },
      { tier: "silver", threshold: 50, points: 25 },
      { tier: "gold", threshold: 100, points: 50 },
    ],
  },
  {
    key: "fruitful_growth",
    name: "Fruitful Growth",
    description: "Your new growth blossoms into converted fruit.",
    category: "networking",
    icon: "CheckCircleIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 1, points: 10 },
      { tier: "silver", threshold: 10, points: 25 },
      { tier: "gold", threshold: 25, points: 50 },
    ],
  },
  {
    key: "master_grower",
    name: "Master Grower",
    description: "Achieve a remarkable yield rate on your referrals.",
    category: "networking",
    icon: "ChartBarIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 25, points: 15 },
      { tier: "silver", threshold: 50, points: 35 },
      { tier: "gold", threshold: 75, points: 75 },
    ],
  },

  // ---- Exchange (paid) ----
  {
    key: "seed_sower",
    name: "Seed Sower",
    description: "Share seeds across the network through exchanges.",
    category: "exchange",
    icon: "ArrowUpTrayIcon",
    requiresPaid: true,
    tiers: [
      { tier: "bronze", threshold: 1, points: 10 },
      { tier: "silver", threshold: 10, points: 25 },
      { tier: "gold", threshold: 50, points: 50 },
    ],
  },
  {
    key: "seed_collector",
    name: "Seed Collector",
    description: "Receive seeds from fellow growers in the network.",
    category: "exchange",
    icon: "ArrowDownTrayIcon",
    requiresPaid: true,
    tiers: [
      { tier: "bronze", threshold: 1, points: 10 },
      { tier: "silver", threshold: 10, points: 25 },
      { tier: "gold", threshold: 50, points: 50 },
    ],
  },
  {
    key: "cross_pollinator",
    name: "Cross-Pollinator",
    description: "Your exchanged seeds bloom into converted fruit.",
    category: "exchange",
    icon: "ArrowsRightLeftIcon",
    requiresPaid: true,
    tiers: [
      { tier: "bronze", threshold: 1, points: 15 },
      { tier: "silver", threshold: 5, points: 35 },
      { tier: "gold", threshold: 25, points: 75 },
    ],
  },
  {
    key: "trusted_grower",
    name: "Trusted Grower",
    description: "Build trust across the network through reliable exchanges.",
    category: "exchange",
    icon: "ShieldCheckIcon",
    requiresPaid: true,
    tiers: [
      { tier: "bronze", threshold: 40, points: 15 },
      { tier: "silver", threshold: 60, points: 35 },
      { tier: "gold", threshold: 80, points: 75 },
    ],
  },

  // ---- Engagement ----
  {
    key: "growth_logger",
    name: "Growth Logger",
    description: "Keep a detailed growth log of your network activity.",
    category: "engagement",
    icon: "DocumentTextIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 10, points: 10 },
      { tier: "silver", threshold: 50, points: 25 },
      { tier: "gold", threshold: 200, points: 50 },
    ],
  },
  {
    key: "auto_cultivator",
    name: "Auto-Cultivator",
    description: "Set up automated cultivation for your network.",
    category: "engagement",
    icon: "BoltIcon",
    requiresPaid: false,
    tiers: [{ tier: "gold", threshold: 1, points: 20 }],
  },
  {
    key: "orchard_oracle",
    name: "Orchard Oracle",
    description: "Unlock AI-powered insights about your orchard.",
    category: "engagement",
    icon: "SparklesIcon",
    requiresPaid: false,
    tiers: [{ tier: "gold", threshold: 1, points: 20 }],
  },

  // ---- Streaks ----
  {
    key: "steady_grower",
    name: "Steady Grower",
    description: "Return day after day to tend your growing network.",
    category: "streaks",
    icon: "FireIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 7, points: 15 },
      { tier: "silver", threshold: 30, points: 35 },
      { tier: "gold", threshold: 90, points: 75 },
    ],
  },
];

// --- Helper functions ---

export function getAchievement(key: string): AchievementDef | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.key === key);
}

export function getAchievementsByCategory(
  category: AchievementCategory
): AchievementDef[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === category);
}

export function calculateTotalPoints(
  earned: { achievement_key: string; tier: AchievementTier; points: number }[]
): number {
  return earned.reduce((sum, a) => sum + a.points, 0);
}

export function getMaxPossiblePoints(): number {
  return ACHIEVEMENT_DEFINITIONS.reduce((sum, def) => {
    return sum + def.tiers.reduce((tierSum, t) => tierSum + t.points, 0);
  }, 0);
}

export function getNextTier(
  def: AchievementDef,
  currentTier: AchievementTier | null
): AchievementTierDef | null {
  if (!currentTier) return def.tiers[0] || null;
  const tierOrder: AchievementTier[] = ["bronze", "silver", "gold"];
  const currentIndex = tierOrder.indexOf(currentTier);
  const nextTier = tierOrder[currentIndex + 1];
  if (!nextTier) return null;
  return def.tiers.find((t) => t.tier === nextTier) || null;
}

export function getHighestEarnedTier(
  achievementKey: string,
  earned: { achievement_key: string; tier: AchievementTier }[]
): AchievementTier | null {
  const tierOrder: AchievementTier[] = ["bronze", "silver", "gold"];
  const matching = earned.filter((e) => e.achievement_key === achievementKey);
  if (matching.length === 0) return null;
  let highest: AchievementTier = matching[0].tier;
  for (const m of matching) {
    if (tierOrder.indexOf(m.tier) > tierOrder.indexOf(highest)) {
      highest = m.tier;
    }
  }
  return highest;
}

export function getProgressPercent(
  def: AchievementDef,
  currentValue: number,
  currentTier: AchievementTier | null
): number {
  const next = getNextTier(def, currentTier);
  if (!next) return 100; // All tiers unlocked
  const prev = currentTier
    ? def.tiers.find((t) => t.tier === currentTier)
    : null;
  const prevThreshold = prev ? prev.threshold : 0;
  const range = next.threshold - prevThreshold;
  if (range <= 0) return 100;
  const progress = Math.min(currentValue - prevThreshold, range);
  return Math.round((progress / range) * 100);
}
