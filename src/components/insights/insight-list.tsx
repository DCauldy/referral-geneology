"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { InsightCard } from "./insight-card";
import { SparklesIcon } from "@heroicons/react/24/outline";
import type { AiInsight } from "@/types/database";

export function InsightList() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!org) return;

    const { data } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("org_id", org.id)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(20);

    setInsights(data || []);
    setIsLoading(false);
  }, [supabase, org]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  async function handleGenerate() {
    if (!org) return;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.id }),
      });

      if (!res.ok) throw new Error("Failed to generate insights");

      toast.success("New insights generated");
      await fetchInsights();
    } catch {
      toast.error("Failed to generate insights");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDismiss(id: string) {
    await supabase
      .from("ai_insights")
      .update({ is_dismissed: true })
      .eq("id", id);

    setInsights((prev) => prev.filter((i) => i.id !== id));
    toast.info("Insight dismissed");
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
        >
          <SparklesIcon className="h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate New Insights"}
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
          <SparklesIcon className="mb-3 h-10 w-10 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            No insights yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Generate AI-powered insights to discover patterns in your referral network.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}
