"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExchangeTrustScore } from "@/types/database";

export function useTrustScore(userId: string | null) {
  const [score, setScore] = useState<ExchangeTrustScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/trust-score?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to fetch trust score");
        const json = await res.json();
        setScore(json.score || null);
      } catch {
        // Non-critical
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [userId]);

  return { score, isLoading };
}

export function useTrustScores(userIds: string[]) {
  const [scores, setScores] = useState<Map<string, ExchangeTrustScore>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Stable key for dependency tracking
  const idsKey = userIds.join(",");

  const fetchScores = useCallback(async () => {
    if (!idsKey) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/trust-score?userIds=${idsKey}`);
      if (!res.ok) throw new Error("Failed to fetch trust scores");
      const json = await res.json();
      const map = new Map<string, ExchangeTrustScore>();
      (json.scores || []).forEach((s: ExchangeTrustScore) => {
        map.set(s.user_id, s);
      });
      setScores(map);
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
    }
  }, [idsKey]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  return { scores, isLoading };
}
