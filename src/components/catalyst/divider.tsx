import { cn } from "@/lib/utils/cn";

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  soft?: boolean;
}

export function Divider({ soft, className, ...props }: DividerProps) {
  return (
    <hr
      className={cn(
        "w-full border-t",
        soft
          ? "border-zinc-100 dark:border-zinc-800"
          : "border-zinc-200 dark:border-zinc-700",
        className
      )}
      role="separator"
      {...props}
    />
  );
}
