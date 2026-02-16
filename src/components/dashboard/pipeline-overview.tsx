"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { formatCurrency } from "@/lib/utils/format";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";

interface StageData {
  id: string;
  name: string;
  color: string;
  display_order: number;
  dealCount: number;
  totalValue: number;
}

export function PipelineOverview() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [stageData, setStageData] = useState<StageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPipeline() {
      if (!org) return;

      const [stagesRes, dealsRes] = await Promise.all([
        supabase
          .from("pipeline_stages")
          .select("id, name, color, display_order")
          .eq("org_id", org.id)
          .order("display_order"),
        supabase
          .from("deals")
          .select("stage_id, value")
          .eq("org_id", org.id),
      ]);

      const stages = stagesRes.data || [];
      const deals = dealsRes.data || [];

      const result: StageData[] = stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage_id === stage.id);
        return {
          ...stage,
          dealCount: stageDeals.length,
          totalValue: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0),
        };
      });

      setStageData(result);
      setIsLoading(false);
    }

    fetchPipeline();
  }, [supabase, org]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
        <div className="h-6 w-40 animate-pulse rounded bg-primary-100 dark:bg-primary-800" />
        <div className="mt-6 h-32 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-800" />
      </div>
    );
  }

  const totalDeals = stageData.reduce((sum, s) => sum + s.dealCount, 0);
  const totalValue = stageData.reduce((sum, s) => sum + s.totalValue, 0);
  const maxCount = Math.max(...stageData.map((s) => s.dealCount), 1);

  return (
    <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-800 dark:text-primary-100">
          <div className="flex h-6 w-6 items-center justify-center">
            {DUOTONE_ICONS.ChartBarIcon}
          </div>
          Deal Pipeline
        </h3>
        <Link
          href="/deals"
          className="text-xs font-medium text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200"
        >
          View all &rarr;
        </Link>
      </div>

      {/* Summary */}
      <div className="mt-3 flex items-baseline gap-4">
        <div>
          <span className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
            {totalDeals}
          </span>
          <span className="ml-1.5 text-sm text-primary-500 dark:text-primary-400">
            open {totalDeals === 1 ? "deal" : "deals"}
          </span>
        </div>
        {totalValue > 0 && (
          <div className="text-sm font-medium text-tan-600 dark:text-tan-400">
            {formatCurrency(totalValue)} in pipeline
          </div>
        )}
      </div>

      {stageData.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-primary-200 p-8 text-center dark:border-primary-700">
          <p className="text-sm text-primary-400 dark:text-primary-500">
            Configure your pipeline stages to start tracking deals.
          </p>
          <Link
            href="/settings/pipeline"
            className="mt-2 inline-block text-xs font-medium text-primary-600 hover:text-primary-500"
          >
            Set up pipeline &rarr;
          </Link>
        </div>
      ) : (
        <>
          {/* Funnel visualization */}
          <div className="mt-5 space-y-2.5">
            {stageData.map((stage) => {
              const widthPct = stage.dealCount > 0
                ? Math.max((stage.dealCount / maxCount) * 100, 8)
                : 0;

              return (
                <Link
                  key={stage.id}
                  href={`/deals?stage=${stage.id}`}
                  className="group flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-primary-50 dark:hover:bg-primary-800/30"
                >
                  {/* Stage label */}
                  <div className="flex w-28 shrink-0 items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="truncate text-xs font-medium text-primary-700 dark:text-primary-300">
                      {stage.name}
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="relative flex-1">
                    <div className="h-7 w-full rounded-md bg-primary-50 dark:bg-primary-800/40">
                      <div
                        className="flex h-full items-center rounded-md px-2 transition-all duration-500"
                        style={{
                          width: stage.dealCount > 0 ? `${widthPct}%` : "0%",
                          backgroundColor: `${stage.color}25`,
                          borderLeft: stage.dealCount > 0 ? `3px solid ${stage.color}` : "none",
                        }}
                      >
                        {stage.dealCount > 0 && (
                          <span
                            className="text-xs font-semibold"
                            style={{ color: stage.color }}
                          >
                            {stage.dealCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="w-20 shrink-0 text-right">
                    <span className="text-xs font-medium text-primary-500 dark:text-primary-400">
                      {stage.totalValue > 0
                        ? formatCurrency(stage.totalValue)
                        : "--"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Stage flow arrows */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {stageData.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-1.5">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: stage.color }}
                  >
                    {stage.dealCount}
                  </div>
                  <span className="mt-0.5 max-w-[60px] truncate text-center text-[9px] text-primary-400 dark:text-primary-500">
                    {stage.name}
                  </span>
                </div>
                {i < stageData.length - 1 && (
                  <div className="mb-3 text-primary-300 dark:text-primary-600">
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                      <path d="M1 5h12M11 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
