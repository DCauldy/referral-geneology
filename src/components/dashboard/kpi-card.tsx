import { cn } from "@/lib/utils/cn";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function KpiCard({ title, value, change, icon: Icon, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary-50 p-2 dark:bg-primary-950">
            <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
        )}
      </div>
      {change && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              change.value >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {change.value >= 0 ? "+" : ""}
            {change.value}%
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {change.label}
          </span>
        </div>
      )}
    </div>
  );
}
