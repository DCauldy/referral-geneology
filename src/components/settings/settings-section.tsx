interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
      <div>
        <h2 className="text-base/7 font-semibold text-zinc-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm/6 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}
