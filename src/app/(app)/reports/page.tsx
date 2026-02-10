import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default function ReportsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Reports" }]} />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Reports
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Generate and view reports on your referral activity and pipeline.
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
        <div className="mx-auto max-w-sm">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            No reports available yet
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Reports will be generated once you have enough data in your pipeline.
          </p>
        </div>
      </div>
    </div>
  );
}
