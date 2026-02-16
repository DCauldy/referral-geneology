"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getInitials } from "@/lib/utils/format";
import type { VisualizationNode } from "@/types/visualizations";

type NetworkNodeData = VisualizationNode & { color: string; size: number };

function NetworkNodeComponent({ data }: NodeProps) {
  const node = data as unknown as NetworkNodeData;
  const size = node.size || 40;

  return (
    <div className="group relative">
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <Handle type="target" position={Position.Left} className="!opacity-0 !w-1 !h-1" />

      <div className="flex flex-col items-center">
        {/* Circle node */}
        <div
          className="flex items-center justify-center rounded-full border-2 border-white text-white shadow-md transition-transform hover:scale-110 dark:border-zinc-800"
          style={{
            width: size,
            height: size,
            backgroundColor: node.color,
          }}
        >
          {node.profilePhotoUrl ? (
            <img
              src={node.profilePhotoUrl}
              alt={node.label}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold">
              {getInitials(node.firstName, node.lastName || undefined)}
            </span>
          )}
        </div>

        {/* Label below */}
        <p className="mt-1 max-w-[100px] truncate text-center text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
          {node.label}
        </p>
        {node.generation != null && (
          <span className="mt-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            Gen {node.generation}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!opacity-0 !w-1 !h-1" />
    </div>
  );
}

export const NetworkNode = memo(NetworkNodeComponent);
