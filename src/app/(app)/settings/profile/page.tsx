import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default function ProfileSettingsPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings/profile" },
          { label: "Profile" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Profile Settings
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Manage your personal profile and preferences.
      </p>

      <div className="mt-6 max-w-2xl rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Profile settings form will be implemented here.
        </p>
      </div>
    </div>
  );
}
