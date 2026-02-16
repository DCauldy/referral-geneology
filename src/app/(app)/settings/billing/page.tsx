"use client";

import { useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useImpersonation } from "@/lib/hooks/use-impersonation";
import { PLAN_DISPLAY } from "@/lib/polar/plans";
import { CheckIcon } from "@heroicons/react/24/outline";

const plans = [
  {
    name: "Free",
    key: "free" as const,
    price: "$0",
    description: "For individuals getting started",
    features: [
      "50 contacts",
      "1 user",
      "Tree visualization only",
      "Basic deal tracking",
    ],
  },
  {
    name: "Pro",
    key: "pro" as const,
    price: "$29/mo",
    description: "For growing professionals",
    features: [
      "Unlimited contacts",
      "1 user",
      "All 3 visualization modes",
      "AI-powered insights",
      "CSV import/export",
      "Full deal tracking",
    ],
  },
  {
    name: "Team",
    key: "team" as const,
    price: "$79/mo",
    description: "For teams and organizations",
    features: [
      "Unlimited contacts",
      "Up to 25 users",
      "All 3 visualization modes",
      "AI-powered insights",
      "CSV import/export",
      "Full deal tracking",
      "Real-time collaboration",
    ],
  },
];

export default function BillingSettingsPage() {
  const { org } = useOrg();
  const toast = useToast();
  const { isImpersonating } = useImpersonation();
  const [isLoading, setIsLoading] = useState(false);

  const currentPlan = org?.plan || "free";

  async function handleUpgrade(planKey: string) {
    if (planKey === currentPlan) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: planKey }),
      });

      if (!res.ok) throw new Error("Failed to create checkout");

      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      <SettingsSection
        title="Current Plan"
        description="View and manage your subscription."
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
            {PLAN_DISPLAY[currentPlan]?.name || "Free"}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {PLAN_DISPLAY[currentPlan]?.description || "For individuals getting started"}
          </span>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Available Plans"
        description="Choose the plan that best fits the size of your grove."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-xl border p-6 ${
                plan.key === currentPlan
                  ? "border-primary-500 ring-2 ring-primary-500/20"
                  : "border-zinc-200 dark:border-zinc-700"
              } bg-white dark:bg-zinc-800`}
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>
              <p className="mt-4 text-3xl font-bold text-zinc-900 dark:text-white">
                {plan.price}
              </p>

              <ul className="mt-6 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    <CheckIcon className="h-4 w-4 text-primary-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={plan.key === currentPlan || isLoading || isImpersonating}
                className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  plan.key === currentPlan
                    ? "cursor-default border border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                    : "bg-primary-600 text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
                }`}
              >
                {plan.key === currentPlan ? "Current Plan" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
