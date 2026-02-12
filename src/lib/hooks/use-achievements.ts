"use client";

import { useCallback, useEffect, useState } from "react";
import { useOrg } from "@/components/providers/org-provider";
import type { UserAchievement, UserStreak } from "@/types/database";

interface AchievementProgress {
  contacts: number;
  companies: number;
  deals: number;
  won_deals: number;
  won_revenue: number;
  referrals: number;
  converted_referrals: number;
  activities: number;
  automations: number;
  insights: number;
  trust_rating: number;
  onboarding_completed: boolean;
}

interface NewlyUnlocked {
  achievement_key: string;
  tier: string;
  points: number;
}

export function useAchievements() {
  const { org } = useOrg();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      const json = await res.json();
      setAchievements(json.achievements || []);
      setStreak(json.streak || null);
      setProgress(json.progress || null);
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements, org?.id]);

  const checkAchievements = useCallback(async (): Promise<NewlyUnlocked[]> => {
    try {
      const res = await fetch("/api/achievements/check", { method: "POST" });
      if (!res.ok) return [];
      const json = await res.json();
      const newlyUnlocked: NewlyUnlocked[] = json.newly_unlocked || [];

      // Refresh data if there were new unlocks
      if (newlyUnlocked.length > 0) {
        await fetchAchievements();
      }

      return newlyUnlocked;
    } catch {
      return [];
    }
  }, [fetchAchievements]);

  const markNotified = useCallback(async () => {
    // Already handled server-side in the check endpoint
    // This is a client-side convenience for UI state
    setAchievements((prev) =>
      prev.map((a) => ({ ...a, notified: true }))
    );
  }, []);

  return {
    achievements,
    streak,
    progress,
    isLoading,
    checkAchievements,
    markNotified,
    refetch: fetchAchievements,
  };
}
