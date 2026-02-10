import { cn } from "@/lib/utils/cn";

// --- Table ---
export interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  bleed?: boolean;
  dense?: boolean;
  striped?: boolean;
}

export function Table({
  bleed,
  dense,
  striped,
  className,
  ...props
}: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "min-w-full text-left text-sm",
          bleed ? "" : "mx-0",
          className
        )}
        data-dense={dense || undefined}
        data-striped={striped || undefined}
        {...props}
      />
    </div>
  );
}

// --- TableHead ---
export interface TableHeadProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <thead
      className={cn(
        "border-b border-zinc-200 dark:border-zinc-700",
        className
      )}
      {...props}
    />
  );
}

// --- TableBody ---
export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody
      className={cn(
        "divide-y divide-zinc-100 dark:divide-zinc-800",
        className
      )}
      {...props}
    />
  );
}

// --- TableRow ---
export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  href?: string;
}

export function TableRow({ className, href, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors duration-100",
        "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        // Striped support via parent data attribute
        "[:where([data-striped])_&]:even:bg-zinc-50 dark:[:where([data-striped])_&]:even:bg-zinc-800/30",
        href && "cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

// --- TableHeader ---
export interface TableHeaderProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400",
        // Dense support
        "[:where([data-dense])_&]:px-3 [:where([data-dense])_&]:py-2",
        className
      )}
      {...props}
    />
  );
}

// --- TableCell ---
export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "whitespace-nowrap px-4 py-3.5 text-sm text-zinc-700 dark:text-zinc-300",
        // Dense support
        "[:where([data-dense])_&]:px-3 [:where([data-dense])_&]:py-2",
        className
      )}
      {...props}
    />
  );
}
