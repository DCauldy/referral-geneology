"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAutomations } from "@/lib/hooks/use-automations";
import { DataTable, type Column } from "@/components/shared/data-table";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { AUTOMATION_STATUSES } from "@/lib/utils/constants";
import type { Automation, AutomationStatus } from "@/types/database";
import {
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

const STATUS_COLORS: Record<AutomationStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  paused:
    "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300",
  archived: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

function formatLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function AutomationList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const statusFilter = (searchParams.get("status") ?? "") as
    | AutomationStatus
    | "";
  const [searchInput, setSearchInput] = useState(search);

  const { automations, isLoading } = useAutomations({
    search,
    status: statusFilter || undefined,
  });

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`/automations?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchInput });
  }

  const columns: Column<Automation & { _step_count?: number }>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (a) => (
          <div>
            <p className="font-medium">{a.name}</p>
            {a.description && (
              <p className="max-w-xs truncate text-xs text-zinc-500 dark:text-zinc-400">
                {a.description}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (a) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              STATUS_COLORS[a.status]
            )}
          >
            {a.status}
          </span>
        ),
      },
      {
        key: "steps",
        header: "Steps",
        render: (a) => (
          <span className="text-zinc-600 dark:text-zinc-400">
            {a._step_count ?? 0}
          </span>
        ),
      },
      {
        key: "enrolled",
        header: "Enrolled",
        render: (a) => (
          <span className="text-zinc-600 dark:text-zinc-400">
            {a._enrollment_count ?? 0}
          </span>
        ),
      },
      {
        key: "stats_sent",
        header: "Sent",
        render: (a) => {
          const stats = a.stats as Record<string, number> | null;
          return (
            <span className="text-zinc-600 dark:text-zinc-400">
              {stats?.sent ?? 0}
            </span>
          );
        },
      },
      {
        key: "stats_opened",
        header: "Open Rate",
        render: (a) => {
          const stats = a.stats as Record<string, number> | null;
          const sent = stats?.sent ?? 0;
          const opened = stats?.opened ?? 0;
          const rate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
          return (
            <span className="text-zinc-600 dark:text-zinc-400">{rate}%</span>
          );
        },
      },
      {
        key: "created_at",
        header: "Created",
        sortable: true,
        render: (a) => (
          <span className="text-zinc-500 dark:text-zinc-400">
            {formatDate(a.created_at)}
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
              placeholder="Search automations..."
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
            value={statusFilter}
            onChange={(e) => updateParams({ status: e.target.value })}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <option value="">All Statuses</option>
            {AUTOMATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatLabel(s)}
              </option>
            ))}
          </select>

          <Link
            href="/automations/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            New Automation
          </Link>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={automations}
        keyExtractor={(a) => a.id}
        onRowClick={(a) => router.push(`/automations/${a.id}`)}
        isLoading={isLoading}
        emptyMessage="No nurture sequences yet. Create your first automation to tend your branches on autopilot."
      />
    </div>
  );
}
