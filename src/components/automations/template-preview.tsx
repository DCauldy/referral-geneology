"use client";

import { cn } from "@/lib/utils/cn";

interface TemplatePreviewProps {
  html: string;
  className?: string;
}

export function TemplatePreview({ html, className }: TemplatePreviewProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
        className
      )}
    >
      <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Preview
        </p>
      </div>
      <iframe
        srcDoc={html || "<p style='color:#999;padding:24px;font-family:sans-serif;'>Enter HTML to see a live preview...</p>"}
        sandbox="allow-same-origin"
        className="h-full min-h-[400px] w-full bg-white"
        title="Email template preview"
      />
    </div>
  );
}
