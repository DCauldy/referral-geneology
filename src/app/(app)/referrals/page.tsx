"use client";

import { useRouter } from "next/navigation";
import { ReferralList } from "@/components/referrals/referral-list";

export default function ReferralsPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
          Referrals
        </h1>
        <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
          Track and manage your referral network.
        </p>
      </div>

      <ReferralList onRowClick={(_referralId, contactId) => router.push(`/contacts/${contactId}`)} />
    </div>
  );
}
