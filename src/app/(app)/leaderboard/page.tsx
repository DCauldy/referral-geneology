"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import { getInitials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  TrophyIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        3
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
      {rank}
    </span>
  );
}

function LeaderboardTable({
  scope,
  currentUserId,
}: {
  scope: "org" | "directory";
  currentUserId: string | null;
}) {
  const { entries, isLoading, error } = useLeaderboard(scope);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ChartBarSquareIcon className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          No users on the leaderboard yet. Start earning achievements to climb the ranks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry, i) => {
        const name = entry.display_name || entry.full_name || "User";
        const nameParts = name.split(" ");
        const initials = getInitials(nameParts[0], nameParts.slice(1).join(" ") || undefined);
        const isCurrentUser = entry.user_id === currentUserId;

        return (
          <div
            key={entry.user_id}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
              isCurrentUser
                ? "bg-primary-50 ring-1 ring-primary-200 dark:bg-primary-950/20 dark:ring-primary-800"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            )}
          >
            <RankBadge rank={i + 1} />

            {/* Avatar */}
            {entry.avatar_url ? (
              <img
                src={entry.avatar_url}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {initials}
              </div>
            )}

            {/* Name + company */}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm font-medium",
                  isCurrentUser
                    ? "text-primary-700 dark:text-primary-300"
                    : "text-zinc-900 dark:text-white"
                )}
              >
                {name}
                {isCurrentUser && (
                  <span className="ml-1.5 text-xs font-normal text-primary-500">
                    (You)
                  </span>
                )}
              </p>
              {entry.company_name && (
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {entry.company_name}
                </p>
              )}
            </div>

            {/* Points + achievements */}
            <div className="text-right">
              <p className="flex items-center gap-1 text-sm font-semibold text-zinc-900 dark:text-white">
                <TrophyIcon className="h-3.5 w-3.5 text-yellow-500" />
                {entry.total_points}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {entry.achievement_count} badge{entry.achievement_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage() {
  const { isFreePlan, isTeamPlan } = usePlanLimits();
  const [scope, setScope] = useState<"org" | "directory">(
    isTeamPlan ? "org" : "directory"
  );

  // Free plan: upgrade CTA
  if (isFreePlan) {
    return (
      <>
        <div className="mx-auto max-w-lg py-16 text-center">
          <ChartBarSquareIcon className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            See who builds the strongest referral network
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            The leaderboard ranks users by achievements and points. Upgrade to a paid plan to see where you stand.
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

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Leaderboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            See who builds the strongest referral network.
          </p>
        </div>

        {/* Tab switcher (team plan only) */}
        {isTeamPlan && (
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              onClick={() => setScope("org")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                scope === "org"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              )}
            >
              My Team
            </button>
            <button
              onClick={() => setScope("directory")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                scope === "directory"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              )}
            >
              All Users
            </button>
          </div>
        )}

        {/* Leaderboard */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <LeaderboardTable scope={scope} currentUserId={null} />
        </div>
      </div>
    </>
  );
}
