"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { formatRelative } from "@/lib/utils/format";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";
import type { Activity } from "@/types/database";

const activityIcons: Record<string, React.ReactElement> = {
  note: DUOTONE_ICONS.DocumentTextIcon,
  call: DUOTONE_ICONS.UserPlusIcon,
  email: DUOTONE_ICONS.PaperAirplaneIcon,
  meeting: DUOTONE_ICONS.UsersIcon,
  deal_created: DUOTONE_ICONS.CurrencyDollarIcon,
  deal_won: DUOTONE_ICONS.TrophyIcon,
  deal_lost: DUOTONE_ICONS.ArrowsRightLeftIcon,
  referral_made: DUOTONE_ICONS.ArrowUpTrayIcon,
  referral_received: DUOTONE_ICONS.InboxIcon,
  contact_created: DUOTONE_ICONS.UserPlusIcon,
};

const fallbackIcon = DUOTONE_ICONS.DocumentTextIcon;

export function RecentActivity() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      if (!org) return;

      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setActivities(data || []);
      setIsLoading(false);
    }

    fetchActivities();
  }, [supabase, org]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
        <div className="h-6 w-32 animate-pulse rounded bg-primary-100 dark:bg-primary-800" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-800 dark:text-primary-100">
        <div className="flex h-6 w-6 items-center justify-center">
          {DUOTONE_ICONS.DocumentTextIcon}
        </div>
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <p className="mt-4 text-center text-sm text-primary-400 dark:text-primary-500">
          No activity yet. Add your first contact to start growing your trellis.
        </p>
      ) : (
        <div className="mt-4 space-y-1">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg p-2 hover:bg-primary-50 dark:hover:bg-primary-800/50"
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {activityIcons[activity.activity_type] || fallbackIcon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-primary-800 dark:text-primary-100">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="truncate text-xs text-primary-400">
                    {activity.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-primary-400">
                {formatRelative(activity.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
