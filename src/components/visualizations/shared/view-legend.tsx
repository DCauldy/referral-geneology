"use client";

import { getLegendItems } from "@/lib/visualization/data-transformer";

export function ViewLegend({ colorBy, showInterNetwork }: { colorBy: string; showInterNetwork?: boolean }) {
  const items = getLegendItems(colorBy, showInterNetwork);

  if (items.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-primary-200 bg-white/90 p-3 text-xs shadow-sm backdrop-blur-sm dark:border-primary-800 dark:bg-primary-950/90">
      <p className="mb-2 font-serif font-semibold text-primary-700 capitalize dark:text-primary-300">
        {colorBy}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-primary-600 capitalize dark:text-primary-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
