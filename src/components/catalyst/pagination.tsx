"use client";

import { cn } from "@/lib/utils/cn";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Max visible page buttons (excluding prev/next). Default: 7 */
  siblingCount?: number;
  className?: string;
}

function generatePages(
  current: number,
  total: number,
  siblingCount: number
): (number | "ellipsis")[] {
  const totalSlots = siblingCount;

  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - 1, 1);
  const rightSibling = Math.min(current + 1, total);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Math.max(3, siblingCount - 2);
    const pages: (number | "ellipsis")[] = Array.from(
      { length: leftRange },
      (_, i) => i + 1
    );
    pages.push("ellipsis", total);
    return pages;
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Math.max(3, siblingCount - 2);
    const pages: (number | "ellipsis")[] = [1, "ellipsis"];
    for (let i = total - rightRange + 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Both ellipsis
  const pages: (number | "ellipsis")[] = [1, "ellipsis"];
  for (let i = leftSibling; i <= rightSibling; i++) {
    pages.push(i);
  }
  pages.push("ellipsis", total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 7,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = generatePages(currentPage, totalPages, siblingCount);

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Pagination"
    >
      <PaginationButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </PaginationButton>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-9 w-9 items-center justify-center text-sm text-zinc-400 dark:text-zinc-500"
          >
            ...
          </span>
        ) : (
          <PaginationButton
            key={page}
            onClick={() => onPageChange(page)}
            active={page === currentPage}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </PaginationButton>
        )
      )}

      <PaginationButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </PaginationButton>
    </nav>
  );
}

interface PaginationButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function PaginationButton({
  active,
  disabled,
  className,
  ...props
}: PaginationButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        active
          ? "bg-primary-600 text-white dark:bg-primary-500"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
        disabled && "pointer-events-none opacity-40",
        className
      )}
      {...props}
    />
  );
}
