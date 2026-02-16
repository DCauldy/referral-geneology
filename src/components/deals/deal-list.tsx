"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeals, usePipelineStages } from "@/lib/hooks/use-deals";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatCurrency, formatDate, getFullName } from "@/lib/utils/format";
import { linkWonDealToReferrals } from "@/lib/utils/deal-referral-link";
import { cn } from "@/lib/utils/cn";
import type { Deal } from "@/types/database";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 25;

interface DealListProps {
  contactId?: string;
  companyId?: string;
}

interface EditingCell {
  dealId: string;
  field: string;
}

export function DealList({ contactId, companyId }: DealListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();

  const search = searchParams.get("search") ?? "";
  const stageId = searchParams.get("stage") ?? "";
  const page = parseInt(searchParams.get("page") ?? "0", 10);

  const [searchInput, setSearchInput] = useState(search);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const { deals, totalCount, isLoading, refresh } = useDeals({
    search,
    stageId,
    contactId,
    companyId,
    page,
    pageSize: PAGE_SIZE,
  });

  const { stages } = usePipelineStages();
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement && inputRef.current.type !== "date") {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    if (!("page" in updates)) {
      params.delete("page");
    }
    router.push(`/deals?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchInput });
  }

  function startEditing(dealId: string, field: string, currentValue: string) {
    setEditingCell({ dealId, field });
    setEditValue(currentValue);
  }

  function cancelEditing() {
    setEditingCell(null);
    setEditValue("");
  }

  async function saveEdit(deal: Deal) {
    if (!editingCell) return;
    const { field } = editingCell;
    const trimmed = editValue.trim();

    // Get old value for comparison
    const oldRaw = (deal as unknown as Record<string, unknown>)[field];
    const oldValue = oldRaw != null ? String(oldRaw) : "";

    // Skip if unchanged
    if (trimmed === oldValue) {
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
      let updateVal: unknown = trimmed || null;

      // Convert numeric fields
      if (field === "value") {
        updateVal = trimmed ? Number(trimmed) : null;
      }

      const { error } = await supabase
        .from("deals")
        .update({ [field]: updateVal })
        .eq("id", deal.id);

      if (error) {
        toast.error("Failed to save", error.message);
      } else {
        await refresh();
      }
    } catch {
      toast.error("Failed to save", "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
      cancelEditing();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, deal: Deal) {
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(deal);
    }
  }

  function isEditing(dealId: string, field: string) {
    return editingCell?.dealId === dealId && editingCell?.field === field;
  }

  // Editable cell wrapper
  function EditableCell({
    deal,
    field,
    currentValue,
    children,
    inputType = "text",
  }: {
    deal: Deal;
    field: string;
    currentValue: string;
    children: React.ReactNode;
    inputType?: "text" | "date";
  }) {
    if (isEditing(deal.id, field)) {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={inputType}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveEdit(deal)}
          onKeyDown={(e) => handleKeyDown(e, deal)}
          disabled={isSaving}
          className="w-full rounded-md border border-primary-400 bg-white px-2 py-1 text-sm text-primary-800 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-primary-600 dark:bg-primary-900/50 dark:text-primary-100"
        />
      );
    }

    return (
      <div
        className="group/cell flex cursor-pointer items-center gap-1 rounded px-1 -mx-1 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/30"
        onClick={(e) => {
          e.stopPropagation();
          startEditing(deal.id, field, currentValue);
        }}
      >
        <span className="flex-1">{children}</span>
        <PencilIcon className="h-3 w-3 shrink-0 text-primary-300 opacity-0 transition-opacity group-hover/cell:opacity-100 dark:text-primary-600" />
      </div>
    );
  }

  // Select cell for stage
  function StageSelectCell({ deal }: { deal: Deal }) {
    if (isEditing(deal.id, "stage_id")) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            // Auto-save on select
            const newVal = e.target.value || null;
            const newStage = stages.find((s) => s.id === newVal);
            const updatePayload: Record<string, unknown> = { stage_id: newVal };
            if (newStage?.is_won) {
              updatePayload.status = "won";
              updatePayload.actual_close_date = new Date().toISOString().split("T")[0];
            } else if (newStage?.is_lost) {
              updatePayload.status = "lost";
              updatePayload.actual_close_date = new Date().toISOString().split("T")[0];
            }
            setIsSaving(true);
            supabase
              .from("deals")
              .update(updatePayload)
              .eq("id", deal.id)
              .then(async ({ error }) => {
                if (error) {
                  toast.error("Failed to save", error.message);
                } else {
                  if (newStage?.is_won && org) {
                    await linkWonDealToReferrals(supabase, deal.id, org.id);
                  }
                  refresh();
                }
                setIsSaving(false);
                cancelEditing();
              });
          }}
          onBlur={() => {
            setTimeout(() => cancelEditing(), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelEditing();
          }}
          disabled={isSaving}
          className="w-full rounded-md border border-primary-400 bg-white px-2 py-1 text-sm text-primary-800 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-primary-600 dark:bg-primary-900/50 dark:text-primary-100"
        >
          <option value="">None</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      );
    }

    return (
      <div
        className="group/cell flex cursor-pointer items-center gap-1 rounded px-1 -mx-1 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/30"
        onClick={(e) => {
          e.stopPropagation();
          startEditing(deal.id, "stage_id", deal.stage_id ?? "");
        }}
      >
        <span className="flex-1">
          {deal.stage ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: deal.stage.color }}
              />
              <span className="text-sm text-primary-700 dark:text-primary-300">
                {deal.stage.name}
              </span>
            </span>
          ) : (
            <span className="text-primary-300 dark:text-primary-600">--</span>
          )}
        </span>
        <PencilIcon className="h-3 w-3 shrink-0 text-primary-300 opacity-0 transition-opacity group-hover/cell:opacity-100 dark:text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search deals..."
              className="block w-full rounded-lg border border-primary-200 py-2 pl-9 pr-3 text-sm text-primary-800 placeholder:text-primary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-100 dark:placeholder:text-primary-600"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={stageId}
            onChange={(e) => updateParams({ stage: e.target.value })}
            className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
          >
            <option value="">All Stages</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>

          <Link
            href="/deals/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Deal
          </Link>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-primary-100 dark:bg-primary-800" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-primary-200 dark:border-primary-800">
          <table className="min-w-full divide-y divide-primary-200 dark:divide-primary-800">
            <thead className="bg-primary-50 dark:bg-primary-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-500 uppercase dark:text-primary-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-500 uppercase dark:text-primary-400">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-500 uppercase dark:text-primary-400">
                  Pipeline Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-500 uppercase dark:text-primary-400">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-500 uppercase dark:text-primary-400">
                  Expected Close
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-500 uppercase dark:text-primary-400">
                  Actual Close
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-200 bg-white dark:divide-primary-800 dark:bg-primary-950">
              {deals.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-primary-500 dark:text-primary-400"
                  >
                    No deals yet. Add your first deal to get started.
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="transition-colors hover:bg-primary-50 dark:hover:bg-primary-900"
                  >
                    {/* Name — editable, also links to detail */}
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-primary-800 dark:text-primary-100">
                      <EditableCell
                        deal={deal}
                        field="name"
                        currentValue={deal.name}
                      >
                        <Link
                          href={`/deals/${deal.id}`}
                          className="font-medium text-primary-700 hover:text-primary-500 hover:underline dark:text-primary-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deal.name}
                        </Link>
                      </EditableCell>
                    </td>

                    {/* Value — editable */}
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-primary-800 dark:text-primary-100">
                      <EditableCell
                        deal={deal}
                        field="value"
                        currentValue={deal.value != null ? String(deal.value) : ""}
                      >
                        <span className="font-medium">
                          {deal.value != null
                            ? formatCurrency(deal.value, deal.currency)
                            : <span className="text-primary-300 dark:text-primary-600">--</span>}
                        </span>
                      </EditableCell>
                    </td>

                    {/* Stage — select */}
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StageSelectCell deal={deal} />
                    </td>

                    {/* Contact — read-only link */}
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-primary-800 dark:text-primary-100">
                      {deal.contact ? (
                        <Link
                          href={`/contacts/${deal.contact.id}`}
                          className="text-primary-600 hover:text-primary-500 hover:underline dark:text-primary-400"
                        >
                          {getFullName(
                            deal.contact.first_name,
                            deal.contact.last_name ?? undefined
                          )}
                        </Link>
                      ) : (
                        <span className="text-primary-300 dark:text-primary-600">--</span>
                      )}
                    </td>

                    {/* Expected Close — editable date */}
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-primary-500 dark:text-primary-400">
                      <EditableCell
                        deal={deal}
                        field="expected_close_date"
                        currentValue={deal.expected_close_date?.split("T")[0] ?? ""}
                        inputType="date"
                      >
                        {deal.expected_close_date
                          ? formatDate(deal.expected_close_date)
                          : <span className="text-primary-300 dark:text-primary-600">--</span>}
                      </EditableCell>
                    </td>

                    {/* Actual Close — editable date */}
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-primary-500 dark:text-primary-400">
                      <EditableCell
                        deal={deal}
                        field="actual_close_date"
                        currentValue={deal.actual_close_date?.split("T")[0] ?? ""}
                        inputType="date"
                      >
                        {deal.actual_close_date
                          ? formatDate(deal.actual_close_date)
                          : <span className="text-primary-300 dark:text-primary-600">--</span>}
                      </EditableCell>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-primary-200 pt-4 dark:border-primary-800">
          <p className="text-sm text-primary-500 dark:text-primary-400">
            Showing {page * PAGE_SIZE + 1} to{" "}
            {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}{" "}
            deals
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => updateParams({ page: String(page - 1) })}
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
              onClick={() => updateParams({ page: String(page + 1) })}
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
    </div>
  );
}
