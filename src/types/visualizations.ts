export interface VisualizationNode {
  id: string;
  label: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  company: string | null;
  industry: string | null;
  relationshipType: string;
  referralScore: number;
  lifetimeReferralValue: number;
  dealValue: number;
  referralCount: number;
  profilePhotoUrl: string | null;
  rating: number | null;
  city: string | null;
  country: string | null;
  // Layout positions (set by layout algorithm)
  x?: number;
  y?: number;
  // Computed visual properties
  size?: number;
  color?: string;
  cluster?: string;
}

export interface VisualizationEdge {
  id: string;
  source: string;
  target: string;
  referralType: string;
  referralStatus: string;
  referralValue: number | null;
  referralDate: string;
  dealId: string | null;
  dealValue: number | null;
  // Visual properties
  thickness?: number;
  color?: string;
  animated?: boolean;
}

export interface VisualizationFilters {
  search: string;
  relationshipTypes: string[];
  industries: string[];
  referralStatuses: string[];
  minReferralScore: number;
  minDealValue: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  tags: string[];
}

export interface ViewConfig {
  filters: VisualizationFilters;
  layout: {
    type: "dagre" | "force" | "cluster";
    direction?: "TB" | "LR" | "BT" | "RL";
    spacing?: number;
  };
  display: {
    showLabels: boolean;
    showValues: boolean;
    showEdgeLabels: boolean;
    colorBy: "relationship" | "industry" | "score" | "value";
    sizeBy: "referrals" | "value" | "score" | "uniform";
  };
  zoom: number;
  center: { x: number; y: number };
}

export const DEFAULT_FILTERS: VisualizationFilters = {
  search: "",
  relationshipTypes: [],
  industries: [],
  referralStatuses: [],
  minReferralScore: 0,
  minDealValue: 0,
  dateRange: { start: null, end: null },
  tags: [],
};

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  filters: DEFAULT_FILTERS,
  layout: {
    type: "dagre",
    direction: "TB",
    spacing: 100,
  },
  display: {
    showLabels: true,
    showValues: true,
    showEdgeLabels: false,
    colorBy: "relationship",
    sizeBy: "referrals",
  },
  zoom: 1,
  center: { x: 0, y: 0 },
};
