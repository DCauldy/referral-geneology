"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReferralList } from "@/components/referrals/referral-list";

export default function ReferralsPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Referrals
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track referrals between contacts in your network.
          </p>
        </div>
        <Link
          href="/referrals/new"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          Add Referral
        </Link>
      </div>

      <ReferralList onRowClick={(id) => router.push(`/referrals/${id}`)} />
    </div>
  );
}
