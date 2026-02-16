"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeals, usePipelineStages } from "@/lib/hooks/use-deals";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency, getFullName } from "@/lib/utils/format";
import { linkWonDealToReferrals } from "@/lib/utils/deal-referral-link";
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
  const { org } = useOrg();
  const toast = useToast();
  const { stages, isLoading: stagesLoading } = usePipelineStages();
  const { deals, isLoading: dealsLoading, refresh } = useDeals({
    pageSize: 200, // Load more for board view
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

      // Auto-link deal to referrals when won
      if (stage?.is_won && org) {
        await linkWonDealToReferrals(supabase, dealId, org.id);
      }

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

  async function changeStatus(dealId: string, newStatus: string) {
    setMovingDealId(dealId);
    try {
      const updatePayload: Record<string, unknown> = { status: newStatus };

      if (newStatus === "won" || newStatus === "lost") {
        updatePayload.actual_close_date = new Date().toISOString().split("T")[0];
      }

      const { error } = await supabase
        .from("deals")
        .update(updatePayload)
        .eq("id", dealId);

      if (error) throw error;

      if (newStatus === "won" && org) {
        await linkWonDealToReferrals(supabase, dealId, org.id);
      }

      toast.success("Status updated", `Deal marked as ${newStatus}.`);
      await refresh();
    } catch (err) {
      toast.error(
        "Failed to update status",
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
            className="w-72 shrink-0 animate-pulse rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-900/30"
          >
            <div className="mb-4 h-5 w-24 rounded bg-primary-200 dark:bg-primary-700" />
            <div className="space-y-3">
              <div className="h-20 rounded-lg bg-primary-100 dark:bg-primary-800" />
              <div className="h-20 rounded-lg bg-primary-100 dark:bg-primary-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary-300 p-12 text-center dark:border-primary-700">
        <p className="font-serif text-sm font-medium text-primary-800 dark:text-primary-100">
          No pipeline stages configured
        </p>
        <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
          Set up your pipeline stages in Settings to start tracking deals.
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
            className="flex w-72 shrink-0 flex-col rounded-xl border border-primary-200 bg-primary-50/30 dark:border-primary-800 dark:bg-primary-900/20"
          >
            {/* Column Header */}
            <div className="border-b border-primary-200 p-3 dark:border-primary-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-serif text-sm font-semibold text-primary-800 dark:text-primary-100">
                    {stage.name}
                  </h3>
                  <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-800 dark:text-primary-300">
                    {stageDeals.length}
                  </span>
                </div>
              </div>
              {total > 0 && (
                <p className="mt-1 text-xs font-medium text-tan-500 dark:text-tan-400">
                  {formatCurrency(total)}
                </p>
              )}
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 320px)" }}>
              {stageDeals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-primary-200 p-4 text-center dark:border-primary-700">
                  <p className="text-xs text-primary-400 dark:text-primary-500">
                    No deals in this stage yet.
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
                    onStatusChange={(status) => changeStatus(deal.id, status)}
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  />
                ))
              )}
            </div>

            {/* Add Deal to Stage */}
            <div className="border-t border-primary-200 p-2 dark:border-primary-800">
              <Link
                href={`/deals/new?stage=${stage.id}`}
                className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-100 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-primary-800 dark:hover:text-primary-200"
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

const statusConfig = [
  { value: "open", label: "Open", dotColor: "bg-blue-400" },
  { value: "won", label: "Won", dotColor: "bg-emerald-400" },
  { value: "lost", label: "Lost", dotColor: "bg-red-400" },
] as const;

function DealCard({
  deal,
  stages,
  currentStageId,
  isMoving,
  onMove,
  onStatusChange,
  onClick,
}: {
  deal: Deal;
  stages: PipelineStage[];
  currentStageId: string;
  isMoving: boolean;
  onMove: (stageId: string) => void;
  onStatusChange: (status: string) => void;
  onClick: () => void;
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const currentStatus = statusConfig.find((s) => s.value === deal.status) ?? statusConfig[0];

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-lg border border-primary-200 bg-white p-3 shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-primary-700 dark:bg-primary-900/40 dark:hover:border-primary-600",
        isMoving && "opacity-60"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-primary-800 dark:text-primary-100">
          {deal.name}
        </h4>
      </div>

      {deal.value != null && (
        <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-tan-600 dark:text-tan-400">
          <CurrencyDollarIcon className="h-3.5 w-3.5" />
          {formatCurrency(deal.value, deal.currency)}
        </div>
      )}

      {deal.contact && (
        <div className="mt-1 flex items-center gap-1 text-xs text-primary-500 dark:text-primary-400">
          <UserIcon className="h-3.5 w-3.5" />
          {getFullName(
            deal.contact.first_name,
            deal.contact.last_name ?? undefined
          )}
        </div>
      )}

      {deal.company?.name && (
        <p className="mt-0.5 text-xs text-primary-400 dark:text-primary-500">
          {deal.company.name}
        </p>
      )}

      {/* Status badge — inline editable */}
      <div className="relative mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowStatusMenu(!showStatusMenu);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700 hover:bg-primary-200 dark:bg-primary-800 dark:text-primary-300 dark:hover:bg-primary-700"
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", currentStatus.dotColor)} />
          {currentStatus.label}
        </button>
        {showStatusMenu && (
          <div
            className="absolute left-0 z-20 mt-1 w-28 rounded-lg border border-primary-200 bg-white py-1 shadow-lg dark:border-primary-700 dark:bg-primary-900"
            onClick={(e) => e.stopPropagation()}
          >
            {statusConfig.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setShowStatusMenu(false);
                  if (s.value !== deal.status) {
                    onStatusChange(s.value);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-primary-50 dark:hover:bg-primary-800",
                  s.value === deal.status && "bg-primary-50 dark:bg-primary-800"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", s.dotColor)} />
                <span className="text-primary-700 dark:text-primary-300">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Move button - visible on hover */}
      <div className="absolute right-2 top-2 hidden group-hover:block">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu(!showMoveMenu);
            }}
            className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-600 hover:bg-primary-200 dark:bg-primary-800 dark:text-primary-300 dark:hover:bg-primary-700"
          >
            Move
          </button>
          {showMoveMenu && (
            <div
              className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-primary-200 bg-white py-1 shadow-lg dark:border-primary-700 dark:bg-primary-900"
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
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-primary-50 dark:hover:bg-primary-800"
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-primary-700 dark:text-primary-300">
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
