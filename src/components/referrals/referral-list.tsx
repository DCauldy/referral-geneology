"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useReferrals } from "@/lib/hooks/use-referrals";
import { usePipelineStages } from "@/lib/hooks/use-deals";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge, type BadgeColor } from "@/components/catalyst/badge";
import { formatDate, formatCurrency, getFullName } from "@/lib/utils/format";
import { REFERRAL_TYPES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import {
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import type { ReferralType, Referral } from "@/types/database";

const PAGE_SIZE = 25;

const typeColors: Record<ReferralType, BadgeColor> = {
  direct: "primary",
  introduction: "purple",
  recommendation: "green",
  mutual: "pink",
};

interface ReferralListProps {
  contactId?: string;
  onRowClick?: (referralId: string, contactId: string) => void;
}

export function ReferralList({ contactId, onRowClick }: ReferralListProps) {
  const [stageFilter, setStageFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const supabase = useSupabase();
  const toast = useToast();
  const { stages } = usePipelineStages();

  const { referrals, totalCount, isLoading, error, refresh } = useReferrals({
    contactId,
    stageId: stageFilter || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  async function saveField(
    referralId: string,
    field: string,
    value: string | number | null
  ) {
    const { error: updateError } = await supabase
      .from("referrals")
      .update({ [field]: value })
      .eq("id", referralId);

    if (updateError) {
      toast.error("Failed to update", updateError.message);
      return;
    }
    toast.success("Referral updated", "The referral has been updated.");
    await refresh();
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        Failed to load referrals: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
          >
            <option value="">All Pipeline Stages</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
          <span className="text-sm text-primary-500 dark:text-primary-400">
            {totalCount} referral{totalCount !== 1 ? "s" : ""}
          </span>
        </div>

        <Link
          href="/referrals/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add Referral
        </Link>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-primary-100 dark:bg-primary-800"
            />
          ))}
        </div>
      ) : referrals.length === 0 ? (
        <div className="rounded-md border border-primary-200 bg-primary-50 p-8 text-center text-sm text-primary-500 dark:border-primary-700 dark:bg-primary-800/50 dark:text-primary-400">
          No referrals yet. Add your first referral to get started.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-primary-200 dark:border-primary-800">
            <table className="min-w-full divide-y divide-primary-200 dark:divide-primary-800">
              <thead className="bg-primary-50 dark:bg-primary-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                    Referrer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                    Referred
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                    Pipeline Stage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                    Deal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-200 bg-white dark:divide-primary-800 dark:bg-primary-950">
                {referrals.map((referral) => {
                  const dealStage = (
                    referral.deal as unknown as {
                      stage?: {
                        id: string;
                        name: string;
                        color: string;
                      } | null;
                    }
                  )?.stage;

                  return (
                    <tr
                      key={referral.id}
                      className="transition-colors hover:bg-primary-50 dark:hover:bg-primary-900"
                    >
                      {/* Referrer — link to contact */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-primary-800 dark:text-primary-100">
                        <Link
                          href={`/contacts/${referral.referrer_id}`}
                          className="text-primary-700 hover:text-primary-500 hover:underline dark:text-primary-300"
                        >
                          <span className="flex items-center gap-1.5">
                            {referral.referrer
                              ? getFullName(
                                  referral.referrer.first_name,
                                  referral.referrer.last_name ?? undefined
                                )
                              : "Unknown"}
                            {(
                              referral.referrer as unknown as {
                                generation?: number | null;
                              }
                            )?.generation != null && (
                              <span className="inline-flex rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                                Gen{" "}
                                {
                                  (
                                    referral.referrer as unknown as {
                                      generation: number;
                                    }
                                  ).generation
                                }
                              </span>
                            )}
                          </span>
                        </Link>
                      </td>

                      {/* Referred — link to contact */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-primary-800 dark:text-primary-100">
                        <Link
                          href={`/contacts/${referral.referred_id}`}
                          className="text-primary-700 hover:text-primary-500 hover:underline dark:text-primary-300"
                        >
                          <span className="flex items-center gap-1.5">
                            {referral.referred
                              ? getFullName(
                                  referral.referred.first_name,
                                  referral.referred.last_name ?? undefined
                                )
                              : "Unknown"}
                            {(
                              referral.referred as unknown as {
                                generation?: number | null;
                              }
                            )?.generation != null && (
                              <span className="inline-flex rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                Gen{" "}
                                {
                                  (
                                    referral.referred as unknown as {
                                      generation: number;
                                    }
                                  ).generation
                                }
                              </span>
                            )}
                          </span>
                        </Link>
                      </td>

                      {/* Type — inline select */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <TypeSelectCell
                          referral={referral}
                          onSave={(val) =>
                            saveField(referral.id, "referral_type", val)
                          }
                        />
                      </td>

                      {/* Pipeline Stage — from deal */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {dealStage ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: dealStage.color }}
                            />
                            <span className="text-sm text-primary-700 dark:text-primary-300">
                              {dealStage.name}
                            </span>
                          </span>
                        ) : (
                          <span className="text-primary-300 dark:text-primary-600">
                            --
                          </span>
                        )}
                      </td>

                      {/* Date — inline edit */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-primary-500 dark:text-primary-400">
                        <EditableCell
                          value={referral.referral_date}
                          displayValue={formatDate(referral.referral_date)}
                          type="date"
                          onSave={(val) =>
                            saveField(referral.id, "referral_date", val)
                          }
                        />
                      </td>

                      {/* Value — inline edit */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-primary-500 dark:text-primary-400">
                        <EditableCell
                          value={
                            referral.referral_value !== null
                              ? String(referral.referral_value)
                              : ""
                          }
                          displayValue={
                            referral.referral_value !== null
                              ? formatCurrency(referral.referral_value)
                              : "--"
                          }
                          type="number"
                          onSave={(val) =>
                            saveField(
                              referral.id,
                              "referral_value",
                              val ? Number(val) : null
                            )
                          }
                        />
                      </td>

                      {/* Deal — link */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-primary-800 dark:text-primary-100">
                        {referral.deal ? (
                          <Link
                            href={`/deals/${referral.deal_id}`}
                            className="text-primary-600 hover:text-primary-500 hover:underline dark:text-primary-400"
                          >
                            {referral.deal.name}
                          </Link>
                        ) : (
                          <span className="text-primary-300 dark:text-primary-600">
                            --
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-primary-200 pt-4 dark:border-primary-800">
              <p className="text-sm text-primary-500 dark:text-primary-400">
                Showing {page * PAGE_SIZE + 1} to{" "}
                {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}{" "}
                referrals
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className={cn(
                    "rounded-lg border border-primary-200 p-2 text-sm dark:border-primary-700",
                    page === 0
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-primary-50 dark:hover:bg-primary-800"
                  )}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm text-primary-700 dark:text-primary-300">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  className={cn(
                    "rounded-lg border border-primary-200 p-2 text-sm dark:border-primary-700",
                    page >= totalPages - 1
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-primary-50 dark:hover:bg-primary-800"
                  )}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Inline editable cell ─── */

function EditableCell({
  value,
  displayValue,
  type = "text",
  onSave,
}: {
  value: string;
  displayValue: string;
  type?: "text" | "date" | "number";
  onSave: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing, value]);

  async function commit() {
    setEditing(false);
    if (draft !== value) {
      await onSave(draft);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full rounded-md border border-primary-400 bg-white px-2 py-1 text-sm text-primary-800 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-primary-600 dark:bg-primary-900/50 dark:text-primary-100"
      />
    );
  }

  return (
    <div
      className="group/cell flex cursor-pointer items-center gap-1 rounded px-1 -mx-1 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/30"
      onClick={() => setEditing(true)}
    >
      <span className="flex-1">{displayValue || "--"}</span>
      <PencilIcon className="h-3 w-3 shrink-0 text-primary-300 opacity-0 transition-opacity group-hover/cell:opacity-100 dark:text-primary-600" />
    </div>
  );
}

/* ─── Type select cell ─── */

function TypeSelectCell({
  referral,
  onSave,
}: {
  referral: Referral;
  onSave: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editing) {
      setTimeout(() => selectRef.current?.focus(), 0);
    }
  }, [editing]);

  if (editing) {
    return (
      <select
        ref={selectRef}
        value={referral.referral_type}
        onChange={async (e) => {
          setEditing(false);
          if (e.target.value !== referral.referral_type) {
            await onSave(e.target.value);
          }
        }}
        onBlur={() => setEditing(false)}
        className="rounded-md border border-primary-400 bg-white px-2 py-1 text-sm text-primary-800 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-primary-600 dark:bg-primary-900/50 dark:text-primary-100"
      >
        {REFERRAL_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      className="group/cell flex cursor-pointer items-center gap-1 rounded px-1 -mx-1 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/30"
      onClick={() => setEditing(true)}
    >
      <Badge color={typeColors[referral.referral_type]}>
        {referral.referral_type}
      </Badge>
      <PencilIcon className="h-3 w-3 shrink-0 text-primary-300 opacity-0 transition-opacity group-hover/cell:opacity-100 dark:text-primary-600" />
    </div>
  );
}
