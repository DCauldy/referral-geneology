"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCompanies } from "@/lib/hooks/use-companies";
import { DataTable, type Column } from "@/components/shared/data-table";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Company } from "@/types/database";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 25;

export function CompanyList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const industry = searchParams.get("industry") ?? "";
  const page = parseInt(searchParams.get("page") ?? "0", 10);

  const [searchInput, setSearchInput] = useState(search);

  const { companies, totalCount, isLoading } = useCompanies({
    search,
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
    if (!("page" in updates)) {
      params.delete("page");
    }
    router.push(`/companies?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchInput });
  }

  const columns: Column<Company>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (company) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt=""
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <BuildingOfficeIcon className="h-4 w-4 text-zinc-400" />
              )}
            </div>
            <span className="font-medium">{company.name}</span>
          </div>
        ),
      },
      {
        key: "industry",
        header: "Industry",
        render: (company) => (
          <span className="text-zinc-600 dark:text-zinc-400">
            {company.industry ?? "--"}
          </span>
        ),
      },
      {
        key: "website",
        header: "Website",
        render: (company) =>
          company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary-600 hover:text-primary-500 hover:underline"
            >
              {company.website.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          ) : (
            <span className="text-zinc-400">--</span>
          ),
      },
      {
        key: "contacts",
        header: "Contacts",
        render: (company) => (
          <span>{company._contact_count ?? "--"}</span>
        ),
      },
      {
        key: "annual_revenue",
        header: "Revenue",
        sortable: true,
        render: (company) => (
          <span className="text-zinc-600 dark:text-zinc-400">
            {company.annual_revenue
              ? formatCurrency(company.annual_revenue)
              : "--"}
          </span>
        ),
      },
      {
        key: "created_at",
        header: "Created",
        sortable: true,
        render: (company) => (
          <span className="text-zinc-500 dark:text-zinc-400">
            {formatDate(company.created_at)}
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
              placeholder="Search companies..."
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
          <input
            type="text"
            value={industry}
            onChange={(e) => updateParams({ industry: e.target.value })}
            placeholder="Industry"
            className="w-36 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder:text-zinc-500"
          />

          <Link
            href="/companies/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Company
          </Link>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={companies}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => router.push(`/companies/${c.id}`)}
        isLoading={isLoading}
        emptyMessage="No roots planted yet. Add your first company to anchor your network."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing {page * PAGE_SIZE + 1} to{" "}
            {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}{" "}
            companies
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
