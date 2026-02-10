"use client";

import { forwardRef } from "react";
import { Button as HeadlessButton } from "@headlessui/react";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

const variantStyles = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 dark:bg-primary-500 dark:hover:bg-primary-400 dark:active:bg-primary-300 dark:text-white shadow-sm",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:active:bg-zinc-500 shadow-sm",
  outline:
    "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700",
  ghost:
    "text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-400 dark:active:bg-red-300 shadow-sm",
};

const sizeStyles = {
  xs: "px-2 py-1 text-xs rounded",
  sm: "px-2.5 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-md",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

type ButtonVariant = keyof typeof variantStyles;
type ButtonSize = keyof typeof sizeStyles;

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: never;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.ComponentProps<typeof Link>, keyof ButtonBaseProps> & {
    href: string;
    disabled?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function isLinkProps(props: ButtonProps): props is ButtonAsLink {
  return "href" in props && props.href !== undefined;
}

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
    "disabled:opacity-50 disabled:pointer-events-none",
    variantStyles[variant],
    sizeStyles[size],
    loading && "pointer-events-none opacity-70",
    className
  );

  if (isLinkProps(props)) {
    const { variant: _, size: __, loading: ___, ...linkRest } = props;
    const { href, disabled, className: ____, children: _____, ...anchorRest } =
      linkRest;

    if (disabled) {
      return (
        <span
          className={cn(classes, "opacity-50 pointer-events-none")}
          aria-disabled="true"
        >
          {children}
        </span>
      );
    }

    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        {...anchorRest}
      >
        {loading && <Spinner />}
        {children}
      </Link>
    );
  }

  const {
    variant: _,
    size: __,
    loading: ___,
    className: ____,
    children: _____,
    disabled,
    ...buttonRest
  } = props as ButtonAsButton;

  return (
    <HeadlessButton
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      disabled={disabled || loading}
      {...buttonRest}
    >
      {loading && <Spinner />}
      {children}
    </HeadlessButton>
  );
});

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
