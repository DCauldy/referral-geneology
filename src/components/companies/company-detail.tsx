"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCompany } from "@/lib/hooks/use-companies";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatRelative, formatCurrency, formatNumber } from "@/lib/utils/format";
import { Skeleton } from "@/components/shared/loading-skeleton";
import {
  PencilSquareIcon,
  TrashIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

type TabKey = "overview" | "contacts" | "deals" | "activity";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "contacts", label: "Contacts" },
  { key: "deals", label: "Deals" },
  { key: "activity", label: "Activity" },
];

interface CompanyDetailProps {
  companyId: string;
}

export function CompanyDetail({ companyId }: CompanyDetailProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const toast = useToast();
  const { company, isLoading, error } = useCompany(companyId);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!company) return;
    if (!window.confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", company.id);

      if (error) throw error;
      toast.success("Company deleted", "The company has been removed.");
      router.push("/companies");
    } catch (err) {
      toast.error(
        "Failed to delete company",
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
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Company not found."}
        </p>
      </div>
    );
  }

  const initial = company.name.charAt(0).toUpperCase();

  const address = [
    company.address_line1,
    company.address_line2,
    [company.city, company.state_province].filter(Boolean).join(", "),
    company.postal_code,
    company.country,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {company.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
              {company.industry && (
                <span className="flex items-center gap-1">
                  <BuildingOfficeIcon className="h-3.5 w-3.5" />
                  {company.industry}
                </span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <GlobeAltIcon className="h-3.5 w-3.5" />
                  {company.website.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              )}
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <EnvelopeIcon className="h-3.5 w-3.5" />
                  {company.email}
                </a>
              )}
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <PhoneIcon className="h-3.5 w-3.5" />
                  {company.phone}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/companies/${company.id}/edit`}
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
          {/* Company Information */}
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Company Information
            </h3>
            <dl className="space-y-3">
              <DetailRow label="Name" value={company.name} />
              <DetailRow label="Industry" value={company.industry} />
              <DetailRow label="Website" value={company.website} isLink />
              <DetailRow label="Phone" value={company.phone} />
              <DetailRow label="Email" value={company.email} />
              <DetailRow
                label="Employees"
                value={
                  company.employee_count
                    ? formatNumber(company.employee_count)
                    : null
                }
              />
              <DetailRow
                label="Annual Revenue"
                value={
                  company.annual_revenue
                    ? formatCurrency(company.annual_revenue)
                    : null
                }
              />
            </dl>
          </div>

          {/* Address */}
          <div className="space-y-6">
            {address && (
              <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Address
                </h3>
                <div className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <span className="whitespace-pre-line">{address}</span>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Social
              </h3>
              <dl className="space-y-3">
                <DetailRow label="LinkedIn" value={company.linkedin_url} isLink />
              </dl>
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {company.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {company.tags && company.tags.length > 0 && (
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {company.tags.map((tag) => (
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
            Created {formatDate(company.created_at)} &middot; Last updated{" "}
            {formatRelative(company.updated_at)}
          </div>
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Associated contacts will appear here.
          </p>
        </div>
      )}

      {activeTab === "deals" && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Associated deals will appear here.
          </p>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Activity timeline will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value?: string | null;
  isLink?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-sm font-medium text-zinc-900 dark:text-white">
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-500 hover:underline"
          >
            {value.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
