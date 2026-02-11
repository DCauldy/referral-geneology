"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getInitials } from "@/lib/utils/format";
import type { VisualizationNode } from "@/types/visualizations";

type GhostNodeData = VisualizationNode & { color: string; size: number };

/**
 * Ghost node for inter-network exchanges.
 * Used in both Tree and Network views — rendered with a dashed border
 * and reduced opacity to visually distinguish from local contacts.
 */
function GhostNodeComponent({ data }: NodeProps) {
  const node = data as unknown as GhostNodeData;
  const size = node.size || 32;
  const directionLabel =
    node.exchangeDirection === "sent" ? "Sent" : "Received";

  return (
    <div className="group relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!opacity-0 !w-1 !h-1"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0 !w-1 !h-1"
      />

      <div className="flex flex-col items-center opacity-70">
        {/* Diamond-shaped ghost node */}
        <div
          className="flex items-center justify-center rounded-lg border-2 border-dashed text-white shadow-sm"
          style={{
            width: size,
            height: size,
            backgroundColor: `${node.color}40`,
            borderColor: node.color,
            transform: "rotate(45deg)",
          }}
        >
          <span
            className="text-xs font-bold"
            style={{ transform: "rotate(-45deg)" }}
          >
            {getInitials(node.firstName, node.lastName || undefined)}
          </span>
        </div>

        {/* Label below */}
        <p className="mt-1.5 max-w-[100px] truncate text-center text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
          {node.label}
        </p>

        {/* Org/direction badge */}
        <span className="mt-0.5 rounded-full bg-cyan-100 px-1.5 py-0.5 text-[8px] font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
          {directionLabel}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0 !w-1 !h-1"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0 !w-1 !h-1"
      />
    </div>
  );
}

export const GhostNode = memo(GhostNodeComponent);
