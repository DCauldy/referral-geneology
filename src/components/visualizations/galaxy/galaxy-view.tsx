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
import { DEFAULT_VIEW_CONFIG, type ViewConfig } from "@/types/visualizations";
import type { VisualizationNode, VisualizationEdge } from "@/types/visualizations";
import { getInitials } from "@/lib/utils/format";

type SimNode = d3.SimulationNodeDatum & VisualizationNode & { color: string; size: number; cluster: string };
type SimLink = d3.SimulationLinkDatum<SimNode> & VisualizationEdge;

const CLUSTER_OPTIONS = [
  { value: "relationship", label: "Relationship Type" },
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

    // Preload profile photos
    const imageCache = new Map<string, HTMLImageElement>();
    let imagesLoaded = 0;
    const imagesToLoad = vizNodes.filter((n) => n.profilePhotoUrl);

    function onImageReady() {
      imagesLoaded++;
      // Trigger a re-render once all images loaded
      if (imagesLoaded >= imagesToLoad.length) {
        simulation.alpha(0.01).restart();
      }
    }

    imagesToLoad.forEach((n) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageCache.set(n.id, img);
        onImageReady();
      };
      img.onerror = () => onImageReady();
      img.src = n.profilePhotoUrl!;
    });

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.3;

    // Resolve cluster key for a node
    function getClusterKey(n: VisualizationNode): string {
      if (clusterBy === "relationship") return n.relationshipType;
      if (clusterBy === "company") return n.company || "independent";
      return "other";
    }

    // Create cluster centroids
    const clusterKeys = new Set<string>();
    vizNodes.forEach((n) => clusterKeys.add(getClusterKey(n)));

    const clusterCentroids = new Map<string, { x: number; y: number }>();
    const angleStep = (2 * Math.PI) / Math.max(clusterKeys.size, 1);
    let i = 0;
    clusterKeys.forEach((key) => {
      clusterCentroids.set(key, {
        x: cx + radius * Math.cos(angleStep * i),
        y: cy + radius * Math.sin(angleStep * i),
      });
      i++;
    });

    // Count nodes per cluster for labels
    const clusterCounts = new Map<string, number>();
    vizNodes.forEach((n) => {
      const key = getClusterKey(n);
      clusterCounts.set(key, (clusterCounts.get(key) || 0) + 1);
    });

    // Create sim nodes
    const simNodes: SimNode[] = vizNodes.map((n) => {
      const cluster = getClusterKey(n);
      const centroid = clusterCentroids.get(cluster) || { x: cx, y: cy };

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
        if (node.x == null || node.y == null) return;
        const centroid = clusterCentroids.get(node.cluster);
        if (centroid) {
          node.vx = (node.vx || 0) + (centroid.x - node.x) * alpha * 0.1;
          node.vy = (node.vy || 0) + (centroid.y - node.y) * alpha * 0.1;
        }
      });
    }

    const simulation = d3
      .forceSimulation(simNodes)
      .force("link", d3.forceLink(simLinks).id((d) => (d as SimNode).id).distance(80).strength(0.3))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(cx, cy))
      .force("collision", d3.forceCollide().radius((d) => ((d as SimNode).size || 10) / 2 + 5))
      .force("cluster", clusterForce)
      .on("tick", render);

    function formatClusterLabel(key: string): string {
      return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      // Draw cluster boundaries
      const clusterRadius = radius * 0.4;
      clusterCentroids.forEach((centroid, key) => {
        const count = clusterCounts.get(key) || 0;
        if (count === 0) return;

        // Radial gradient fill
        const grad = ctx.createRadialGradient(
          centroid.x, centroid.y, 0,
          centroid.x, centroid.y, clusterRadius
        );
        grad.addColorStop(0, "rgba(47, 84, 53, 0.18)");
        grad.addColorStop(0.6, "rgba(47, 84, 53, 0.10)");
        grad.addColorStop(1, "rgba(47, 84, 53, 0)");

        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, clusterRadius, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();

        // Dashed ring
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, clusterRadius, 0, 2 * Math.PI);
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = "rgba(176, 147, 82, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // Cluster label
        const label = formatClusterLabel(key);
        ctx.font = "bold 14px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(176, 147, 82, 1)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, centroid.x, centroid.y - 8);

        // Node count
        ctx.font = "11px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(176, 147, 82, 0.65)";
        ctx.fillText(`${count} contact${count !== 1 ? "s" : ""}`, centroid.x, centroid.y + 10);
      });

      // Draw links
      simLinks.forEach((link) => {
        const source = link.source as SimNode;
        const target = link.target as SimNode;
        if (source.x == null || target.x == null) return;

        ctx.beginPath();
        if (link.isInterNetwork) {
          ctx.setLineDash([6, 3]);
          ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
          ctx.lineWidth = 2;
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = "rgba(47, 84, 53, 0.25)";
          ctx.lineWidth = 1;
        }
        ctx.moveTo(source.x, source.y!);
        ctx.lineTo(target.x, target.y!);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw nodes
      simNodes.forEach((node) => {
        if (node.x == null || node.y == null) return;
        const r = node.size / 2;

        if (node.isGhost) {
          // Ghost node: diamond shape, dashed border, semi-transparent
          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.rotate(Math.PI / 4);

          ctx.beginPath();
          ctx.rect(-r, -r, r * 2, r * 2);
          ctx.fillStyle = `${node.color}30`;
          ctx.fill();
          ctx.setLineDash([3, 2]);
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.restore();

          // Initials (not rotated)
          ctx.font = `bold ${Math.max(9, r * 0.5)}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            getInitials(node.firstName, node.lastName || undefined),
            node.x,
            node.y
          );

          // Label
          if (config.display.showLabels) {
            ctx.font = "9px Inter, system-ui, sans-serif";
            ctx.fillStyle = "rgba(6, 182, 212, 0.6)";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(node.label, node.x, node.y + r + 6);
          }
        } else {
          const photo = imageCache.get(node.id);

          if (photo) {
            // Profile photo node — clipped circle with branded border
            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.clip();
            ctx.drawImage(photo, node.x - r, node.y - r, r * 2, r * 2);
            ctx.restore();

            // Border ring
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Subtle color indicator ring (outer)
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 1.5, 0, 2 * Math.PI);
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            // Normal node: circle with color fill + initials
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
          }

          // Generation badge — top-right of node
          if (node.generation != null) {
            const badgeText = `G${node.generation}`;
            const badgeX = node.x + r * 0.6;
            const badgeY = node.y - r * 0.6;
            const badgeR = 8;

            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeR, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(176, 147, 82, 0.9)";
            ctx.fill();

            ctx.font = "bold 8px Inter, system-ui, sans-serif";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(badgeText, badgeX, badgeY);
          }

          // Label below
          if (config.display.showLabels && r > 15) {
            ctx.font = "10px Inter, system-ui, sans-serif";
            ctx.fillStyle = "rgba(176, 147, 82, 0.7)";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(node.label, node.x, node.y + r + 4);
          }
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
      <div className="flex h-[600px] items-center justify-center rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950">
        <div className="text-sm text-primary-500">Loading galaxy view...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={clusterBy}
          onChange={(e) => setClusterBy(e.target.value)}
          className="rounded-md border border-primary-200 bg-white px-3 py-2 text-xs text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300"
        >
          {CLUSTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Cluster: {opt.label}
            </option>
          ))}
        </select>
        <ViewToolbar config={config} onConfigChange={handleConfigChange} />
      </div>

      <div
        ref={containerRef}
        className="relative h-[600px] overflow-hidden rounded-xl border border-primary-200 bg-primary-950 dark:border-primary-800"
      >
        {vizNodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-primary-400">
              No referral data to visualize. Create some contacts and referrals first.
            </p>
          </div>
        ) : (
          <canvas ref={canvasRef} className="h-full w-full" />
        )}

        {tooltip && (
          <div
            className="pointer-events-none absolute z-50 rounded-lg border border-primary-700 bg-primary-900 p-2 shadow-xl"
            style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
          >
            <p className="text-xs font-semibold text-white">{tooltip.node.label}</p>
            {tooltip.node.company && (
              <p className="text-[10px] text-primary-300">{tooltip.node.company}</p>
            )}
            <p className="mt-1 text-[10px] text-primary-300">
              Score: {tooltip.node.referralScore} | Refs: {tooltip.node.referralCount}
              {tooltip.node.generation != null && ` | Gen ${tooltip.node.generation}`}
            </p>
          </div>
        )}

        <ViewLegend colorBy={config.display.colorBy} showInterNetwork={config.filters.showInterNetwork} />
      </div>
    </div>
  );
}
