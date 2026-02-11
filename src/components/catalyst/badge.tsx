import { cn } from "@/lib/utils/cn";

const colorStyles = {
  gray: "bg-zinc-100 text-zinc-700 ring-zinc-300/50 dark:bg-zinc-700 dark:text-zinc-300 dark:ring-zinc-600/50",
  primary:
    "bg-primary-50 text-primary-700 ring-primary-300/50 dark:bg-primary-900/30 dark:text-primary-400 dark:ring-primary-800/50",
  red: "bg-red-50 text-red-700 ring-red-300/50 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800/50",
  yellow:
    "bg-yellow-50 text-yellow-800 ring-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-800/50",
  green:
    "bg-green-50 text-green-700 ring-green-300/50 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-800/50",
  blue: "bg-blue-50 text-blue-700 ring-blue-300/50 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800/50",
  purple:
    "bg-purple-50 text-purple-700 ring-purple-300/50 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-800/50",
  pink: "bg-pink-50 text-pink-700 ring-pink-300/50 dark:bg-pink-900/30 dark:text-pink-400 dark:ring-pink-800/50",
};

const sizeStyles = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-1 text-xs",
};

export type BadgeColor = keyof typeof colorStyles;
export type BadgeSize = keyof typeof sizeStyles;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  size?: BadgeSize;
}

export function Badge({
  color = "gray",
  size = "sm",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium ring-1 ring-inset",
        colorStyles[color],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
