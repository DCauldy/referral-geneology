"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeals, usePipelineStages } from "@/lib/hooks/use-deals";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency, getFullName } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Deal, PipelineStage } from "@/types/database";
import {
  CurrencyDollarIcon,
  UserIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export function DealPipelineBoard() {
  const router = useRouter();
  const supabase = useSupabase();
  const toast = useToast();
  const { stages, isLoading: stagesLoading } = usePipelineStages();
  const { deals, isLoading: dealsLoading, refresh } = useDeals({
    pageSize: 200, // Load more for board view
    status: "open",
  });
  const [movingDealId, setMovingDealId] = useState<string | null>(null);

  const dealsByStage = useCallback(
    (stageId: string): Deal[] => {
      return deals.filter((d) => d.stage_id === stageId);
    },
    [deals]
  );

  const stageTotal = useCallback(
    (stageId: string): number => {
      return dealsByStage(stageId).reduce((sum, d) => sum + (d.value ?? 0), 0);
    },
    [dealsByStage]
  );

  async function moveDeal(dealId: string, newStageId: string) {
    setMovingDealId(dealId);
    try {
      const stage = stages.find((s) => s.id === newStageId);
      const updatePayload: Record<string, unknown> = { stage_id: newStageId };

      // Auto-update status based on stage type
      if (stage?.is_won) {
        updatePayload.status = "won";
        updatePayload.actual_close_date = new Date().toISOString().split("T")[0];
      } else if (stage?.is_lost) {
        updatePayload.status = "lost";
        updatePayload.actual_close_date = new Date().toISOString().split("T")[0];
      }

      const { error } = await supabase
        .from("deals")
        .update(updatePayload)
        .eq("id", dealId);

      if (error) throw error;
      toast.success("Deal moved", `Deal moved to ${stage?.name ?? "new stage"}.`);
      await refresh();
    } catch (err) {
      toast.error(
        "Failed to move deal",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setMovingDealId(null);
    }
  }

  const isLoading = stagesLoading || dealsLoading;

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-72 shrink-0 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-4 h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="space-y-3">
              <div className="h-20 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-20 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <p className="text-sm font-medium text-zinc-900 dark:text-white">
          No pipeline stages configured
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Set up your pipeline stages in Settings to use the board view.
        </p>
        <Link
          href="/settings/pipeline"
          className="mt-4 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          Configure Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageDeals = dealsByStage(stage.id);
        const total = stageTotal(stage.id);

        return (
          <div
            key={stage.id}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            {/* Column Header */}
            <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {stage.name}
                  </h3>
                  <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {stageDeals.length}
                  </span>
                </div>
              </div>
              {total > 0 && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatCurrency(total)}
                </p>
              )}
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 320px)" }}>
              {stageDeals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-center dark:border-zinc-700">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    No deals
                  </p>
                </div>
              ) : (
                stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    stages={stages}
                    currentStageId={stage.id}
                    isMoving={movingDealId === deal.id}
                    onMove={(newStageId) => moveDeal(deal.id, newStageId)}
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  />
                ))
              )}
            </div>

            {/* Add Deal to Stage */}
            <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
              <Link
                href={`/deals/new?stage=${stage.id}`}
                className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add Deal
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DealCard({
  deal,
  stages,
  currentStageId,
  isMoving,
  onMove,
  onClick,
}: {
  deal: Deal;
  stages: PipelineStage[];
  currentStageId: string;
  isMoving: boolean;
  onMove: (stageId: string) => void;
  onClick: () => void;
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800",
        isMoving && "opacity-60"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-white">
          {deal.name}
        </h4>
      </div>

      {deal.value != null && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          <CurrencyDollarIcon className="h-3.5 w-3.5" />
          {formatCurrency(deal.value, deal.currency)}
        </div>
      )}

      {deal.contact && (
        <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <UserIcon className="h-3.5 w-3.5" />
          {getFullName(
            deal.contact.first_name,
            deal.contact.last_name ?? undefined
          )}
        </div>
      )}

      {deal.company?.name && (
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          {deal.company.name}
        </p>
      )}

      {/* Move button - visible on hover */}
      <div className="absolute right-2 top-2 hidden group-hover:block">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu(!showMoveMenu);
            }}
            className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            Move
          </button>
          {showMoveMenu && (
            <div
              className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              {stages
                .filter((s) => s.id !== currentStageId)
                .map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => {
                      setShowMoveMenu(false);
                      onMove(stage.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {stage.name}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
