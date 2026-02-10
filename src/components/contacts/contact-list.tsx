"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContacts } from "@/lib/hooks/use-contacts";
import { DataTable, type Column } from "@/components/shared/data-table";
import { RELATIONSHIP_TYPES } from "@/lib/utils/constants";
import { getFullName, getInitials, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Contact } from "@/types/database";
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

export function ContactList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const relationshipType = searchParams.get("type") ?? "";
  const industry = searchParams.get("industry") ?? "";
  const page = parseInt(searchParams.get("page") ?? "0", 10);

  const [searchInput, setSearchInput] = useState(search);

  const { contacts, totalCount, isLoading } = useContacts({
    search,
    relationshipType,
    industry,
    page,
    pageSize: PAGE_SIZE,
  });

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
    // Reset to page 0 when filters change (unless we're explicitly setting page)
    if (!("page" in updates)) {
      params.delete("page");
    }
    router.push(`/contacts?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchInput });
  }

  const columns: Column<Contact>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (contact) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {contact.profile_photo_url ? (
                <img
                  src={contact.profile_photo_url}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                getInitials(contact.first_name, contact.last_name ?? undefined)
              )}
            </div>
            <div>
              <p className="font-medium">
                {getFullName(contact.first_name, contact.last_name ?? undefined)}
              </p>
              {contact.job_title && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {contact.job_title}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        sortable: true,
        render: (contact) => (
          <span className="text-zinc-600 dark:text-zinc-400">
            {contact.email ?? "--"}
          </span>
        ),
      },
      {
        key: "company",
        header: "Company",
        render: (contact) => (
          <span>{contact.company?.name ?? "--"}</span>
        ),
      },
      {
        key: "relationship_type",
        header: "Type",
        render: (contact) => (
          <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {formatLabel(contact.relationship_type)}
          </span>
        ),
      },
      {
        key: "referral_score",
        header: "Score",
        sortable: true,
        render: (contact) => (
          <span className="font-medium">{contact.referral_score}</span>
        ),
      },
      {
        key: "created_at",
        header: "Created",
        sortable: true,
        render: (contact) => (
          <span className="text-zinc-500 dark:text-zinc-400">
            {formatDate(contact.created_at)}
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
              placeholder="Search contacts..."
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
            value={relationshipType}
            onChange={(e) => updateParams({ type: e.target.value })}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <option value="">All Types</option>
            {RELATIONSHIP_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={industry}
            onChange={(e) => updateParams({ industry: e.target.value })}
            placeholder="Industry"
            className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder:text-zinc-500"
          />

          <Link
            href="/contacts/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Contact
          </Link>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={contacts}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => router.push(`/contacts/${c.id}`)}
        isLoading={isLoading}
        emptyMessage="No contacts found. Add your first contact to get started."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing {page * PAGE_SIZE + 1} to{" "}
            {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}{" "}
            contacts
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
