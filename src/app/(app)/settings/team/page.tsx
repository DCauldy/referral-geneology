import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default function TeamSettingsPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings/profile" },
          { label: "Team" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Team Settings
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Manage team members, roles, and permissions.
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
        <div className="mx-auto max-w-sm">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            No team members yet
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Invite team members to collaborate on your referral network.
          </p>
          <button className="mt-4 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
            Invite Member
          </button>
        </div>
      </div>
    </div>
  );
}
