"use client";

import { useState } from "react";
import { useReferrals } from "@/lib/hooks/use-referrals";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/catalyst/table";
import { Badge, type BadgeColor } from "@/components/catalyst/badge";
import { Select } from "@/components/catalyst/select";
import { formatDate, formatCurrency, getFullName } from "@/lib/utils/format";
import type { ReferralStatus, ReferralType } from "@/types/database";

const statusColors: Record<ReferralStatus, BadgeColor> = {
  pending: "primary",
  active: "primary",
  converted: "green",
  inactive: "gray",
  declined: "red",
};

const typeColors: Record<ReferralType, BadgeColor> = {
  direct: "primary",
  introduction: "purple",
  recommendation: "green",
  mutual: "pink",
};

interface ReferralListProps {
  contactId?: string;
  onRowClick?: (referralId: string, contactId: string) => void;
}

export function ReferralList({ contactId, onRowClick }: ReferralListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);

  const { referrals, totalCount, isLoading, error } = useReferrals({
    contactId,
    status: statusFilter || undefined,
    page,
    pageSize: 25,
  });

  const totalPages = Math.ceil(totalCount / 25);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        Failed to load referrals: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="converted">Converted</option>
            <option value="inactive">Inactive</option>
            <option value="declined">Declined</option>
          </Select>
        </div>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {totalCount} referral{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : referrals.length === 0 ? (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
          No new growth yet. Referrals will appear here as your tree extends.
        </div>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Referrer</TableHeader>
                <TableHeader>Referred</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Value</TableHeader>
                <TableHeader>Deal</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {referrals.map((referral) => (
                <TableRow
                  key={referral.id}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={() => {
                    if (onRowClick) {
                      // Navigate to the referred contact
                      onRowClick(referral.id, referral.referred_id);
                    }
                  }}
                >
                  <TableCell className="font-medium">
                    {referral.referrer
                      ? getFullName(
                          referral.referrer.first_name,
                          referral.referrer.last_name ?? undefined
                        )
                      : "Unknown"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {referral.referred
                      ? getFullName(
                          referral.referred.first_name,
                          referral.referred.last_name ?? undefined
                        )
                      : "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge color={typeColors[referral.referral_type]}>
                      {referral.referral_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge color={statusColors[referral.status]}>
                      {referral.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(referral.referral_date)}</TableCell>
                  <TableCell>
                    {referral.referral_value !== null
                      ? formatCurrency(referral.referral_value)
                      : "\u2014"}
                  </TableCell>
                  <TableCell>
                    {referral.deal ? (
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {referral.deal.name}
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        {"\u2014"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
