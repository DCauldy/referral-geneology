"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { useVisualizationData } from "@/lib/hooks/use-visualization-data";
import {
  toReactFlowNodes,
  toReactFlowEdges,
  findRootNodes,
} from "@/lib/visualization/data-transformer";
import { ViewToolbar } from "../shared/view-toolbar";
import { ViewLegend } from "../shared/view-legend";
import { TreeNode } from "./tree-node";
import { GhostNode } from "../shared/ghost-node";
import { DEFAULT_VIEW_CONFIG, type ViewConfig } from "@/types/visualizations";

const nodeTypes = { custom: TreeNode, ghost: GhostNode };

function computeDagreLayout(
  rfNodes: Node[],
  rfEdges: Edge[],
  direction: string = "TB"
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

  rfNodes.forEach((node) => {
    g.setNode(node.id, { width: 160, height: 100 });
  });

  rfEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return rfNodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - 80, y: pos.y - 50 },
    };
  });
}

export function TreeView() {
  const [config, setConfig] = useState<ViewConfig>({
    ...DEFAULT_VIEW_CONFIG,
    layout: { ...DEFAULT_VIEW_CONFIG.layout, type: "dagre", direction: "TB" },
  });

  const { nodes: vizNodes, edges: vizEdges, isLoading } = useVisualizationData(config.filters);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Convert and layout nodes
  useEffect(() => {
    if (vizNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const rfNodes = toReactFlowNodes(
      vizNodes,
      config.display.colorBy,
      config.display.sizeBy
    );
    const rfEdges = toReactFlowEdges(vizEdges);

    const layoutedNodes = computeDagreLayout(
      rfNodes,
      rfEdges,
      config.layout.direction
    );

    setNodes(layoutedNodes as Node[]);
    setEdges(rfEdges as Edge[]);
  }, [vizNodes, vizEdges, config.display.colorBy, config.display.sizeBy, config.layout.direction, setNodes, setEdges]);

  const handleConfigChange = useCallback(
    (partial: Partial<ViewConfig>) => {
      setConfig((prev) => ({
        ...prev,
        ...partial,
        filters: { ...prev.filters, ...partial.filters },
        display: { ...prev.display, ...partial.display },
        layout: { ...prev.layout, ...partial.layout },
      }));
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm text-zinc-500">Loading tree view...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <ViewToolbar config={config} onConfigChange={handleConfigChange} />
      </div>

      <div className="relative h-[600px] overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500">
              Your tree is waiting to grow. Add contacts and referrals to see it take shape.
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: false,
            }}
          >
            <MiniMap
              nodeStrokeColor={(n) => (n.data as { color?: string })?.color || "#94a3b8"}
              nodeColor={(n) => (n.data as { color?: string })?.color || "#94a3b8"}
              className="!bg-zinc-100 dark:!bg-zinc-900"
            />
            <Controls className="!bg-white !border-zinc-200 dark:!bg-zinc-800 dark:!border-zinc-700" />
            <Background color="#e4e4e7" gap={20} />
          </ReactFlow>
        )}
        <ViewLegend colorBy={config.display.colorBy} showInterNetwork={config.filters.showInterNetwork} />
      </div>
    </div>
  );
}
