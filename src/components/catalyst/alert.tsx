import { cn } from "@/lib/utils/cn";
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";

const variantStyles = {
  info: {
    container:
      "bg-blue-50 text-blue-800 ring-blue-200/50 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/50",
    icon: "text-blue-500 dark:text-blue-400",
    Icon: InformationCircleIcon,
  },
  success: {
    container:
      "bg-green-50 text-green-800 ring-green-200/50 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800/50",
    icon: "text-green-500 dark:text-green-400",
    Icon: CheckCircleIcon,
  },
  warning: {
    container:
      "bg-yellow-50 text-yellow-800 ring-yellow-200/50 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-800/50",
    icon: "text-yellow-500 dark:text-yellow-400",
    Icon: ExclamationTriangleIcon,
  },
  error: {
    container:
      "bg-red-50 text-red-800 ring-red-200/50 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800/50",
    icon: "text-red-500 dark:text-red-400",
    Icon: XCircleIcon,
  },
};

export type AlertVariant = keyof typeof variantStyles;

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
}

export function Alert({
  variant = "info",
  title,
  onDismiss,
  className,
  children,
  ...props
}: AlertProps) {
  const styles = variantStyles[variant];
  const IconComponent = styles.Icon;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg p-4 ring-1 ring-inset",
        styles.container,
        className
      )}
      {...props}
    >
      <div className="flex gap-3">
        <IconComponent
          className={cn("h-5 w-5 shrink-0 mt-0.5", styles.icon)}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-semibold">{title}</h3>
          )}
          {children && (
            <div className={cn("text-sm", title && "mt-1")}>
              {children}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
            aria-label="Dismiss"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
