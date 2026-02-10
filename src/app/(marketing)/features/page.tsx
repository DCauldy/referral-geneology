import Link from "next/link";

const features = [
  {
    title: "Referral Tracking",
    description:
      "Track every referral connection with detailed genealogy chains. Know exactly who referred whom and when.",
  },
  {
    title: "Interactive Visualizations",
    description:
      "Explore your referral network through Tree, Network Graph, and immersive Galaxy views.",
  },
  {
    title: "Deal Pipeline",
    description:
      "Manage deals from lead to close with customizable pipeline stages and Kanban boards.",
  },
  {
    title: "AI-Powered Insights",
    description:
      "Get intelligent recommendations on who to nurture, which referral paths are most valuable, and where to focus.",
  },
  {
    title: "Contact Management",
    description:
      "Keep all your contacts organized with detailed profiles, company associations, and activity timelines.",
  },
  {
    title: "Reports & Analytics",
    description:
      "Generate comprehensive reports on referral performance, pipeline health, and conversion metrics.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          Features
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Everything you need to manage and grow your referral network.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/register"
          className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          Get Started for Free
        </Link>
      </div>
    </div>
  );
}
