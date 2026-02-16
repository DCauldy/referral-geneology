import type {
  VisualizationNode,
  VisualizationEdge,
} from "@/types/visualizations";

// Color scales for different visualization attributes
const RELATIONSHIP_COLORS: Record<string, string> = {
  contact: "#94a3b8",
  client: "#2f5435",
  referral_partner: "#8b5cf6",
  vendor: "#5d8a5a",
  colleague: "#22c55e",
  friend: "#ec4899",
  family: "#f59e0b",
};

const INDUSTRY_COLORS: Record<string, string> = {
  technology: "#2f5435",
  healthcare: "#ef4444",
  finance: "#5d8a5a",
  real_estate: "#22c55e",
  education: "#8b5cf6",
  manufacturing: "#96b593",
  retail: "#ec4899",
  consulting: "#06b6d4",
  legal: "#6366f1",
  marketing: "#14b8a6",
};

const GENERATION_COLORS: Record<number, string> = {
  1: "#2f5435", // hunter green
  2: "#5d8a5a",
  3: "#8b5cf6",
  4: "#b09352", // warm tan
  5: "#ec4899",
};
const GENERATION_DEFAULT_COLOR = "#06b6d4"; // Gen 6+

const STATUS_COLORS: Record<string, string> = {
  pending: "#96b593",
  active: "#2f5435",
  converted: "#22c55e",
  inactive: "#94a3b8",
  declined: "#ef4444",
};

// Inter-network exchange color
const INTER_NETWORK_COLOR = "#06b6d4"; // teal-500
const GHOST_NODE_COLOR = "#06b6d4";

export function getNodeColor(
  node: VisualizationNode,
  colorBy: string
): string {
  if (node.isGhost) return GHOST_NODE_COLOR;

  switch (colorBy) {
    case "relationship":
      return RELATIONSHIP_COLORS[node.relationshipType] || "#94a3b8";
    case "industry":
      return INDUSTRY_COLORS[node.industry?.toLowerCase() || ""] || "#94a3b8";
    case "score":
      return scoreToColor(node.referralScore);
    case "value":
      return valueToColor(node.dealValue);
    case "generation":
      if (node.generation == null) return "#94a3b8";
      return GENERATION_COLORS[node.generation] || GENERATION_DEFAULT_COLOR;
    default:
      return "#2f5435";
  }
}

export function getNodeSize(
  node: VisualizationNode,
  sizeBy: string
): number {
  const BASE_SIZE = 40;
  const MAX_SIZE = 80;
  const GHOST_SIZE = 32;

  if (node.isGhost) return GHOST_SIZE;

  switch (sizeBy) {
    case "referrals": {
      const scale = Math.min(node.referralCount / 10, 1);
      return BASE_SIZE + scale * (MAX_SIZE - BASE_SIZE);
    }
    case "value": {
      const scale = Math.min(node.dealValue / 100000, 1);
      return BASE_SIZE + scale * (MAX_SIZE - BASE_SIZE);
    }
    case "score": {
      const scale = Math.min(node.referralScore / 100, 1);
      return BASE_SIZE + scale * (MAX_SIZE - BASE_SIZE);
    }
    case "uniform":
    default:
      return BASE_SIZE;
  }
}

export function getEdgeColor(edge: VisualizationEdge): string {
  if (edge.isInterNetwork) return INTER_NETWORK_COLOR;
  return STATUS_COLORS[edge.referralStatus] || "#94a3b8";
}

export function getEdgeThickness(edge: VisualizationEdge): number {
  if (edge.isInterNetwork) return 2;
  if (!edge.referralValue) return 1;
  return Math.max(1, Math.min(5, edge.referralValue / 10000));
}

function scoreToColor(score: number): string {
  // Gradient from gray (0) to green (100+)
  if (score <= 0) return "#94a3b8";
  if (score < 25) return "#96b593";
  if (score < 50) return "#5d8a5a";
  if (score < 75) return "#22c55e";
  return "#16a34a";
}

function valueToColor(value: number): string {
  if (value <= 0) return "#94a3b8";
  if (value < 10000) return "#96b593";
  if (value < 50000) return "#5d8a5a";
  if (value < 100000) return "#8b5cf6";
  return "#6d28d9";
}

// Convert visualization data to React Flow format
export function toReactFlowNodes(
  nodes: VisualizationNode[],
  colorBy: string = "relationship",
  sizeBy: string = "referrals"
) {
  return nodes.map((node) => ({
    id: node.id,
    type: node.isGhost ? "ghost" : "custom",
    position: { x: node.x || 0, y: node.y || 0 },
    data: {
      ...node,
      color: getNodeColor(node, colorBy),
      size: getNodeSize(node, sizeBy),
    },
  }));
}

export function toReactFlowEdges(edges: VisualizationEdge[]) {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "custom",
    data: {
      ...edge,
      color: getEdgeColor(edge),
      thickness: getEdgeThickness(edge),
    },
    style: {
      stroke: getEdgeColor(edge),
      strokeWidth: getEdgeThickness(edge),
      ...(edge.isInterNetwork
        ? { strokeDasharray: "6 3" }
        : {}),
    },
    animated: edge.isInterNetwork
      ? edge.exchangeStatus === "pending"
      : edge.referralStatus === "active",
  }));
}

// Build an adjacency map for tree layout
export function buildAdjacencyMap(edges: VisualizationEdge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of edges) {
    const children = map.get(edge.source) || [];
    children.push(edge.target);
    map.set(edge.source, children);
  }
  return map;
}

// Find root nodes (nodes with no incoming edges)
export function findRootNodes(
  nodes: VisualizationNode[],
  edges: VisualizationEdge[]
): string[] {
  const targets = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !targets.has(n.id)).map((n) => n.id);
  // If no roots found (circular), use first node
  return roots.length > 0 ? roots : nodes.length > 0 ? [nodes[0].id] : [];
}

// Get legend items for current color scheme
export function getLegendItems(colorBy: string, showInterNetwork?: boolean): Array<{ label: string; color: string }> {
  let items: Array<{ label: string; color: string }>;

  switch (colorBy) {
    case "relationship":
      items = Object.entries(RELATIONSHIP_COLORS).map(([key, color]) => ({
        label: key.replace("_", " "),
        color,
      }));
      break;
    case "industry":
      items = Object.entries(INDUSTRY_COLORS).map(([key, color]) => ({
        label: key.replace("_", " "),
        color,
      }));
      break;
    case "score":
      items = [
        { label: "Low (0)", color: "#94a3b8" },
        { label: "Medium (25)", color: "#96b593" },
        { label: "Good (50)", color: "#5d8a5a" },
        { label: "High (75)", color: "#22c55e" },
        { label: "Excellent (100+)", color: "#16a34a" },
      ];
      break;
    case "value":
      items = [
        { label: "None", color: "#94a3b8" },
        { label: "<$10K", color: "#96b593" },
        { label: "$10K-$50K", color: "#5d8a5a" },
        { label: "$50K-$100K", color: "#8b5cf6" },
        { label: ">$100K", color: "#6d28d9" },
      ];
      break;
    case "generation":
      items = [
        { label: "Gen 1 (Direct)", color: GENERATION_COLORS[1] },
        { label: "Gen 2", color: GENERATION_COLORS[2] },
        { label: "Gen 3", color: GENERATION_COLORS[3] },
        { label: "Gen 4", color: GENERATION_COLORS[4] },
        { label: "Gen 5", color: GENERATION_COLORS[5] },
        { label: "Gen 6+", color: GENERATION_DEFAULT_COLOR },
      ];
      break;
    default:
      items = [];
  }

  if (showInterNetwork) {
    items.push({ label: "Inter-network", color: INTER_NETWORK_COLOR });
  }

  return items;
}
