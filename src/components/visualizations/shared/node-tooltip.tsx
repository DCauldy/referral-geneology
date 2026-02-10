"use client";

import type { VisualizationNode } from "@/types/visualizations";
import { formatCurrency, getInitials } from "@/lib/utils/format";

interface NodeTooltipProps {
  node: VisualizationNode;
  position: { x: number; y: number };
}

export function NodeTooltip({ node, position }: NodeTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-50 w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
      style={{
        left: position.x + 10,
        top: position.y + 10,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
          {getInitials(node.firstName, node.lastName || undefined)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
            {node.label}
          </p>
          {node.company && (
            <p className="truncate text-xs text-zinc-500">{node.company}</p>
          )}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Type:</span>{" "}
          <span className="capitalize text-zinc-700 dark:text-zinc-300">
            {node.relationshipType.replace("_", " ")}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Score:</span>{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            {node.referralScore}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Referrals:</span>{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            {node.referralCount}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Value:</span>{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            {formatCurrency(node.dealValue)}
          </span>
        </div>
        {node.industry && (
          <div className="col-span-2">
            <span className="text-zinc-500 dark:text-zinc-400">Industry:</span>{" "}
            <span className="text-zinc-700 dark:text-zinc-300">
              {node.industry}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
