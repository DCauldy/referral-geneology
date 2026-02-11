"use client";

import { useEffect, useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";
import { useOrg } from "@/components/providers/org-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { getInitials } from "@/lib/utils/format";
import type { OrgRole } from "@/types/database";

interface TeamMember {
  id: string;
  role: OrgRole;
  user_id: string;
  user_profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  // email comes from invited_email or profile
  email: string | null;
}

const roleBadgeClassName: Record<OrgRole, string> = {
  owner:
    "bg-primary-50 text-primary-700 ring-primary-600/20 dark:bg-primary-900/20 dark:text-primary-300",
  admin:
    "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/20 dark:text-purple-300",
  member:
    "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300",
  viewer:
    "bg-zinc-50 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function TeamSettingsPage() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const { isFreePlan, maxUsers } = usePlanLimits();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      if (!org) return;

      const { data, error } = await supabase
        .from("org_members")
        .select(
          "id, role, user_id, invited_email"
        )
        .eq("org_id", org.id)
        .order("created_at");

      if (error) {
        console.error("Failed to load team members:", error);
        setIsLoading(false);
        return;
      }

      // Fetch profiles separately to avoid join issues
      const memberRows = data ?? [];
      const userIds = memberRows.map((m) => m.user_id);

      let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        for (const p of profiles ?? []) {
          profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        }
      }

      const mapped: TeamMember[] = memberRows.map((m) => ({
        id: m.id,
        role: m.role as OrgRole,
        user_id: m.user_id,
        user_profiles: profileMap[m.user_id] ?? null,
        email: m.invited_email ?? null,
      }));

      setMembers(mapped);
      setIsLoading(false);
    }

    loadMembers();
  }, [supabase, org]);

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      <SettingsSection
        title="Team Members"
        description="Manage who has access to your tree. Invite new collaborators to help tend the branches."
      >
        {isFreePlan ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Team members are available on the Team plan
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Upgrade to invite collaborators and grow your network together.
            </p>
            <a
              href="/settings/billing"
              className="mt-4 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              View Plans
            </a>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isLoading ? (
                  <span className="inline-block h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                ) : (
                  `${Math.max(members.length, 1)} of ${maxUsers} seat${maxUsers === 1 ? "" : "s"} used`
                )}
              </p>
              <button
                type="button"
                disabled={!isLoading && Math.max(members.length, 1) >= maxUsers}
                className={
                  !isLoading && Math.max(members.length, 1) >= maxUsers
                    ? "cursor-not-allowed rounded-lg bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                    : "rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
                }
              >
                Invite Member
              </button>
            </div>

            {isLoading ? (
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                  />
                ))}
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
                {members.map((member) => {
                  const name = member.user_profiles?.full_name || "Invited";
                  const parts = name.split(" ");
                  const initials = getInitials(parts[0], parts[1]);

                  return (
                    <li
                      key={member.id}
                      className="flex items-center gap-4 py-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                        {member.user_profiles?.avatar_url ? (
                          <img
                            src={member.user_profiles.avatar_url}
                            alt={name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                          {name}
                        </p>
                        {member.email && (
                          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                            {member.email}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${roleBadgeClassName[member.role]}`}
                      >
                        {member.role.charAt(0).toUpperCase() +
                          member.role.slice(1)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
