"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeals, usePipelineStages } from "@/lib/hooks/use-deals";
import { DataTable, type Column } from "@/components/shared/data-table";
import { DEAL_STATUSES } from "@/lib/utils/constants";
import { formatCurrency, formatDate, getFullName } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Deal } from "@/types/database";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 25;

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  won: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  lost: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  abandoned: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function DealList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const stageId = searchParams.get("stage") ?? "";
  const page = parseInt(searchParams.get("page") ?? "0", 10);

  const [searchInput, setSearchInput] = useState(search);

  const { deals, totalCount, isLoading } = useDeals({
    search,
    status,
    stageId,
    page,
    pageSize: PAGE_SIZE,
  });

  const { stages } = usePipelineStages();
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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

  const columns: Column<Deal>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (deal) => (
          <span className="font-medium">{deal.name}</span>
        ),
      },
      {
        key: "value",
        header: "Value",
        sortable: true,
        render: (deal) => (
          <span className="font-medium">
            {deal.value != null
              ? formatCurrency(deal.value, deal.currency)
              : "--"}
          </span>
        ),
      },
      {
        key: "stage",
        header: "Stage",
        render: (deal) =>
          deal.stage ? (
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${deal.stage.color}20`,
                color: deal.stage.color,
              }}
            >
              {deal.stage.name}
            </span>
          ) : (
            <span className="text-zinc-400">--</span>
          ),
      },
      {
        key: "contact",
        header: "Contact",
        render: (deal) =>
          deal.contact ? (
            <span>
              {getFullName(
                deal.contact.first_name,
                deal.contact.last_name ?? undefined
              )}
            </span>
          ) : (
            <span className="text-zinc-400">--</span>
          ),
      },
      {
        key: "company",
        header: "Company",
        render: (deal) => (
          <span>{deal.company?.name ?? "--"}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (deal) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusColors[deal.status] ?? statusColors.open
            )}
          >
            {formatLabel(deal.status)}
          </span>
        ),
      },
      {
        key: "expected_close_date",
        header: "Expected Close",
        sortable: true,
        render: (deal) => (
          <span className="text-zinc-500 dark:text-zinc-400">
            {deal.expected_close_date
              ? formatDate(deal.expected_close_date)
              : "--"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search deals..."
              className="block w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <option value="">All Statuses</option>
            {DEAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatLabel(s)}
              </option>
            ))}
          </select>

          <select
            value={stageId}
            onChange={(e) => updateParams({ stage: e.target.value })}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
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
      <DataTable
        columns={columns}
        data={deals}
        keyExtractor={(d) => d.id}
        onRowClick={(d) => router.push(`/deals/${d.id}`)}
        isLoading={isLoading}
        emptyMessage="No deals found. Create your first deal to get started."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing {page * PAGE_SIZE + 1} to{" "}
            {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}{" "}
            deals
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => updateParams({ page: String(page - 1) })}
              className={cn(
                "rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-700",
                page === 0
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm text-zinc-700 dark:text-zinc-300">
              Page {page + 1} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => updateParams({ page: String(page + 1) })}
              className={cn(
                "rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-700",
                page >= totalPages - 1
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
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
