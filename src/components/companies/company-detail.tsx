"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCompany } from "@/lib/hooks/use-companies";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatRelative, formatPhone } from "@/lib/utils/format";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { EditableField } from "@/components/shared/editable-field";
import { TagInput } from "@/components/shared/tag-input";
import { uploadCompanyLogo, deleteCompanyLogo } from "@/lib/supabase/storage";
import { INDUSTRIES } from "@/lib/utils/constants";
import {
  TrashIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CameraIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";
import { ContactList } from "@/components/contacts/contact-list";
import { DealList } from "@/components/deals/deal-list";
import type { Tag, Activity, ActivityType } from "@/types/database";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogActions,
} from "@/components/catalyst/dialog";

type TabKey = "overview" | "contacts" | "deals" | "activity";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "contacts", label: "Contacts" },
  { key: "deals", label: "Deals" },
  { key: "activity", label: "Activity" },
];

const activityIcons: Record<string, React.ReactElement> = {
  note: DUOTONE_ICONS.DocumentTextIcon,
  call: DUOTONE_ICONS.UserPlusIcon,
  email: DUOTONE_ICONS.PaperAirplaneIcon,
  meeting: DUOTONE_ICONS.UsersIcon,
  deal_created: DUOTONE_ICONS.CurrencyDollarIcon,
  deal_won: DUOTONE_ICONS.TrophyIcon,
  deal_lost: DUOTONE_ICONS.ArrowsRightLeftIcon,
  company_created: DUOTONE_ICONS.BuildingOffice2Icon,
  contact_created: DUOTONE_ICONS.UserPlusIcon,
  contact_updated: DUOTONE_ICONS.ArrowsRightLeftIcon,
};

const fallbackIcon = DUOTONE_ICONS.DocumentTextIcon;

const manualActivityTypes: { value: ActivityType; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
];

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface CompanyDetailProps {
  companyId: string;
}

export function CompanyDetail({ companyId }: CompanyDetailProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const { company, isLoading, error, refresh } = useCompany(companyId);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Tags
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);

  // Activity state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("note");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // Load all org-level tags
  useEffect(() => {
    async function load() {
      if (!org) return;
      const { data } = await supabase
        .from("tags")
        .select("*")
        .eq("org_id", org.id)
        .order("name");
      setAvailableTags(data ?? []);
    }
    load();
  }, [supabase, org]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setIsLoadingActivities(true);
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("entity_type", "company")
      .eq("entity_id", companyId)
      .order("created_at", { ascending: false });
    setActivities(data || []);
    setIsLoadingActivities(false);
  }, [supabase, companyId]);

  useEffect(() => {
    if (activeTab === "activity" || activeTab === "overview") {
      fetchActivities();
    }
  }, [activeTab, fetchActivities]);

  // --- Save helpers ---

  async function logChange(field: string, oldValue: string | null, newValue: string | null) {
    if (!org) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("activities").insert({
      org_id: org.id,
      entity_type: "company" as const,
      entity_id: companyId,
      activity_type: "contact_updated" as const,
      title: `Updated ${formatLabel(field)}`,
      description: null,
      metadata: { field, old_value: oldValue, new_value: newValue },
      created_by: user?.id ?? null,
    });
  }

  async function saveField(field: string, value: string | null) {
    if (!company) return;
    const oldValue = (company as unknown as Record<string, unknown>)[field] as string | null;
    const { error: updateError } = await supabase
      .from("companies")
      .update({ [field]: value })
      .eq("id", company.id);
    if (updateError) {
      toast.error("Failed to save", updateError.message);
      throw updateError;
    }
    await logChange(field, oldValue, value);
    await refresh();
    fetchActivities();
  }

  async function saveNumberField(field: string, value: string | null) {
    if (!company) return;
    const numVal = value ? Number(value) : null;
    const { error: updateError } = await supabase
      .from("companies")
      .update({ [field]: numVal })
      .eq("id", company.id);
    if (updateError) {
      toast.error("Failed to save", updateError.message);
      throw updateError;
    }
    await refresh();
  }

  // --- Tag helpers ---

  async function handleAddTag(tag: Tag) {
    if (!company) return;
    await supabase.from("entity_tags").insert({
      tag_id: tag.id,
      entity_type: "company",
      entity_id: company.id,
    });
    await refresh();
  }

  async function handleRemoveTag(tagId: string) {
    if (!company) return;
    await supabase
      .from("entity_tags")
      .delete()
      .eq("entity_type", "company")
      .eq("entity_id", company.id)
      .eq("tag_id", tagId);
    await refresh();
  }

  async function handleCreateTag(name: string) {
    if (!org) return;
    const { data, error: tagError } = await supabase
      .from("tags")
      .insert({ name, org_id: org.id, entity_type: "company", color: "#2f5435" })
      .select("*")
      .single();
    if (tagError) {
      toast.error("Failed to create tag", tagError.message);
      return;
    }
    const tag = data as Tag;
    setAvailableTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
    await handleAddTag(tag);
  }

  // --- Logo handlers ---

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !company || !org) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Invalid file type", "Please select a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", "Image must be under 5 MB.");
      return;
    }

    setIsUploadingLogo(true);
    try {
      if (company.logo_url) {
        await deleteCompanyLogo(supabase, company.logo_url).catch(() => {});
      }
      const url = await uploadCompanyLogo(supabase, org.id, company.id, file);
      await supabase
        .from("companies")
        .update({ logo_url: url })
        .eq("id", company.id);
      await refresh();
      toast.success("Logo updated", "The company logo has been updated.");
    } catch (err) {
      toast.error("Upload failed", err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleLogoRemove() {
    if (!company?.logo_url) return;
    try {
      await deleteCompanyLogo(supabase, company.logo_url).catch(() => {});
      await supabase
        .from("companies")
        .update({ logo_url: null })
        .eq("id", company.id);
      await refresh();
    } catch (err) {
      toast.error("Failed to remove logo", err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  }

  // --- Activity ---

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityTitle.trim() || !org) return;

    setIsSubmittingActivity(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from("activities").insert({
        org_id: org.id,
        entity_type: "company" as const,
        entity_id: companyId,
        activity_type: activityType,
        title: activityTitle.trim(),
        description: activityDescription.trim() || null,
        created_by: user?.id ?? null,
      });

      if (insertError) throw insertError;

      toast.success("Activity logged", "A new activity has been recorded for this company.");
      setActivityTitle("");
      setActivityDescription("");
      setShowAddForm(false);
      fetchActivities();
    } catch (err) {
      toast.error(
        "Failed to log activity",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmittingActivity(false);
    }
  }

  // --- Delete ---

  async function handleDelete() {
    if (!company) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", company.id);

      if (error) throw error;
      toast.success("Company deleted", "The company has been removed from your network.");
      router.push("/companies");
    } catch (err) {
      toast.error(
        "Failed to delete company",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Company not found."}
        </p>
      </div>
    );
  }

  const initial = company.name.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Clickable logo for upload */}
          <div className="group relative">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-lg font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100"
              title="Change logo"
            >
              {isUploadingLogo ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CameraIcon className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
            />
            {company.logo_url && (
              <button
                type="button"
                onClick={handleLogoRemove}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                title="Remove logo"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            )}
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
              {company.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-500 dark:text-primary-400">
              {company.industry && (
                <span className="flex items-center gap-1">
                  <BuildingOfficeIcon className="h-3.5 w-3.5" />
                  {company.industry}
                </span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <GlobeAltIcon className="h-3.5 w-3.5" />
                  {company.website.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              )}
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <EnvelopeIcon className="h-3.5 w-3.5" />
                  {company.email}
                </a>
              )}
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <PhoneIcon className="h-3.5 w-3.5" />
                  {formatPhone(company.phone)}
                </a>
              )}
            </div>
            {/* Inline tags */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {(company.tags ?? []).map((tag) => (
                <span
                  key={tag.id}
                  className="group/tag inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: tag.color + "20", color: tag.color }}
                >
                  {tag.name}
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="opacity-0 transition-opacity hover:opacity-70 group-hover/tag:opacity-100"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {showTagInput ? (
                <div className="w-56">
                  <TagInput
                    availableTags={availableTags}
                    selectedTags={company.tags ?? []}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                    onCreateTag={handleCreateTag}
                    placeholder="Search or create tag..."
                  />
                  <button
                    onClick={() => setShowTagInput(false)}
                    className="mt-1 text-xs text-primary-400 hover:text-primary-600"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-primary-200 px-2 py-0.5 text-xs text-primary-400 transition-colors hover:border-primary-400 hover:text-primary-500 dark:border-primary-700 dark:text-primary-500"
                >
                  <PlusIcon className="h-3 w-3" />
                  Tag
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <TrashIcon className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-primary-200 dark:border-primary-800">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "border-transparent text-primary-500 hover:border-primary-300 hover:text-primary-700 dark:text-primary-400 dark:hover:border-primary-600 dark:hover:text-primary-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Company Information */}
          <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.BuildingOffice2Icon}</span>
              Company Information
            </h3>
            <dl className="space-y-1">
              <EditableField
                label="Name"
                value={company.name}
                onSave={(v) => saveField("name", v || company.name)}
                placeholder="Company name"
              />
              <EditableField
                label="Industry"
                value={company.industry}
                onSave={(v) => saveField("industry", v)}
                type="select"
                options={INDUSTRIES.map((ind) => ({ value: ind, label: ind }))}
                placeholder="Industry"
              />
              <EditableField
                label="Website"
                value={company.website}
                onSave={(v) => saveField("website", v)}
                type="url"
                isLink
                placeholder="Website URL"
              />
              <EditableField
                label="Phone"
                value={company.phone}
                onSave={(v) => saveField("phone", v)}
                type="tel"
                placeholder="Phone number"
              />
              <EditableField
                label="Email"
                value={company.email}
                onSave={(v) => saveField("email", v)}
                type="email"
                placeholder="Email address"
              />
              <EditableField
                label="Employees"
                value={company.employee_count != null ? String(company.employee_count) : null}
                onSave={(v) => saveNumberField("employee_count", v)}
                placeholder="Number of employees"
              />
              <EditableField
                label="Annual Revenue"
                value={company.annual_revenue != null ? String(company.annual_revenue) : null}
                onSave={(v) => saveNumberField("annual_revenue", v)}
                placeholder="Annual revenue"
              />
            </dl>
          </div>

          {/* Address & Social */}
          <div className="space-y-6">
            <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.MapPinIcon}</span>
                Address
              </h3>
              <dl className="space-y-1">
                <EditableField
                  label="Address Line 1"
                  value={company.address_line1}
                  onSave={(v) => saveField("address_line1", v)}
                  placeholder="Street address"
                />
                <EditableField
                  label="Address Line 2"
                  value={company.address_line2}
                  onSave={(v) => saveField("address_line2", v)}
                  placeholder="Suite, unit, etc."
                />
                <EditableField
                  label="City"
                  value={company.city}
                  onSave={(v) => saveField("city", v)}
                  placeholder="City"
                />
                <EditableField
                  label="State / Province"
                  value={company.state_province}
                  onSave={(v) => saveField("state_province", v)}
                  placeholder="State"
                />
                <EditableField
                  label="Postal Code"
                  value={company.postal_code}
                  onSave={(v) => saveField("postal_code", v)}
                  placeholder="Postal code"
                />
                <EditableField
                  label="Country"
                  value={company.country}
                  onSave={(v) => saveField("country", v)}
                  placeholder="Country"
                />
              </dl>
            </div>

            <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.GlobeAltIcon}</span>
                Social
              </h3>
              <dl className="space-y-1">
                <EditableField
                  label="LinkedIn"
                  value={company.linkedin_url}
                  onSave={(v) => saveField("linkedin_url", v)}
                  type="url"
                  isLink
                  placeholder="LinkedIn URL"
                />
              </dl>
            </div>
          </div>

          {/* Description — always visible */}
          <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.DocumentTextIcon}</span>
              Description
            </h3>
            <EditableField
              label=""
              value={company.description}
              onSave={(v) => saveField("description", v)}
              type="textarea"
              placeholder="Click to add a description for this company..."
            />
          </div>

          {/* Meta */}
          <div className="text-xs text-primary-400 dark:text-primary-500 lg:col-span-2">
            Created {formatDate(company.created_at)} &middot; Last updated{" "}
            {formatRelative(company.updated_at)}
          </div>
        </div>
      )}

      {activeTab === "contacts" && (
        <ContactList companyId={companyId} />
      )}

      {activeTab === "deals" && (
        <DealList companyId={companyId} />
      )}

      {activeTab === "activity" && (
        <div className="space-y-4">
          {/* Log Activity button / form */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <PencilSquareIcon className="h-4 w-4" />
              {showAddForm ? "Cancel" : "Log Activity"}
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddActivity}
              className="rounded-xl border border-primary-200 p-5 dark:border-primary-800"
            >
              <h4 className="mb-4 text-sm font-semibold text-primary-800 dark:text-primary-100">
                Log Activity
              </h4>
              <div className="space-y-3">
                {/* Type selector */}
                <div className="flex gap-2">
                  {manualActivityTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setActivityType(t.value)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        activityType === t.value
                          ? "border-primary-600 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/30 dark:text-primary-300"
                          : "border-primary-200 text-primary-600 hover:border-primary-300 dark:border-primary-700 dark:text-primary-400 dark:hover:border-primary-600"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {/* Title */}
                <input
                  type="text"
                  placeholder="Title"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 placeholder-primary-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-100 dark:placeholder-primary-600"
                />
                {/* Description */}
                <textarea
                  placeholder="Description (optional)"
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 placeholder-primary-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-100 dark:placeholder-primary-600"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingActivity || !activityTitle.trim()}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSubmittingActivity ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Timeline */}
          {isLoadingActivities ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-900/30" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-primary-200 p-12 text-center dark:border-primary-700">
              <p className="text-sm text-primary-500 dark:text-primary-400">
                Notes, calls, and meetings for this company will appear here.
              </p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-primary-200 dark:bg-primary-700" />

              {activities.map((activity) => {
                const meta = activity.metadata as Record<string, unknown> | null;
                const field = meta?.field as string | undefined;
                const oldVal = meta?.old_value as string | null | undefined;
                const newVal = meta?.new_value as string | null | undefined;
                const isAutoLog = activity.activity_type === "contact_updated" && field;

                const resolveValue = (v: string | null | undefined): string => {
                  if (v == null) return "empty";
                  if (v.length > 60) return v.slice(0, 60) + "...";
                  return v;
                };

                return (
                  <div key={activity.id} className="relative flex items-start gap-4 py-3">
                    {/* Icon */}
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-primary-950">
                      <div className="flex h-5 w-5 items-center justify-center">
                        {activityIcons[activity.activity_type] || fallbackIcon}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium text-primary-800 dark:text-primary-100">
                        {activity.title}
                      </p>
                      {isAutoLog && (
                        <p className="mt-0.5 text-sm text-primary-500 dark:text-primary-400">
                          <span className="line-through decoration-red-400/50">{resolveValue(oldVal ?? null)}</span>
                          {" "}
                          <span className="text-primary-400 dark:text-primary-500">&rarr;</span>
                          {" "}
                          <span className="text-primary-700 dark:text-primary-200">{resolveValue(newVal ?? null)}</span>
                        </p>
                      )}
                      {activity.description && (
                        <p className="mt-0.5 text-sm text-primary-500 dark:text-primary-400">
                          {activity.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-primary-400 dark:text-primary-500">
                        {formatRelative(activity.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Dialog open={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} size="sm">
        <DialogTitle>Delete this company?</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {company.name}
          </span>{" "}
          from your network? This action cannot be undone.
        </DialogDescription>
        <div className="mt-4">
          <label htmlFor="delete-confirm" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Type <span className="font-semibold">delete</span> to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="delete"
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-red-500 dark:focus:ring-red-500"
            autoComplete="off"
          />
        </div>
        <DialogActions>
          <button
            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
            disabled={isDeleting}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || deleteConfirmText.toLowerCase() !== "delete"}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
