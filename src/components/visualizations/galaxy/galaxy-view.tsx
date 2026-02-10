"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useVisualizationData } from "@/lib/hooks/use-visualization-data";
import {
  getNodeColor,
  getNodeSize,
} from "@/lib/visualization/data-transformer";
import { ViewToolbar } from "../shared/view-toolbar";
import { ViewLegend } from "../shared/view-legend";
import { ViewSwitcher } from "../shared/view-switcher";
import { DEFAULT_VIEW_CONFIG, type ViewConfig } from "@/types/visualizations";
import type { VisualizationNode, VisualizationEdge } from "@/types/visualizations";
import { getInitials } from "@/lib/utils/format";

type SimNode = d3.SimulationNodeDatum & VisualizationNode & { color: string; size: number; cluster: string };
type SimLink = d3.SimulationLinkDatum<SimNode> & VisualizationEdge;

const CLUSTER_OPTIONS = [
  { value: "relationship", label: "Relationship Type" },
  { value: "industry", label: "Industry" },
  { value: "company", label: "Company" },
];

export function GalaxyView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<ViewConfig>({
    ...DEFAULT_VIEW_CONFIG,
    layout: { ...DEFAULT_VIEW_CONFIG.layout, type: "cluster" },
  });
  const [clusterBy, setClusterBy] = useState("relationship");
  const [tooltip, setTooltip] = useState<{ node: VisualizationNode; x: number; y: number } | null>(null);

  const { nodes: vizNodes, edges: vizEdges, isLoading } = useVisualizationData(config.filters);

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

  // D3 canvas rendering
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || vizNodes.length === 0) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext("2d")!;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Create cluster centroids
    const clusterKeys = new Set<string>();
    vizNodes.forEach((n) => {
      let key = "other";
      if (clusterBy === "relationship") key = n.relationshipType;
      else if (clusterBy === "industry") key = n.industry || "unknown";
      else if (clusterBy === "company") key = n.company || "independent";
      clusterKeys.add(key);
    });

    const clusterCentroids = new Map<string, { x: number; y: number }>();
    const angleStep = (2 * Math.PI) / Math.max(clusterKeys.size, 1);
    const radius = Math.min(width, height) * 0.3;
    let i = 0;
    clusterKeys.forEach((key) => {
      clusterCentroids.set(key, {
        x: width / 2 + radius * Math.cos(angleStep * i),
        y: height / 2 + radius * Math.sin(angleStep * i),
      });
      i++;
    });

    // Create sim nodes
    const simNodes: SimNode[] = vizNodes.map((n) => {
      let cluster = "other";
      if (clusterBy === "relationship") cluster = n.relationshipType;
      else if (clusterBy === "industry") cluster = n.industry || "unknown";
      else if (clusterBy === "company") cluster = n.company || "independent";

      const centroid = clusterCentroids.get(cluster) || { x: width / 2, y: height / 2 };
      return {
        ...n,
        color: getNodeColor(n, config.display.colorBy),
        size: getNodeSize(n, config.display.sizeBy),
        cluster,
        x: centroid.x + (Math.random() - 0.5) * 100,
        y: centroid.y + (Math.random() - 0.5) * 100,
      };
    });

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks: SimLink[] = vizEdges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        ...e,
        source: e.source,
        target: e.target,
      }));

    // Cluster force
    function clusterForce(alpha: number) {
      simNodes.forEach((node) => {
        const centroid = clusterCentroids.get(node.cluster);
        if (centroid && node.x != null && node.y != null) {
          node.vx = (node.vx || 0) + (centroid.x - node.x) * alpha * 0.1;
          node.vy = (node.vy || 0) + (centroid.y - node.y) * alpha * 0.1;
        }
      });
    }

    const simulation = d3
      .forceSimulation(simNodes)
      .force("link", d3.forceLink(simLinks).id((d) => (d as SimNode).id).distance(80).strength(0.3))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => ((d as SimNode).size || 10) / 2 + 5))
      .force("cluster", clusterForce)
      .on("tick", render);

    function render() {
      ctx.clearRect(0, 0, width, height);

      // Draw cluster boundaries
      clusterCentroids.forEach((centroid, key) => {
        const clusterNodes = simNodes.filter((n) => n.cluster === key);
        if (clusterNodes.length === 0) return;

        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, radius * 0.4, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(148, 163, 184, 0.05)";
        ctx.fill();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cluster label
        ctx.font = "11px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
        ctx.textAlign = "center";
        ctx.fillText(key.replace("_", " "), centroid.x, centroid.y - radius * 0.35);
      });

      // Draw links
      simLinks.forEach((link) => {
        const source = link.source as SimNode;
        const target = link.target as SimNode;
        if (source.x == null || target.x == null) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y!);
        ctx.lineTo(target.x, target.y!);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw nodes
      simNodes.forEach((node) => {
        if (node.x == null || node.y == null) return;
        const r = node.size / 2;

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Initials
        ctx.font = `bold ${Math.max(10, r * 0.6)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          getInitials(node.firstName, node.lastName || undefined),
          node.x,
          node.y
        );

        // Label below
        if (config.display.showLabels && r > 15) {
          ctx.font = "10px Inter, system-ui, sans-serif";
          ctx.fillStyle = "rgba(113, 113, 122, 0.8)";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(node.label, node.x, node.y + r + 4);
        }
      });
    }

    // Mouse interaction for tooltip
    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const hovered = simNodes.find((n) => {
        if (n.x == null || n.y == null) return false;
        const dx = mx - n.x;
        const dy = my - n.y;
        return Math.sqrt(dx * dx + dy * dy) <= n.size / 2;
      });

      if (hovered) {
        setTooltip({ node: hovered, x: mx, y: my });
        canvas.style.cursor = "pointer";
      } else {
        setTooltip(null);
        canvas.style.cursor = "default";
      }
    }

    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      simulation.stop();
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [vizNodes, vizEdges, clusterBy, config.display]);

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm text-zinc-500">Loading galaxy view...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ViewSwitcher />
          <select
            value={clusterBy}
            onChange={(e) => setClusterBy(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {CLUSTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Cluster: {opt.label}
              </option>
            ))}
          </select>
        </div>
        <ViewToolbar config={config} onConfigChange={handleConfigChange} />
      </div>

      <div
        ref={containerRef}
        className="relative h-[600px] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-800"
      >
        {vizNodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-400">
              No referral data to visualize. Create some contacts and referrals first.
            </p>
          </div>
        ) : (
          <canvas ref={canvasRef} className="h-full w-full" />
        )}

        {tooltip && (
          <div
            className="pointer-events-none absolute z-50 rounded-lg border border-zinc-700 bg-zinc-800 p-2 shadow-xl"
            style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
          >
            <p className="text-xs font-semibold text-white">{tooltip.node.label}</p>
            {tooltip.node.company && (
              <p className="text-[10px] text-zinc-400">{tooltip.node.company}</p>
            )}
            <p className="mt-1 text-[10px] text-zinc-400">
              Score: {tooltip.node.referralScore} | Refs: {tooltip.node.referralCount}
            </p>
          </div>
        )}

        <ViewLegend colorBy={config.display.colorBy} />
      </div>
    </div>
  );
}
