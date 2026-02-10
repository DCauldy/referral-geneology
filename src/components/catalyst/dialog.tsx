// @ts-nocheck
"use client";

import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle as HeadlessDialogTitle,
  Description as HeadlessDescription,
} from "@headlessui/react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils/cn";

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

export type DialogSize = keyof typeof sizeStyles;

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  size?: DialogSize;
  className?: string;
  children: React.ReactNode;
}

export function Dialog({
  open,
  onClose,
  size = "md",
  className,
  children,
}: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <HeadlessDialog static open={open} onClose={onClose} className="relative z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/50"
            aria-hidden="true"
          />

          {/* Full-screen container to center the panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel
              as={motion.div}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              {...{ transition: { duration: 0.2, ease: "easeOut" } } as Record<string, unknown>}
              className={cn(
                "w-full rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900",
                "ring-1 ring-zinc-200 dark:ring-zinc-700",
                sizeStyles[size],
                className
              )}
            >
              {children}
            </DialogPanel>
          </div>
        </HeadlessDialog>
      )}
    </AnimatePresence>
  );
}

export interface DialogTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <HeadlessDialogTitle
      className={cn(
        "text-lg font-semibold text-zinc-900 dark:text-zinc-100",
        className
      )}
      {...props}
    />
  );
}

export interface DialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DialogDescription({
  className,
  ...props
}: DialogDescriptionProps) {
  return (
    <HeadlessDescription
      className={cn(
        "mt-2 text-sm text-zinc-600 dark:text-zinc-400",
        className
      )}
      {...props}
    />
  );
}

export interface DialogBodyProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogBody({ className, ...props }: DialogBodyProps) {
  return <div className={cn("mt-4", className)} {...props} />;
}

export interface DialogActionsProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogActions({ className, ...props }: DialogActionsProps) {
  return (
    <div
      className={cn("mt-6 flex justify-end gap-3", className)}
      {...props}
    />
  );
}
