import { cn } from "@/lib/utils/cn";

const levelStyles = {
  1: "text-3xl font-bold tracking-tight sm:text-4xl",
  2: "text-2xl font-bold tracking-tight",
  3: "text-xl font-semibold",
  4: "text-lg font-semibold",
};

export type HeadingLevel = 1 | 2 | 3 | 4;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
}

export function Heading({ level = 1, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as const;

  return (
    <Tag
      className={cn(
        "text-zinc-900 dark:text-zinc-100",
        levelStyles[level],
        className
      )}
      {...props}
    />
  );
}

export interface SubheadingProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
}

export function Subheading({
  level = 2,
  className,
  ...props
}: SubheadingProps) {
  const Tag = `h${level}` as const;

  return (
    <Tag
      className={cn(
        "text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400",
        className
      )}
      {...props}
    />
  );
}
