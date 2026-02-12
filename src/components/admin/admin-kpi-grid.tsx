"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  UsersIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  UserPlusIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface PlatformStats {
  totalUsers: number;
  totalOrgs: number;
  totalContacts: number;
  totalReferrals: number;
  totalDeals: number;
  totalDealValue: number;
  wonRevenue: number;
  newUsersLast30d: number;
  activeOrgsLast30d: number;
  planDistribution: { free: number; pro: number; team: number };
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

export function AdminKpiGrid() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const kpis = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: <UsersIcon className="size-6 text-primary-600" />,
    },
    {
      title: "Total Organizations",
      value: stats.totalOrgs.toLocaleString(),
      icon: <BuildingOffice2Icon className="size-6 text-primary-600" />,
    },
    {
      title: "Total Contacts",
      value: stats.totalContacts.toLocaleString(),
      icon: <UserGroupIcon className="size-6 text-primary-600" />,
    },
    {
      title: "Total Referrals",
      value: stats.totalReferrals.toLocaleString(),
      icon: <ArrowsRightLeftIcon className="size-6 text-primary-600" />,
    },
    {
      title: "Total Deals",
      value: stats.totalDeals.toLocaleString(),
      icon: <CurrencyDollarIcon className="size-6 text-primary-600" />,
    },
    {
      title: "Platform Value",
      value: formatCurrency(stats.totalDealValue),
      icon: <ChartBarIcon className="size-6 text-primary-600" />,
    },
    {
      title: "Won Revenue",
      value: formatCurrency(stats.wonRevenue),
      icon: <BanknotesIcon className="size-6 text-primary-600" />,
    },
    {
      title: "New Users (30d)",
      value: stats.newUsersLast30d.toLocaleString(),
      icon: <UserPlusIcon className="size-6 text-primary-600" />,
    },
    {
      title: "Active Orgs (30d)",
      value: stats.activeOrgsLast30d.toLocaleString(),
      icon: <BuildingStorefrontIcon className="size-6 text-primary-600" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} />
      ))}
    </div>
  );
}
