import { cn } from "@/lib/utils/cn";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon?: React.ReactElement;
  className?: string;
}

export function KpiCard({ title, value, change, icon, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary-200 bg-white p-5 shadow-sm dark:border-primary-800 dark:bg-primary-900",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">
            {title}
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 shadow-sm dark:bg-primary-800">
            <div className="flex h-6 w-6 items-center justify-center">
              {icon}
            </div>
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
          <span className="text-xs text-primary-400">
            {change.label}
          </span>
        </div>
      )}
    </div>
  );
}
