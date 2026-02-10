"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-4 flex items-center gap-1 text-sm">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-zinc-900 dark:text-white">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
