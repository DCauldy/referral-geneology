"use client";

import { useEffect, useState } from "react";

interface OrgSummary {
  id: string;
  name: string;
  plan: string;
  contactCount: number;
  totalRevenue: number;
  memberCount: number;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

export function TopOrganizations() {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/organizations?limit=10&page=1");
        if (res.ok) {
          const data = await res.json();
          // Sort by contacts count (most active)
          const sorted = [...data.organizations].sort(
            (a: OrgSummary, b: OrgSummary) => b.contactCount - a.contactCount
          );
          setOrgs(sorted.slice(0, 10));
        }
      } catch (err) {
        console.error("Failed to load top organizations:", err);
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
          Top Organizations
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
                Plan
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Members
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Contacts
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {orgs.map((org) => (
              <tr key={org.id}>
                <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {org.name}
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {org.plan}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-zinc-500">
                  {org.memberCount}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-zinc-500">
                  {org.contactCount}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-zinc-500">
                  {formatCurrency(org.totalRevenue)}
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-400">
                  No organizations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
