import { PLAN_LIMITS, type PlanType } from "@/lib/utils/constants";

// Polar product IDs - configure in .env or Polar dashboard
export const POLAR_PRODUCTS = {
  pro_monthly: process.env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_PRODUCT_ID || "",
  pro_annual: process.env.NEXT_PUBLIC_POLAR_PRO_ANNUAL_PRODUCT_ID || "",
  team_monthly: process.env.NEXT_PUBLIC_POLAR_TEAM_MONTHLY_PRODUCT_ID || "",
  team_annual: process.env.NEXT_PUBLIC_POLAR_TEAM_ANNUAL_PRODUCT_ID || "",
} as const;

export const PLAN_DISPLAY = {
  free: {
    name: "Free",
    description: "For individuals getting started",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Up to 50 contacts",
      "1 user",
      "Tree visualization",
      "Basic deal tracking",
    ],
  },
  pro: {
    name: "Pro",
    description: "For growing professionals",
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      "Unlimited contacts",
      "1 user",
      "Tree + Network + Galaxy views",
      "AI-powered insights",
      "CSV import/export",
      "Full deal tracking",
    ],
  },
  team: {
    name: "Team",
    description: "For teams and organizations",
    monthlyPrice: 79,
    annualPrice: 790,
    features: [
      "Unlimited contacts",
      "Up to 25 users",
      "All visualization views",
      "AI-powered insights",
      "CSV import/export",
      "Full deal tracking",
      "Real-time collaboration",
    ],
  },
} as const;

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan];
}

export function canAccessFeature(
  plan: PlanType,
  feature: keyof (typeof PLAN_LIMITS)["free"]
): boolean {
  const limits = PLAN_LIMITS[plan];
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== "basic";
}

export function canAccessView(plan: PlanType, view: string): boolean {
  return PLAN_LIMITS[plan].views.includes(view);
}

export function getContactLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan].maxContacts;
}

export function getUserLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan].maxUsers;
}

export function mapPolarProductToPlan(productName: string): PlanType {
  const lower = productName.toLowerCase();
  if (lower.includes("team")) return "team";
  if (lower.includes("pro")) return "pro";
  return "free";
}
