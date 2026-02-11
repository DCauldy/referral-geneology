"use client";

import { useState, useCallback } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { useDirectory } from "@/lib/hooks/use-directory";
import { useTrustScore } from "@/lib/hooks/use-trust-score";
import { useNetworkSuggestions } from "@/lib/hooks/use-network-suggestions";
import { getInitials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { DirectoryProfile } from "@/types/database";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  BriefcaseIcon,
  TagIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const INDUSTRY_OPTIONS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Real Estate",
  "Legal",
  "Marketing",
  "Consulting",
  "Education",
  "Construction",
  "Retail",
  "Manufacturing",
  "Insurance",
];

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";

function DirectoryTrustBadge({ userId }: { userId: string }) {
  const { score } = useTrustScore(userId);

  if (!score || score.trust_rating === 0) return null;

  const rating = Math.round(score.trust_rating);
  const color =
    rating >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : rating >= 40
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-zinc-400";
  const totalExchanges = score.total_sent + score.total_received;

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium", color)}
      title={`Trust rating: ${rating}/100 based on ${totalExchanges} exchanges`}
    >
      <ShieldCheckIcon className="h-3 w-3" />
      {rating}
    </span>
  );
}

function ProfileCard({ profile }: { profile: DirectoryProfile }) {
  const initials = getInitials(
    profile.display_name.split(" ")[0],
    profile.display_name.split(" ").slice(1).join(" ") || undefined
  );

  return (
    <div className="group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* Avatar + Name */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {profile.display_name}
            </h3>
            <DirectoryTrustBadge userId={profile.user_id} />
          </div>
          {profile.company_name && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
              <BriefcaseIcon className="h-3 w-3 shrink-0" />
              {profile.company_name}
            </p>
          )}
          {profile.location && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
              <MapPinIcon className="h-3 w-3 shrink-0" />
              {profile.location}
            </p>
          )}
        </div>
      </div>

      {/* Industry */}
      {profile.industry && (
        <span className="mt-3 inline-flex w-fit rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {profile.industry}
        </span>
      )}

      {/* Bio */}
      {profile.bio && (
        <p className="mt-3 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
          {profile.bio}
        </p>
      )}

      {/* Specialties */}
      {profile.specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {profile.specialties.slice(0, 3).map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-0.5 rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            >
              <TagIcon className="h-2.5 w-2.5" />
              {s}
            </span>
          ))}
          {profile.specialties.length > 3 && (
            <span className="rounded-md px-1.5 py-0.5 text-[10px] text-zinc-500">
              +{profile.specialties.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Referral status + action */}
      <div className="mt-auto flex items-center justify-between pt-4">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            profile.accepts_referrals
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
          )}
        >
          {profile.accepts_referrals ? "Accepts Referrals" : "Not Accepting"}
        </span>
      </div>
    </div>
  );
}

function SuggestedForYou() {
  const { canAccessAI } = usePlanLimits();
  const { data, isLoading, error, generate } = useNetworkSuggestions();

  if (!canAccessAI) return null;

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-800/50 dark:bg-purple-950/20">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-900 dark:text-purple-200">
          <SparklesIcon className="h-4 w-4 text-purple-500" />
          Suggested for You
        </h3>
        <button
          onClick={generate}
          disabled={isLoading}
          className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
        >
          <SparklesIcon className="h-3 w-3" />
          {isLoading ? "Analyzing..." : data ? "Refresh" : "Find Matches"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {!data && !isLoading && !error && (
        <p className="mt-3 text-xs text-purple-700 dark:text-purple-300">
          Use AI to find the best network partners based on your profile, specialties, and exchange history.
        </p>
      )}

      {data && (
        <div className="mt-3 space-y-3">
          {data.network_insight && (
            <p className="text-xs italic text-purple-700 dark:text-purple-300">
              {data.network_insight}
            </p>
          )}

          {data.recommendations.length === 0 ? (
            <p className="text-xs text-purple-600 dark:text-purple-400">
              No suggestions available yet. More growers need to list themselves in the directory.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {data.recommendations.map((rec) => (
                <div
                  key={rec.user_id}
                  className="rounded-lg border border-purple-200 bg-white p-3 dark:border-purple-800/50 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-semibold text-zinc-900 dark:text-white">
                      {rec.name}
                    </p>
                    <span className="ml-1 shrink-0 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {rec.match_score}%
                    </span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {rec.reasons.slice(0, 2).map((reason, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-zinc-500 dark:text-zinc-400"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DirectoryPage() {
  const { canExchangeReferrals } = usePlanLimits();
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [page, setPage] = useState(1);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 300);
      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  const { profiles, total, totalPages, isLoading } = useDirectory({
    search: debouncedSearch,
    industry,
    location,
    specialty,
    page,
  });

  // Upgrade CTA for free plan
  if (!canExchangeReferrals) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Directory" }]} />
        <div className="mx-auto max-w-lg py-16 text-center">
          <ArrowTopRightOnSquareIcon className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Discover fellow growers in the network
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            The directory connects you with other professionals to share new growth and plant roots together. Upgrade to a paid plan to browse and be listed.
          </p>
          <Link
            href="/settings/billing"
            className="mt-6 inline-flex rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            Upgrade Plan
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Directory" }]} />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Directory
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Discover growers across the network to share seeds and cultivate new roots together.
          </p>
        </div>

        {/* AI Suggestions */}
        <SuggestedForYou />

        {/* Search + Filters */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="w-full sm:w-64">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or company..."
                className={cn(inputClassName, "pl-8")}
              />
            </div>
          </div>

          {/* Industry */}
          <div className="w-full sm:w-40">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value);
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="">All Industries</option>
              {INDUSTRY_OPTIONS.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="w-full sm:w-40">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setPage(1);
              }}
              placeholder="City or region..."
              className={inputClassName}
            />
          </div>

          {/* Specialty */}
          <div className="w-full sm:w-40">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Specialty
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => {
                setSpecialty(e.target.value);
                setPage(1);
              }}
              placeholder="e.g., Web Design..."
              className={inputClassName}
            />
          </div>

          {/* Clear */}
          {(debouncedSearch || industry || location || specialty) && (
            <button
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setIndustry("");
                setLocation("");
                setSpecialty("");
                setPage(1);
              }}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {isLoading ? "Searching..." : `${total} grower${total !== 1 ? "s" : ""} found`}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[220px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
              />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MagnifyingGlassIcon className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              {debouncedSearch || industry || location || specialty
                ? "No growers match your filters. Try broadening your search."
                : "The directory is waiting for its first growers. List yourself in Settings to get started."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronLeftIcon className="h-3 w-3" />
              Previous
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Next
              <ChevronRightIcon className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
