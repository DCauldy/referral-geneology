"use client";

import { useCallback, useState } from "react";

interface NetworkRecommendation {
  user_id: string;
  name: string;
  match_score: number;
  reasons: string[];
}

interface NetworkSuggestionsResult {
  recommendations: NetworkRecommendation[];
  network_insight: string;
}

export function useNetworkSuggestions() {
  const [data, setData] = useState<NetworkSuggestionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/network-suggestions", {
        method: "POST",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to generate suggestions");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate suggestions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, generate };
}
