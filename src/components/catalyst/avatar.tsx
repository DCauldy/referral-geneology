import { cn } from "@/lib/utils/cn";

const sizeStyles = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export type AvatarSize = keyof typeof sizeStyles;

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  square?: boolean;
}

export function Avatar({
  src,
  alt = "",
  initials,
  size = "md",
  square = false,
  className,
  ...props
}: AvatarProps) {
  const shapeClass = square ? "rounded-lg" : "rounded-full";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden bg-zinc-200 font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
        shapeClass,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover", shapeClass)}
        />
      ) : initials ? (
        <span aria-hidden="true" className="select-none uppercase">
          {initials}
        </span>
      ) : (
        <svg
          className="h-[60%] w-[60%] text-zinc-400 dark:text-zinc-500"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </span>
  );
}
