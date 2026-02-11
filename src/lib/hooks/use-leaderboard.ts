"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/types/database";

export function useLeaderboard(scope: "org" | "directory") {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard?scope=${scope}`);
      if (res.status === 403) {
        const json = await res.json();
        setError(json.error || "Upgrade required");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const json = await res.json();
      setEntries(json.leaderboard || []);
      setCurrentUserId(json.current_user_id || null);
    } catch {
      setError("Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, currentUserId, isLoading, error, refetch: fetchLeaderboard };
}
