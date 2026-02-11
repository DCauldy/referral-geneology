"use client";

import { useCallback, useEffect, useState } from "react";
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
import * as d3Force from "d3-force";
import { useVisualizationData } from "@/lib/hooks/use-visualization-data";
import {
  toReactFlowNodes,
  toReactFlowEdges,
} from "@/lib/visualization/data-transformer";
import { ViewToolbar } from "../shared/view-toolbar";
import { ViewLegend } from "../shared/view-legend";
import { ViewSwitcher } from "../shared/view-switcher";
import { NetworkNode } from "./network-node";
import { GhostNode } from "../shared/ghost-node";
import { DEFAULT_VIEW_CONFIG, type ViewConfig } from "@/types/visualizations";

const nodeTypes = { custom: NetworkNode, ghost: GhostNode };

function computeForceLayout(
  rfNodes: { id: string; position: { x: number; y: number }; [key: string]: unknown }[],
  rfEdges: { source: string; target: string; [key: string]: unknown }[]
) {
  // Create simulation nodes
  const simNodes = rfNodes.map((n) => ({
    id: n.id,
    x: Math.random() * 800,
    y: Math.random() * 600,
  }));

  const simLinks = rfEdges.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  // Run force simulation synchronously
  const simulation = d3Force
    .forceSimulation(simNodes)
    .force("link", d3Force.forceLink(simLinks).id((d) => (d as { id: string }).id).distance(150))
    .force("charge", d3Force.forceManyBody().strength(-300))
    .force("center", d3Force.forceCenter(400, 300))
    .force("collision", d3Force.forceCollide().radius(60))
    .stop();

  // Run 300 ticks
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

  // Map positions back
  const posMap = new Map(simNodes.map((n) => [n.id, { x: n.x || 0, y: n.y || 0 }]));

  return rfNodes.map((node) => {
    const pos = posMap.get(node.id) || { x: 0, y: 0 };
    return { ...node, position: pos };
  });
}

export function NetworkView() {
  const [config, setConfig] = useState<ViewConfig>({
    ...DEFAULT_VIEW_CONFIG,
    layout: { ...DEFAULT_VIEW_CONFIG.layout, type: "force" },
  });

  const { nodes: vizNodes, edges: vizEdges, isLoading } = useVisualizationData(config.filters);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (vizNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const rfNodes = toReactFlowNodes(vizNodes, config.display.colorBy, config.display.sizeBy);
    const rfEdges = toReactFlowEdges(vizEdges);

    const layoutedNodes = computeForceLayout(rfNodes, rfEdges);
    setNodes(layoutedNodes as Node[]);
    setEdges(rfEdges as Edge[]);
  }, [vizNodes, vizEdges, config.display.colorBy, config.display.sizeBy, setNodes, setEdges]);

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
        <div className="text-sm text-zinc-500">Loading network view...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <ViewSwitcher />
        <ViewToolbar config={config} onConfigChange={handleConfigChange} />
      </div>

      <div className="relative h-[600px] overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500">
              No referral data to visualize. Create some contacts and referrals first.
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
              type: "default",
            }}
          >
            <MiniMap
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
