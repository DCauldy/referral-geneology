"use client";

import { useEffect, useState } from "react";

interface RecentUser {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  memberships: {
    org_name: string | null;
    plan: string | null;
  }[];
}

export function RecentSignups() {
  const [users, setUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/users?limit=10&page=1");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to load recent signups:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Recent Signups
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead>
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Name
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Email
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Organization
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-5 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                  {user.full_name || "—"}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-sm text-zinc-500">
                  {user.email || "—"}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-sm text-zinc-500">
                  {user.memberships?.[0]?.org_name || "—"}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-sm text-zinc-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-zinc-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
