"use client";

import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ReferralForm } from "@/components/referrals/referral-form";

export default function NewReferralPage() {
  const router = useRouter();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Referrals", href: "/referrals" },
          { label: "Add Referral" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Add Referral
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Record new growth between branches.
      </p>

      <div className="mt-6 max-w-2xl">
        <ReferralForm onSuccess={() => router.push("/referrals")} />
      </div>
    </div>
  );
}
