"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEmailTemplates } from "@/lib/hooks/use-email-templates";
import { DataTable, type Column } from "@/components/shared/data-table";
import { formatDate } from "@/lib/utils/format";
import type { EmailTemplate } from "@/types/database";
import {
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export function EmailTemplateList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const showArchived = searchParams.get("archived") === "true";
  const [searchInput, setSearchInput] = useState(search);

  const { templates, isLoading } = useEmailTemplates({
    search,
    showArchived,
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
    router.push(`/automations/templates?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchInput });
  }

  const columns: Column<EmailTemplate>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (t) => (
          <div>
            <p className="font-medium">{t.name}</p>
            {t.is_archived && (
              <span className="text-xs text-zinc-400">Archived</span>
            )}
          </div>
        ),
      },
      {
        key: "subject",
        header: "Subject",
        render: (t) => (
          <span className="text-zinc-600 dark:text-zinc-400">
            {t.subject || "--"}
          </span>
        ),
      },
      {
        key: "created_at",
        header: "Created",
        sortable: true,
        render: (t) => (
          <span className="text-zinc-500 dark:text-zinc-400">
            {formatDate(t.created_at)}
          </span>
        ),
      },
      {
        key: "updated_at",
        header: "Updated",
        sortable: true,
        render: (t) => (
          <span className="text-zinc-500 dark:text-zinc-400">
            {formatDate(t.updated_at)}
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
              placeholder="Search templates..."
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
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) =>
                updateParams({ archived: e.target.checked ? "true" : "" })
              }
              className="rounded border-zinc-300 text-primary-600 focus:ring-primary-500 dark:border-zinc-600"
            />
            Show archived
          </label>

          <Link
            href="/automations/templates/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            New Template
          </Link>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={templates}
        keyExtractor={(t) => t.id}
        onRowClick={(t) => router.push(`/automations/templates/${t.id}`)}
        isLoading={isLoading}
        emptyMessage="No letters yet. Craft your first template to start reaching your branches."
      />
    </div>
  );
}
