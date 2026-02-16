export const APP_NAME = "Trellis";
export const APP_DESCRIPTION =
  "Visualize and grow your referral network like never before";

export const RELATIONSHIP_TYPES = [
  "contact",
  "client",
  "referral_partner",
  "vendor",
  "colleague",
  "friend",
  "family",
] as const;

export const REFERRAL_TYPES = [
  "direct",
  "introduction",
  "recommendation",
  "mutual",
] as const;

export const REFERRAL_STATUSES = [
  "pending",
  "active",
  "converted",
  "inactive",
  "declined",
] as const;

export const DEAL_TYPES = [
  "one_time",
  "recurring",
  "retainer",
  "project",
] as const;

export const DEAL_STATUSES = ["open", "won", "lost", "abandoned"] as const;

export const ACTIVITY_TYPES = [
  "note",
  "call",
  "email",
  "meeting",
  "task",
  "deal_created",
  "deal_updated",
  "deal_won",
  "deal_lost",
  "referral_made",
  "referral_received",
  "contact_created",
  "contact_updated",
  "company_created",
  "import_completed",
] as const;

export const AUTOMATION_STATUSES = [
  "draft",
  "active",
  "paused",
  "archived",
] as const;

export const AUTOMATION_TRIGGER_TYPES = [
  "manual",
  "on_contact_create",
  "on_tag_added",
] as const;

export const STEP_TYPES = ["email", "delay", "condition"] as const;

export const DELAY_UNITS = ["minutes", "hours", "days", "weeks"] as const;

export const ENROLLMENT_STATUSES = [
  "active",
  "completed",
  "paused",
  "canceled",
  "failed",
] as const;

export const EMAIL_LOG_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "complained",
  "failed",
] as const;

export const INDUSTRIES = [
  "Accounting",
  "Advertising",
  "Aerospace & Defense",
  "Agriculture",
  "Architecture",
  "Automotive",
  "Banking",
  "Biotechnology",
  "Construction",
  "Consulting",
  "Consumer Goods",
  "E-Commerce",
  "Education",
  "Energy & Utilities",
  "Engineering",
  "Entertainment",
  "Environmental Services",
  "Event Planning",
  "Fashion & Apparel",
  "Finance",
  "Fitness & Wellness",
  "Food & Beverage",
  "Government",
  "Graphic Design",
  "Healthcare",
  "Hospitality",
  "Human Resources",
  "Import & Export",
  "Information Technology",
  "Insurance",
  "Interior Design",
  "Investment Management",
  "Legal",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Marketing",
  "Media & Publishing",
  "Mining & Metals",
  "Mortgage & Lending",
  "Nonprofit",
  "Oil & Gas",
  "Pharmaceuticals",
  "Photography & Video",
  "Printing & Packaging",
  "Private Equity",
  "Property Management",
  "Public Relations",
  "Real Estate",
  "Recruiting & Staffing",
  "Retail",
  "Security",
  "Software Development",
  "Solar & Renewable Energy",
  "Sports & Recreation",
  "Telecommunications",
  "Transportation",
  "Travel & Tourism",
  "Venture Capital",
  "Veterinary",
  "Wealth Management",
] as const;

export const PLAN_LIMITS = {
  free: {
    maxContacts: 50,
    maxUsers: 1,
    views: ["tree"] as string[],
    aiInsights: false,
    importExport: false,
    dealTracking: "basic" as const,
    realtimeCollab: false,
    automations: false,
    referralExchange: false,
  },
  pro: {
    maxContacts: Infinity,
    maxUsers: 1,
    views: ["tree", "network", "galaxy"] as string[],
    aiInsights: true,
    importExport: true,
    dealTracking: "full" as const,
    realtimeCollab: false,
    automations: true,
    referralExchange: true,
  },
  team: {
    maxContacts: Infinity,
    maxUsers: 25,
    views: ["tree", "network", "galaxy"] as string[],
    aiInsights: true,
    importExport: true,
    dealTracking: "full" as const,
    realtimeCollab: true,
    automations: true,
    referralExchange: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const DEFAULT_PIPELINE_STAGES = [
  { name: "Lead", display_order: 0, color: "#94a3b8", is_won: false, is_lost: false },
  { name: "Contacted", display_order: 1, color: "#5d8a5a", is_won: false, is_lost: false },
  { name: "Qualified", display_order: 2, color: "#a78bfa", is_won: false, is_lost: false },
  { name: "Proposal", display_order: 3, color: "#2f5435", is_won: false, is_lost: false },
  { name: "Negotiation", display_order: 4, color: "#96b593", is_won: false, is_lost: false },
  { name: "Won", display_order: 5, color: "#22c55e", is_won: true, is_lost: false },
  { name: "Lost", display_order: 6, color: "#ef4444", is_won: false, is_lost: true },
];

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "\u20ac", name: "Euro" },
  { code: "GBP", symbol: "\u00a3", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];
