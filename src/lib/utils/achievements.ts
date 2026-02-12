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
    bg: "bg-tan-100 dark:bg-tan-900/30",
    text: "text-tan-700 dark:text-tan-400",
    border: "border-tan-300 dark:border-tan-700",
    label: "Bronze",
  },
  silver: {
    bg: "bg-zinc-100 dark:bg-zinc-700/50",
    text: "text-zinc-600 dark:text-zinc-300",
    border: "border-zinc-300 dark:border-zinc-600",
    label: "Silver",
  },
  gold: {
    bg: "bg-tan-50 dark:bg-tan-900/30",
    text: "text-tan-600 dark:text-tan-300",
    border: "border-tan-400 dark:border-tan-600",
    label: "Gold",
  },
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  // ---- Getting Started ----
  {
    key: "first_branch",
    name: "Contact Starter",
    description: "Build out your contact list and lay the groundwork for referrals.",
    category: "getting_started",
    icon: "UserPlusIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 1, points: 5 },
      { tier: "silver", threshold: 5, points: 10 },
      { tier: "gold", threshold: 15, points: 20 },
    ],
  },
  {
    key: "first_root",
    name: "Company Starter",
    description: "Add companies to your network and connect them to contacts.",
    category: "getting_started",
    icon: "BuildingOffice2Icon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 1, points: 5 },
      { tier: "silver", threshold: 3, points: 10 },
      { tier: "gold", threshold: 10, points: 20 },
    ],
  },
  {
    key: "first_fruit",
    name: "Deal Starter",
    description: "Create deals in your pipeline and start tracking revenue.",
    category: "getting_started",
    icon: "CurrencyDollarIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 1, points: 5 },
      { tier: "silver", threshold: 5, points: 10 },
      { tier: "gold", threshold: 15, points: 20 },
    ],
  },
  {
    key: "first_growth",
    name: "Referral Starter",
    description: "Send referrals between contacts and grow your network organically.",
    category: "getting_started",
    icon: "ArrowsRightLeftIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 1, points: 5 },
      { tier: "silver", threshold: 5, points: 10 },
      { tier: "gold", threshold: 15, points: 20 },
    ],
  },
  {
    key: "seedling",
    name: "Quick Start",
    description: "Complete onboarding and set up your account to get started.",
    category: "getting_started",
    icon: "SparklesIcon",
    requiresPaid: false,
    tiers: [{ tier: "gold", threshold: 1, points: 15 }],
  },

  // ---- Growth ----
  {
    key: "branch_collector",
    name: "Network Builder",
    description: "Scale your contact database into a powerful referral network.",
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
    name: "Company Portfolio",
    description: "Grow your portfolio of companies and expand your market reach.",
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
    name: "Revenue Milestone",
    description: "Hit major revenue milestones from won deals across your pipeline.",
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
    name: "Deal Closer",
    description: "Close deals and move them to won status in your pipeline.",
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
    name: "Referral Pro",
    description: "Become a consistent source of referrals across your network.",
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
    name: "Conversion Expert",
    description: "Convert referrals into successful deals and closed revenue.",
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
    name: "Top Performer",
    description: "Maintain a high conversion rate on your referrals.",
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
    name: "Referral Sender",
    description: "Share referrals with other professionals through the exchange.",
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
    name: "Referral Receiver",
    description: "Receive referrals from other professionals in the exchange.",
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
    name: "Exchange Closer",
    description: "Turn exchanged referrals into won deals and closed revenue.",
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
    name: "Trusted Partner",
    description: "Earn a high trust rating through reliable exchange activity.",
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
    name: "Activity Tracker",
    description: "Log activities consistently to keep your CRM data up to date.",
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
    name: "Automation Builder",
    description: "Create automation sequences to streamline your workflow.",
    category: "engagement",
    icon: "BoltIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 1, points: 10 },
      { tier: "silver", threshold: 5, points: 25 },
      { tier: "gold", threshold: 15, points: 50 },
    ],
  },
  {
    key: "orchard_oracle",
    name: "Insight Explorer",
    description: "Unlock AI-powered insights to find opportunities in your data.",
    category: "engagement",
    icon: "SparklesIcon",
    requiresPaid: false,
    tiers: [
      { tier: "bronze", threshold: 1, points: 10 },
      { tier: "silver", threshold: 10, points: 25 },
      { tier: "gold", threshold: 50, points: 50 },
    ],
  },

  // ---- Streaks ----
  {
    key: "steady_grower",
    name: "Consistency Champion",
    description: "Log in and stay active day after day to build momentum.",
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
