"use client";

import { InsightList } from "@/components/insights/insight-list";

export default function InsightsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        AI Insights
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        AI-powered analysis of your referral network.
      </p>
      <InsightList />
    </div>
  );
}
