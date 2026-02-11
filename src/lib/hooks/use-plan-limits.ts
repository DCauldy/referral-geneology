"use client";

import { useOrg } from "@/components/providers/org-provider";
import { PLAN_LIMITS, type PlanType } from "@/lib/utils/constants";

export function usePlanLimits() {
  const { org } = useOrg();
  const plan = (org?.plan || "free") as PlanType;
  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    limits,
    canAccessView: (view: string) => limits.views.includes(view),
    canAccessAI: limits.aiInsights,
    canImportExport: limits.importExport,
    hasFullDealTracking: limits.dealTracking === "full",
    hasRealtimeCollab: limits.realtimeCollab,
    canAccessAutomations: limits.automations,
    canExchangeReferrals: limits.referralExchange,
    maxContacts: limits.maxContacts,
    maxUsers: limits.maxUsers,
    isFreePlan: plan === "free",
    isProPlan: plan === "pro",
    isTeamPlan: plan === "team",
  };
}
