"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDeal } from "@/lib/hooks/use-deals";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils/cn";
import {
  formatCurrency,
  formatDate,
  formatRelative,
  getFullName,
} from "@/lib/utils/format";
import { Skeleton } from "@/components/shared/loading-skeleton";
import {
  PencilSquareIcon,
  TrashIcon,
  CurrencyDollarIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

type TabKey = "overview" | "activity" | "documents";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "activity", label: "Activity" },
  { key: "documents", label: "Documents" },
];

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const statusColors: Record<string, string> = {
  open: "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300",
  won: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  lost: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  abandoned: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

interface DealDetailProps {
  dealId: string;
}

export function DealDetail({ dealId }: DealDetailProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const toast = useToast();
  const { deal, isLoading, error } = useDeal(dealId);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deal) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this deal? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", deal.id);

      if (error) throw error;
      toast.success("Deal deleted", "The deal has been removed.");
      router.push("/deals");
    } catch (err) {
      toast.error(
        "Failed to delete deal",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Deal not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {deal.name}
            </h2>
            {deal.stage && (
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${deal.stage.color}20`,
                  color: deal.stage.color,
                }}
              >
                {deal.stage.name}
              </span>
            )}
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusColors[deal.status] ?? statusColors.open
              )}
            >
              {formatLabel(deal.status)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            {deal.value != null && (
              <span className="flex items-center gap-1 font-semibold text-zinc-900 dark:text-white">
                <CurrencyDollarIcon className="h-4 w-4" />
                {formatCurrency(deal.value, deal.currency)}
              </span>
            )}
            {deal.contact && (
              <Link
                href={`/contacts/${deal.contact.id}`}
                className="flex items-center gap-1 hover:text-primary-600"
              >
                <UserIcon className="h-3.5 w-3.5" />
                {getFullName(
                  deal.contact.first_name,
                  deal.contact.last_name ?? undefined
                )}
              </Link>
            )}
            {deal.company && (
              <Link
                href={`/companies/${deal.company.id}`}
                className="flex items-center gap-1 hover:text-primary-600"
              >
                <BuildingOfficeIcon className="h-3.5 w-3.5" />
                {deal.company.name}
              </Link>
            )}
            {deal.expected_close_date && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                Expected close: {formatDate(deal.expected_close_date)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/deals/${deal.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <TrashIcon className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Deal Information */}
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Deal Information
            </h3>
            <dl className="space-y-3">
              <DetailRow label="Name" value={deal.name} />
              <DetailRow
                label="Value"
                value={
                  deal.value != null
                    ? formatCurrency(deal.value, deal.currency)
                    : null
                }
              />
              <DetailRow label="Currency" value={deal.currency} />
              <DetailRow label="Type" value={formatLabel(deal.deal_type)} />
              <DetailRow
                label="Probability"
                value={
                  deal.probability != null ? `${deal.probability}%` : null
                }
              />
              <DetailRow label="Status" value={formatLabel(deal.status)} />
              <DetailRow label="Stage" value={deal.stage?.name} />
            </dl>
          </div>

          {/* Relations & Dates */}
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Relations
              </h3>
              <dl className="space-y-3">
                <DetailRow
                  label="Contact"
                  value={
                    deal.contact
                      ? getFullName(
                          deal.contact.first_name,
                          deal.contact.last_name ?? undefined
                        )
                      : null
                  }
                />
                <DetailRow label="Company" value={deal.company?.name} />
              </dl>
            </div>

            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Dates
              </h3>
              <dl className="space-y-3">
                <DetailRow
                  label="Expected Close"
                  value={
                    deal.expected_close_date
                      ? formatDate(deal.expected_close_date)
                      : null
                  }
                />
                <DetailRow
                  label="Actual Close"
                  value={
                    deal.actual_close_date
                      ? formatDate(deal.actual_close_date)
                      : null
                  }
                />
              </dl>
            </div>
          </div>

          {/* Description */}
          {deal.description && (
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {deal.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {deal.notes && (
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Notes
              </h3>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {deal.notes}
              </p>
            </div>
          )}

          {/* Tags */}
          {deal.tags && deal.tags.length > 0 && (
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {deal.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-zinc-400 dark:text-zinc-500 lg:col-span-2">
            Created {formatDate(deal.created_at)} &middot; Last updated{" "}
            {formatRelative(deal.updated_at)}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Activity timeline will appear here.
          </p>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Attached documents will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-sm font-medium text-zinc-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
