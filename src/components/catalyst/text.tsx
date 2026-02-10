import { cn } from "@/lib/utils/cn";
import Link from "next/link";

// --- Text / Paragraph ---
export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  muted?: boolean;
}

export function Text({ muted, className, ...props }: TextProps) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed",
        muted
          ? "text-zinc-500 dark:text-zinc-400"
          : "text-zinc-700 dark:text-zinc-300",
        className
      )}
      {...props}
    />
  );
}

// --- Strong ---
export interface StrongProps extends React.HTMLAttributes<HTMLElement> {}

export function Strong({ className, ...props }: StrongProps) {
  return (
    <strong
      className={cn(
        "font-semibold text-zinc-900 dark:text-zinc-100",
        className
      )}
      {...props}
    />
  );
}

// --- Code ---
export interface CodeProps extends React.HTMLAttributes<HTMLElement> {}

export function Code({ className, ...props }: CodeProps) {
  return (
    <code
      className={cn(
        "rounded-md bg-zinc-100 px-1.5 py-0.5 text-sm font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
        "ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700",
        className
      )}
      {...props}
    />
  );
}

// --- TextLink ---
export interface TextLinkProps
  extends React.ComponentProps<typeof Link> {}

export function TextLink({ className, ...props }: TextLinkProps) {
  return (
    <Link
      className={cn(
        "font-medium text-primary-600 underline decoration-primary-600/30 underline-offset-2 transition-colors duration-150",
        "hover:text-primary-700 hover:decoration-primary-700/50",
        "dark:text-primary-400 dark:decoration-primary-400/30 dark:hover:text-primary-300 dark:hover:decoration-primary-300/50",
        className
      )}
      {...props}
    />
  );
}
