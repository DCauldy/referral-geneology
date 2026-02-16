"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContacts } from "@/lib/hooks/use-contacts";
import { DataTable, type Column } from "@/components/shared/data-table";
import { RELATIONSHIP_TYPES } from "@/lib/utils/constants";
import { getFullName, getInitials, formatDate, formatPhone } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Contact } from "@/types/database";
import { TagBadge } from "@/components/shared/tag-input";
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

interface ContactListProps {
  companyId?: string;
}

export function ContactList({ companyId }: ContactListProps) {
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
    companyId,
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
                <p className="text-xs text-primary-500 dark:text-primary-400">
                  {contact.job_title}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        render: (contact) => {
          const number = contact.mobile_phone || contact.phone;
          return (
            <span className="text-primary-600 dark:text-primary-400">
              {number ? formatPhone(number) : "--"}
            </span>
          );
        },
      },
      {
        key: "email",
        header: "Email",
        sortable: true,
        className: "hidden md:table-cell",
        render: (contact) => (
          <span className="text-primary-600 dark:text-primary-400">
            {contact.email ?? "--"}
          </span>
        ),
      },
      {
        key: "company",
        header: "Company",
        className: "hidden lg:table-cell",
        render: (contact) => (
          <span>{contact.company?.name ?? "--"}</span>
        ),
      },
      {
        key: "relationship_type",
        header: "Type",
        className: "hidden lg:table-cell",
        render: (contact) => (
          <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-800 dark:text-primary-300">
            {formatLabel(contact.relationship_type)}
          </span>
        ),
      },
      {
        key: "tags",
        header: "Tags",
        className: "hidden xl:table-cell",
        render: (contact) => {
          const tags = contact.tags ?? [];
          if (tags.length === 0) return <span className="text-primary-400">--</span>;
          const visible = tags.slice(0, 3);
          const overflow = tags.length - 3;
          return (
            <div className="flex flex-wrap gap-1">
              {visible.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
              {overflow > 0 && (
                <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-500 dark:bg-primary-800 dark:text-primary-400">
                  +{overflow}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "generation",
        header: "Generation",
        sortable: true,
        className: "hidden xl:table-cell",
        render: (contact) => {
          const gen = contact.generation;
          if (gen == null) return <span className="text-primary-400">--</span>;
          return (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                gen === 1
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              )}
            >
              Gen {gen}
            </span>
          );
        },
      },
      {
        key: "referral_score",
        header: "Score",
        sortable: true,
        className: "hidden xl:table-cell",
        render: (contact) => (
          <span className="font-medium">{contact.referral_score}</span>
        ),
      },
      {
        key: "created_at",
        header: "Created",
        sortable: true,
        className: "hidden lg:table-cell",
        render: (contact) => (
          <span className="text-primary-500 dark:text-primary-400">
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
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search contacts..."
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
            value={relationshipType}
            onChange={(e) => updateParams({ type: e.target.value })}
            className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
          >
            <option value="">All Types</option>
            {RELATIONSHIP_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>

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
        emptyMessage="No contacts yet. Add your first contact to get started."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-primary-200 pt-4 dark:border-zinc-800">
          <p className="text-sm text-primary-500 dark:text-primary-400">
            Showing {page * PAGE_SIZE + 1} to{" "}
            {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}{" "}
            contacts
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => updateParams({ page: String(page - 1) })}
              className={cn(
                "rounded-lg border border-primary-200 p-2 text-sm dark:border-primary-700",
                page === 0
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-primary-50 dark:hover:bg-zinc-800"
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
                  : "hover:bg-primary-50 dark:hover:bg-zinc-800"
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
