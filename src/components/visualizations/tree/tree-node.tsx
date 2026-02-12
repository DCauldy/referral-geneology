"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getInitials } from "@/lib/utils/format";
import type { VisualizationNode } from "@/types/visualizations";

type TreeNodeData = VisualizationNode & { color: string; size: number };

function TreeNodeComponent({ data }: NodeProps) {
  const node = data as unknown as TreeNodeData;
  const size = node.size || 40;

  return (
    <div className="group relative">
      <Handle type="target" position={Position.Top} className="!bg-zinc-300 !border-zinc-400 !w-2 !h-2" />

      <div
        className="flex flex-col items-center gap-1 rounded-xl border-2 bg-white p-2 shadow-md transition-shadow hover:shadow-lg dark:bg-zinc-800"
        style={{
          borderColor: node.color,
          minWidth: size + 40,
        }}
      >
        {/* Avatar */}
        {node.profilePhotoUrl ? (
          <img
            src={node.profilePhotoUrl}
            alt={node.label}
            className="rounded-full object-cover"
            style={{ width: size * 0.6, height: size * 0.6 }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-full text-xs font-bold text-white"
            style={{
              width: size * 0.6,
              height: size * 0.6,
              backgroundColor: node.color,
            }}
          >
            {getInitials(node.firstName, node.lastName || undefined)}
          </div>
        )}

        {/* Name */}
        <p className="max-w-[120px] truncate text-center text-xs font-semibold text-zinc-900 dark:text-white">
          {node.label}
        </p>

        {/* Company */}
        {node.company && (
          <p className="max-w-[120px] truncate text-center text-[10px] text-zinc-500">
            {node.company}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-1">
          {node.generation != null && (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              Gen {node.generation}
            </span>
          )}
          {node.referralCount > 0 && (
            <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[9px] font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {node.referralCount} refs
            </span>
          )}
          {node.dealValue > 0 && (
            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
              ${(node.dealValue / 1000).toFixed(0)}K
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-zinc-300 !border-zinc-400 !w-2 !h-2" />
    </div>
  );
}

export const TreeNode = memo(TreeNodeComponent);
