"use client";

import { cn } from "@/lib/utils/cn";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
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
  const { canExchangeReferrals } = usePlanLimits();

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900",
        className
      )}
    >
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search nodes..."
          value={config.filters.search}
          onChange={(e) =>
            onConfigChange({
              filters: { ...config.filters, search: e.target.value },
            })
          }
          className="rounded-md border border-zinc-200 bg-zinc-50 py-1 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
      </div>

      <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

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
        className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
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
        className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      >
        <option value="referrals">Size: Referrals</option>
        <option value="value">Size: Value</option>
        <option value="score">Size: Score</option>
        <option value="uniform">Size: Uniform</option>
      </select>

      <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      {/* Labels toggle */}
      <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
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

      {/* Inter-network toggle (paid plans only) */}
      {canExchangeReferrals && (
        <>
          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
          <label className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400">
            <input
              type="checkbox"
              checked={config.filters.showInterNetwork}
              onChange={(e) =>
                onConfigChange({
                  filters: { ...config.filters, showInterNetwork: e.target.checked },
                })
              }
              className="h-3 w-3 rounded border-cyan-300 text-cyan-600"
            />
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            Exchange
          </label>
        </>
      )}

      <div className="flex-1" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          title="Zoom out"
        >
          <ArrowsPointingInIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onFitView}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          title="Fit view"
        >
          <FunnelIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onZoomIn}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          title="Zoom in"
        >
          <ArrowsPointingOutIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
