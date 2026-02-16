"use client";

import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ReferralForm } from "@/components/referrals/referral-form";
import {
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const statusDescriptions = [
  {
    name: "Pending",
    color: "bg-yellow-400",
    description: "The referral has been made but hasn't been acted on yet.",
  },
  {
    name: "Active",
    color: "bg-blue-500",
    description:
      "The referred contact has engaged and a conversation or deal is in progress.",
  },
  {
    name: "Converted",
    color: "bg-green-500",
    description:
      "The referral resulted in a closed deal or successful outcome.",
  },
  {
    name: "Inactive",
    color: "bg-primary-400",
    description:
      "The referral went cold — no recent activity or response from the referred contact.",
  },
  {
    name: "Declined",
    color: "bg-red-500",
    description:
      "The referred contact explicitly passed on the opportunity.",
  },
];

const typeDescriptions = [
  {
    name: "Direct",
    description: "You personally connected the two parties.",
  },
  {
    name: "Introduction",
    description: "You facilitated an introduction but weren't directly involved after.",
  },
  {
    name: "Recommendation",
    description: "You recommended someone without making a formal introduction.",
  },
  {
    name: "Mutual",
    description: "Both parties referred each other — a two-way exchange.",
  },
];

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
      <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
        Add Referral
      </h1>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        Record a new referral between contacts.
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_420px]">
        <div>
          <ReferralForm onSuccess={() => router.push("/referrals")} />
        </div>

        {/* Reference sidebar */}
        <div className="space-y-4">
          {/* Status guide */}
          <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-5 dark:border-primary-700 dark:bg-primary-900/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-800 dark:text-primary-100">
              <InformationCircleIcon className="h-4 w-4 text-tan-500" />
              Status Guide
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              {statusDescriptions.map((s) => (
                <li key={s.name} className="flex gap-2.5">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.color}`}
                  />
                  <div>
                    <span className="text-sm font-medium text-primary-800 dark:text-primary-100">
                      {s.name}
                    </span>
                    <p className="text-xs leading-relaxed text-primary-500 dark:text-primary-400">
                      {s.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Type guide */}
          <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-5 dark:border-primary-700 dark:bg-primary-900/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-800 dark:text-primary-100">
              <InformationCircleIcon className="h-4 w-4 text-tan-500" />
              Type Guide
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              {typeDescriptions.map((t) => (
                <li key={t.name}>
                  <span className="text-sm font-medium text-primary-800 dark:text-primary-100">
                    {t.name}
                  </span>
                  <p className="text-xs leading-relaxed text-primary-500 dark:text-primary-400">
                    {t.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
