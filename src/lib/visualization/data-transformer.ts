import type {
  VisualizationNode,
  VisualizationEdge,
} from "@/types/visualizations";

// Color scales for different visualization attributes
const RELATIONSHIP_COLORS: Record<string, string> = {
  contact: "#94a3b8",
  client: "#d97706",
  referral_partner: "#8b5cf6",
  vendor: "#ea580c",
  colleague: "#22c55e",
  friend: "#ec4899",
};

const INDUSTRY_COLORS: Record<string, string> = {
  technology: "#d97706",
  healthcare: "#ef4444",
  finance: "#f59e0b",
  real_estate: "#22c55e",
  education: "#8b5cf6",
  manufacturing: "#f97316",
  retail: "#ec4899",
  consulting: "#06b6d4",
  legal: "#6366f1",
  marketing: "#14b8a6",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#fbbf24",
  active: "#d97706",
  converted: "#22c55e",
  inactive: "#94a3b8",
  declined: "#ef4444",
};

export function getNodeColor(
  node: VisualizationNode,
  colorBy: string
): string {
  switch (colorBy) {
    case "relationship":
      return RELATIONSHIP_COLORS[node.relationshipType] || "#94a3b8";
    case "industry":
      return INDUSTRY_COLORS[node.industry?.toLowerCase() || ""] || "#94a3b8";
    case "score":
      return scoreToColor(node.referralScore);
    case "value":
      return valueToColor(node.dealValue);
    default:
      return "#d97706";
  }
}

export function getNodeSize(
  node: VisualizationNode,
  sizeBy: string
): number {
  const BASE_SIZE = 40;
  const MAX_SIZE = 80;

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
  return STATUS_COLORS[edge.referralStatus] || "#94a3b8";
}

export function getEdgeThickness(edge: VisualizationEdge): number {
  if (!edge.referralValue) return 1;
  return Math.max(1, Math.min(5, edge.referralValue / 10000));
}

function scoreToColor(score: number): string {
  // Gradient from gray (0) to green (100+)
  if (score <= 0) return "#94a3b8";
  if (score < 25) return "#f59e0b";
  if (score < 50) return "#f97316";
  if (score < 75) return "#22c55e";
  return "#16a34a";
}

function valueToColor(value: number): string {
  if (value <= 0) return "#94a3b8";
  if (value < 10000) return "#fbbf24";
  if (value < 50000) return "#d97706";
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
    type: "custom",
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
    },
    animated: edge.referralStatus === "active",
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
export function getLegendItems(colorBy: string): Array<{ label: string; color: string }> {
  switch (colorBy) {
    case "relationship":
      return Object.entries(RELATIONSHIP_COLORS).map(([key, color]) => ({
        label: key.replace("_", " "),
        color,
      }));
    case "industry":
      return Object.entries(INDUSTRY_COLORS).map(([key, color]) => ({
        label: key.replace("_", " "),
        color,
      }));
    case "score":
      return [
        { label: "Low (0)", color: "#94a3b8" },
        { label: "Medium (25)", color: "#f59e0b" },
        { label: "Good (50)", color: "#f97316" },
        { label: "High (75)", color: "#22c55e" },
        { label: "Excellent (100+)", color: "#16a34a" },
      ];
    case "value":
      return [
        { label: "None", color: "#94a3b8" },
        { label: "<$10K", color: "#fbbf24" },
        { label: "$10K-$50K", color: "#d97706" },
        { label: "$50K-$100K", color: "#8b5cf6" },
        { label: ">$100K", color: "#6d28d9" },
      ];
    default:
      return [];
  }
}
