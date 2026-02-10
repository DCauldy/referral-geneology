"use client";

import { getLegendItems } from "@/lib/visualization/data-transformer";

export function ViewLegend({ colorBy }: { colorBy: string }) {
  const items = getLegendItems(colorBy);

  if (items.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-zinc-200 bg-white/90 p-3 text-xs shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90">
      <p className="mb-2 font-semibold text-zinc-700 capitalize dark:text-zinc-300">
        {colorBy}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-zinc-600 capitalize dark:text-zinc-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
