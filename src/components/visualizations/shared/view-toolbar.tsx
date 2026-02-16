"use client";

import { cn } from "@/lib/utils/cn";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import type { ViewConfig } from "@/types/visualizations";

interface ViewToolbarProps {
  config: ViewConfig;
  onConfigChange: (config: Partial<ViewConfig>) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  className?: string;
}

export function ViewToolbar({
  config,
  onConfigChange,
  onZoomIn,
  onZoomOut,
  onFitView,
  className,
}: ViewToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-primary-200 bg-white px-4 py-2.5 shadow-sm dark:border-primary-800 dark:bg-primary-950",
        className
      )}
    >
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search..."
          value={config.filters.search}
          onChange={(e) =>
            onConfigChange({
              filters: { ...config.filters, search: e.target.value },
            })
          }
          className="rounded-md border border-primary-200 bg-primary-50/50 py-1.5 pl-8 pr-4 text-xs text-primary-900 placeholder:text-primary-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-primary-800 dark:bg-primary-950 dark:text-primary-100"
        />
      </div>

      <div className="h-5 w-px bg-primary-200 dark:bg-primary-800" />

      {/* Color by */}
      <select
        value={config.display.colorBy}
        onChange={(e) =>
          onConfigChange({
            display: {
              ...config.display,
              colorBy: e.target.value as ViewConfig["display"]["colorBy"],
            },
          })
        }
        className="rounded-md border border-primary-200 bg-primary-50/50 px-3 py-1.5 text-xs text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300"
      >
        <option value="relationship">Color: Type</option>
        <option value="industry">Color: Industry</option>
        <option value="score">Color: Score</option>
        <option value="value">Color: Value</option>
        <option value="generation">Color: Generation</option>
      </select>

      {/* Size by */}
      <select
        value={config.display.sizeBy}
        onChange={(e) =>
          onConfigChange({
            display: {
              ...config.display,
              sizeBy: e.target.value as ViewConfig["display"]["sizeBy"],
            },
          })
        }
        className="rounded-md border border-primary-200 bg-primary-50/50 px-3 py-1.5 text-xs text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300"
      >
        <option value="referrals">Size: Referrals</option>
        <option value="value">Size: Value</option>
        <option value="score">Size: Score</option>
        <option value="uniform">Size: Uniform</option>
      </select>

      <div className="h-5 w-px bg-primary-200 dark:bg-primary-800" />

      {/* Labels toggle */}
      <label className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400">
        <input
          type="checkbox"
          checked={config.display.showLabels}
          onChange={(e) =>
            onConfigChange({
              display: { ...config.display, showLabels: e.target.checked },
            })
          }
          className="h-3 w-3 rounded border-zinc-300 text-primary-600"
        />
        Labels
      </label>

      {/* Zoom controls — only shown when callbacks are provided */}
      {(onZoomIn || onZoomOut || onFitView) && (
        <>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <button
              onClick={onZoomOut}
              className="rounded-md p-1.5 text-primary-500 hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900 dark:hover:text-primary-300"
              title="Zoom out"
            >
              <ArrowsPointingInIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onFitView}
              className="rounded-md p-1.5 text-primary-500 hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900 dark:hover:text-primary-300"
              title="Fit view"
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onZoomIn}
              className="rounded-md p-1.5 text-primary-500 hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900 dark:hover:text-primary-300"
              title="Zoom in"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
