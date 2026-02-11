export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlanType = "free" | "pro" | "team";
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "trialing";
export type OrgRole = "owner" | "admin" | "member" | "viewer";
export type RelationshipType =
  | "contact"
  | "client"
  | "referral_partner"
  | "vendor"
  | "colleague"
  | "friend";
export type ReferralType =
  | "direct"
  | "introduction"
  | "recommendation"
  | "mutual";
export type ReferralStatus =
  | "pending"
  | "active"
  | "converted"
  | "inactive"
  | "declined";
export type DealType = "one_time" | "recurring" | "retainer" | "project";
export type DealStatus = "open" | "won" | "lost" | "abandoned";
export type EntityType = "contact" | "company" | "deal";
export type ActivityType =
  | "note"
  | "call"
  | "email"
  | "meeting"
  | "task"
  | "deal_created"
  | "deal_updated"
  | "deal_won"
  | "deal_lost"
  | "referral_made"
  | "referral_received"
  | "contact_created"
  | "contact_updated"
  | "company_created"
  | "import_completed";
export type InsightType =
  | "referral_pattern"
  | "top_referrers"
  | "network_gap"
  | "deal_prediction"
  | "cluster_analysis"
  | "growth_opportunity";
export type ViewType = "tree" | "network" | "galaxy";
export type ImportStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  plan: PlanType;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  subscription_status: SubscriptionStatus | null;
  max_contacts: number;
  max_users: number;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  invited_email: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
  active_org_id: string | null;
  onboarding_completed: boolean;
  preferences: Json;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  mobile_phone: string | null;
  job_title: string | null;
  company_id: string | null;
  industry: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  relationship_type: RelationshipType;
  referral_score: number;
  lifetime_referral_value: number;
  rating: number | null;
  profile_photo_url: string | null;
  notes: string | null;
  custom_fields: Json;
  created_at: string;
  updated_at: string;
  // Joined fields
  company?: Company;
  tags?: Tag[];
}

export interface Company {
  id: string;
  org_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  employee_count: number | null;
  annual_revenue: number | null;
  description: string | null;
  logo_url: string | null;
  linkedin_url: string | null;
  custom_fields: Json;
  created_at: string;
  updated_at: string;
  // Joined fields
  tags?: Tag[];
  _contact_count?: number;
}

export interface Tag {
  id: string;
  org_id: string;
  name: string;
  color: string;
  entity_type: EntityType;
  created_at: string;
}

export interface EntityTag {
  id: string;
  tag_id: string;
  entity_type: EntityType;
  entity_id: string;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  org_id: string;
  name: string;
  display_order: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  org_id: string;
  name: string;
  value: number | null;
  currency: string;
  stage_id: string | null;
  probability: number | null;
  contact_id: string | null;
  company_id: string | null;
  deal_type: DealType;
  recurring_interval: string | null;
  recurring_value: number | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  status: DealStatus;
  description: string | null;
  notes: string | null;
  custom_fields: Json;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact?: Contact;
  company?: Company;
  stage?: PipelineStage;
  tags?: Tag[];
}

export interface Referral {
  id: string;
  org_id: string;
  referrer_id: string;
  referred_id: string;
  deal_id: string | null;
  referral_date: string;
  referral_type: ReferralType;
  status: ReferralStatus;
  referral_value: number | null;
  depth: number;
  root_referrer_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  referrer?: Contact;
  referred?: Contact;
  deal?: Deal;
}

export interface Activity {
  id: string;
  org_id: string;
  entity_type: EntityType | "referral";
  entity_id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  metadata: Json;
  created_by: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  org_id: string;
  entity_type: EntityType;
  entity_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface AiInsight {
  id: string;
  org_id: string;
  insight_type: InsightType;
  title: string;
  summary: string;
  details: Json;
  confidence: number | null;
  is_dismissed: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface SavedView {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  view_type: ViewType;
  config: Json;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImportJob {
  id: string;
  org_id: string;
  user_id: string;
  file_name: string;
  entity_type: EntityType;
  status: ImportStatus;
  total_rows: number;
  processed_rows: number;
  error_rows: number;
  errors: Json;
  field_mapping: Json;
  created_at: string;
  updated_at: string;
}

// Automation types
export type AutomationStatus = "draft" | "active" | "paused" | "archived";
export type AutomationTriggerType =
  | "manual"
  | "on_contact_create"
  | "on_tag_added";
export type StepType = "email" | "delay" | "condition";
export type DelayUnit = "minutes" | "hours" | "days" | "weeks";
export type EnrollmentStatus =
  | "active"
  | "completed"
  | "paused"
  | "canceled"
  | "failed";
export type EmailLogStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "failed";

export interface EmailTemplate {
  id: string;
  org_id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: Json;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Automation {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: AutomationStatus;
  trigger_type: AutomationTriggerType;
  trigger_config: Json;
  stats: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  steps?: AutomationStep[];
  _enrollment_count?: number;
}

export interface AutomationStep {
  id: string;
  automation_id: string;
  step_order: number;
  step_type: StepType;
  template_id: string | null;
  subject_override: string | null;
  delay_amount: number;
  delay_unit: DelayUnit;
  config: Json;
  created_at: string;
  updated_at: string;
  // Joined fields
  template?: EmailTemplate;
}

export interface AutomationEnrollment {
  id: string;
  automation_id: string;
  contact_id: string;
  status: EnrollmentStatus;
  current_step_order: number;
  next_action_at: string | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact?: Contact;
  automation?: Automation;
}

export interface EmailLog {
  id: string;
  org_id: string;
  enrollment_id: string | null;
  automation_id: string | null;
  step_id: string | null;
  template_id: string | null;
  contact_id: string | null;
  resend_id: string | null;
  to_email: string;
  subject: string;
  status: EmailLogStatus;
  error_message: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact?: Contact;
  template?: EmailTemplate;
}

// Database function return types
export interface ReferralChainNode {
  contact_id: string;
  first_name: string;
  last_name: string | null;
  depth: number;
  path: string[];
}

export interface OrgStats {
  total_contacts: number;
  total_companies: number;
  total_deals: number;
  total_referrals: number;
  total_deal_value: number;
  won_deal_value: number;
  pipeline_value: number;
  avg_referral_chain_depth: number;
  conversion_rate: number;
}
