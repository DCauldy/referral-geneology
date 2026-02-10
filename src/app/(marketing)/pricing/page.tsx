import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with referral tracking.",
    features: [
      "Up to 50 contacts",
      "Basic referral tracking",
      "Tree visualization",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For professionals who need advanced referral management.",
    features: [
      "Unlimited contacts",
      "Advanced referral chains",
      "All visualizations (Tree, Network, Galaxy)",
      "AI-powered insights",
      "Deal pipeline management",
      "Custom reports",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$79",
    period: "per month",
    description: "For teams collaborating on referral networks.",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Team referral tracking",
      "Role-based permissions",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "SSO / SAML",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          Pricing
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Choose the plan that fits your referral network needs.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-8 ${
              plan.highlighted
                ? "border-primary-500 bg-primary-50 shadow-lg dark:border-primary-400 dark:bg-primary-950/20"
                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
            }`}
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {plan.name}
            </h2>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                {plan.price}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                /{plan.period}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {plan.description}
            </p>

            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className={`mt-8 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium shadow-sm ${
                plan.highlighted
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
