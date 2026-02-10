"use client";

import { cn } from "@/lib/utils/cn";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { AiInsight } from "@/types/database";

const typeColors: Record<string, string> = {
  referral_pattern: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  top_referrers: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  network_gap: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  deal_prediction: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cluster_analysis: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  growth_opportunity: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

interface InsightCardProps {
  insight: AiInsight;
  onDismiss?: (id: string) => void;
  onClick?: (insight: AiInsight) => void;
}

export function InsightCard({ insight, onDismiss, onClick }: InsightCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick?.(insight)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={cn(
              "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
              typeColors[insight.insight_type] || "bg-zinc-100 text-zinc-700"
            )}
          >
            {insight.insight_type.replace("_", " ")}
          </span>
          <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
            {insight.title}
          </h3>
          <p className="mt-1 line-clamp-3 text-xs text-zinc-600 dark:text-zinc-400">
            {insight.summary}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(insight.id);
            }}
            className="shrink-0 rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100 dark:hover:bg-zinc-800"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {insight.confidence != null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">Confidence</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {Math.round(insight.confidence * 100)}%
            </span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-1 rounded-full bg-primary-500"
              style={{ width: `${(insight.confidence || 0) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
