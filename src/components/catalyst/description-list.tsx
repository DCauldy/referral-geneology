import { cn } from "@/lib/utils/cn";

// --- DescriptionList ---
export interface DescriptionListProps
  extends React.HTMLAttributes<HTMLDListElement> {}

export function DescriptionList({
  className,
  ...props
}: DescriptionListProps) {
  return (
    <dl
      className={cn(
        "divide-y divide-zinc-100 dark:divide-zinc-800",
        className
      )}
      {...props}
    />
  );
}

// --- DescriptionTerm ---
export interface DescriptionTermProps
  extends React.HTMLAttributes<HTMLElement> {}

export function DescriptionTerm({
  className,
  ...props
}: DescriptionTermProps) {
  return (
    <dt
      className={cn(
        "text-sm font-medium text-zinc-500 dark:text-zinc-400",
        // When inside grid layout
        "sm:col-span-1",
        className
      )}
      {...props}
    />
  );
}

// --- DescriptionDetails ---
export interface DescriptionDetailsProps
  extends React.HTMLAttributes<HTMLElement> {}

export function DescriptionDetails({
  className,
  ...props
}: DescriptionDetailsProps) {
  return (
    <dd
      className={cn(
        "text-sm text-zinc-900 dark:text-zinc-100",
        "sm:col-span-2",
        className
      )}
      {...props}
    />
  );
}

// --- DescriptionRow (convenience wrapper) ---
export interface DescriptionRowProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function DescriptionRow({ className, ...props }: DescriptionRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4 sm:py-4",
        className
      )}
      {...props}
    />
  );
}
