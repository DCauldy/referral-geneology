"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { formatRelative } from "@/lib/utils/format";
import type { Activity } from "@/types/database";

const activityIcons: Record<string, string> = {
  note: "📝",
  call: "📞",
  email: "📧",
  meeting: "🤝",
  deal_created: "💼",
  deal_won: "🎉",
  deal_lost: "❌",
  referral_made: "🔗",
  referral_received: "📥",
  contact_created: "👤",
};

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
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No recent activity. Start by adding contacts and referrals.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <span className="mt-0.5 text-sm">
            {activityIcons[activity.activity_type] || "📌"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-900 dark:text-white">
              {activity.title}
            </p>
            {activity.description && (
              <p className="truncate text-xs text-zinc-500">
                {activity.description}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs text-zinc-400">
            {formatRelative(activity.created_at)}
          </span>
        </div>
      ))}
    </div>
  );
}
