"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useContact } from "@/lib/hooks/use-contacts";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils/cn";
import { getFullName, getInitials, formatDate, formatRelative, formatPhone } from "@/lib/utils/format";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { EditableField } from "@/components/shared/editable-field";
import { TagInput } from "@/components/shared/tag-input";
import { CreateCompanyModal } from "@/components/companies/create-company-modal";
import { uploadContactPhoto, deleteContactPhoto } from "@/lib/supabase/storage";
import { RELATIONSHIP_TYPES, INDUSTRIES } from "@/lib/utils/constants";
import type { ContactChild, ImportantDate, ContactFavorites, Activity, ActivityType, Tag } from "@/types/database";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";
import {
  PencilSquareIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  StarIcon,
  PaperAirplaneIcon,
  CakeIcon,
  HeartIcon,
  UserGroupIcon,
  CameraIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { SendReferralModal } from "@/components/referrals/send-referral-modal";
import { ReferralList } from "@/components/referrals/referral-list";
import { DealList } from "@/components/deals/deal-list";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogActions,
} from "@/components/catalyst/dialog";

const PREFERRED_CONTACT_METHODS = [
  "email",
  "phone",
  "text",
  "linkedin",
  "in_person",
] as const;

type TabKey = "overview" | "referrals" | "deals" | "activity" | "documents";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "activity", label: "Activity" },
  { key: "referrals", label: "Referrals" },
  { key: "deals", label: "Deals" },
  { key: "documents", label: "Documents" },
];

const activityIcons: Record<string, React.ReactElement> = {
  note: DUOTONE_ICONS.DocumentTextIcon,
  call: DUOTONE_ICONS.UserPlusIcon,
  email: DUOTONE_ICONS.PaperAirplaneIcon,
  meeting: DUOTONE_ICONS.UsersIcon,
  deal_created: DUOTONE_ICONS.CurrencyDollarIcon,
  deal_won: DUOTONE_ICONS.TrophyIcon,
  deal_lost: DUOTONE_ICONS.ArrowsRightLeftIcon,
  referral_made: DUOTONE_ICONS.ArrowUpTrayIcon,
  referral_received: DUOTONE_ICONS.InboxIcon,
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

interface ContactDetailProps {
  contactId: string;
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseCustomFields(cf: unknown) {
  const obj = (cf && typeof cf === "object" && !Array.isArray(cf) ? cf : {}) as Record<string, unknown>;
  return {
    children: (Array.isArray(obj.children) ? obj.children : []) as ContactChild[],
    hobbies: (Array.isArray(obj.hobbies) ? obj.hobbies : []) as string[],
    important_dates: (Array.isArray(obj.important_dates) ? obj.important_dates : []) as ImportantDate[],
    favorites: (obj.favorites && typeof obj.favorites === "object" ? obj.favorites : {}) as ContactFavorites,
  };
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function ContactDetail({ contactId }: ContactDetailProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const { contact, isLoading, error, refresh } = useContact(contactId);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);
  const { canExchangeReferrals } = usePlanLimits();

  // Photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Company select
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Tags
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);

  // Inline children / important dates editing
  const [editingChildren, setEditingChildren] = useState(false);
  const [childrenDraft, setChildrenDraft] = useState<ContactChild[]>([]);
  const [editingDates, setEditingDates] = useState(false);
  const [datesDraft, setDatesDraft] = useState<ImportantDate[]>([]);

  // Activity tab state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("note");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // Load companies for dropdown
  useEffect(() => {
    async function load() {
      if (!org) return;
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("org_id", org.id)
        .order("name");
      setCompanies(data ?? []);
    }
    load();
  }, [supabase, org]);

  // Load all org-level tags (shared across contacts, companies, etc.)
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

  const fetchActivities = useCallback(async () => {
    setIsLoadingActivities(true);
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("entity_type", "contact")
      .eq("entity_id", contactId)
      .order("created_at", { ascending: false });
    setActivities(data || []);
    setIsLoadingActivities(false);
  }, [supabase, contactId]);

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
      entity_type: "contact" as const,
      entity_id: contactId,
      activity_type: "contact_updated" as const,
      title: `Updated ${formatLabel(field)}`,
      description: null,
      metadata: { field, old_value: oldValue, new_value: newValue },
      created_by: user?.id ?? null,
    });
  }

  async function saveField(field: string, value: string | null) {
    if (!contact) return;
    const oldValue = (contact as unknown as Record<string, unknown>)[field] as string | null;
    const { error: updateError } = await supabase
      .from("contacts")
      .update({ [field]: value })
      .eq("id", contact.id);
    if (updateError) {
      toast.error("Failed to save", updateError.message);
      throw updateError;
    }
    await logChange(field, oldValue, value);
    await refresh();
    fetchActivities();
  }

  async function saveCustomField(key: string, value: unknown) {
    if (!contact) return;
    const existing = parseCustomFields(contact.custom_fields);
    const updated = {
      ...(contact.custom_fields && typeof contact.custom_fields === "object" && !Array.isArray(contact.custom_fields)
        ? contact.custom_fields as Record<string, unknown>
        : {}),
    };
    if (key === "hobbies") {
      const arr = typeof value === "string"
        ? value.split(",").map((h) => h.trim()).filter(Boolean)
        : value;
      if (Array.isArray(arr) && arr.length > 0) {
        updated.hobbies = arr;
      } else {
        delete updated.hobbies;
      }
    } else if (key === "favorites") {
      const favs = value as ContactFavorites;
      if (Object.values(favs).some(Boolean)) {
        updated.favorites = favs;
      } else {
        delete updated.favorites;
      }
    } else if (key === "children") {
      const arr = value as ContactChild[];
      if (arr.length > 0) {
        updated.children = arr;
      } else {
        delete updated.children;
      }
    } else if (key === "important_dates") {
      const arr = value as ImportantDate[];
      if (arr.length > 0) {
        updated.important_dates = arr;
      } else {
        delete updated.important_dates;
      }
    }
    const { error: updateError } = await supabase
      .from("contacts")
      .update({ custom_fields: updated })
      .eq("id", contact.id);
    if (updateError) {
      toast.error("Failed to save", updateError.message);
      throw updateError;
    }
    await refresh();
  }

  async function saveRating(newRating: number) {
    if (!contact) return;
    const oldVal = contact.rating ? String(contact.rating) : null;
    const val = newRating === contact.rating ? 0 : newRating;
    const { error: updateError } = await supabase
      .from("contacts")
      .update({ rating: val || null })
      .eq("id", contact.id);
    if (updateError) {
      toast.error("Failed to save rating", updateError.message);
      return;
    }
    await logChange("rating", oldVal, val ? String(val) : null);
    await refresh();
    fetchActivities();
  }

  // --- Tag helpers ---

  async function handleAddTag(tag: Tag) {
    if (!contact) return;
    await supabase.from("entity_tags").insert({
      tag_id: tag.id,
      entity_type: "contact",
      entity_id: contact.id,
    });
    await refresh();
  }

  async function handleRemoveTag(tagId: string) {
    if (!contact) return;
    await supabase
      .from("entity_tags")
      .delete()
      .eq("entity_type", "contact")
      .eq("entity_id", contact.id)
      .eq("tag_id", tagId);
    await refresh();
  }

  async function handleCreateTag(name: string) {
    if (!org) return;
    const { data, error: tagError } = await supabase
      .from("tags")
      .insert({ name, org_id: org.id, entity_type: "contact", color: "#2f5435" })
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

  // --- Photo handlers ---

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !contact || !org) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Invalid file type", "Please select a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", "Image must be under 5 MB.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      if (contact.profile_photo_url) {
        await deleteContactPhoto(supabase, contact.profile_photo_url).catch(() => {});
      }
      const url = await uploadContactPhoto(supabase, org.id, contact.id, file);
      await supabase
        .from("contacts")
        .update({ profile_photo_url: url })
        .eq("id", contact.id);
      await refresh();
      toast.success("Photo updated", "The contact photo has been updated.");
    } catch (err) {
      toast.error("Upload failed", err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePhotoRemove() {
    if (!contact?.profile_photo_url) return;
    try {
      await deleteContactPhoto(supabase, contact.profile_photo_url).catch(() => {});
      await supabase
        .from("contacts")
        .update({ profile_photo_url: null })
        .eq("id", contact.id);
      await refresh();
    } catch (err) {
      toast.error("Failed to remove photo", err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  }

  // --- Company created via modal ---

  async function handleCompanyCreated(companyId: string) {
    // Reload companies list
    if (org) {
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("org_id", org.id)
        .order("name");
      setCompanies(data ?? []);
    }
    // Set the new company on the contact
    await saveField("company_id", companyId);
    setShowCompanyModal(false);
  }

  // --- Children save ---

  async function saveChildren() {
    const filtered = childrenDraft.filter((c) => c.name.trim());
    await saveCustomField("children", filtered);
    setEditingChildren(false);
  }

  // --- Important dates save ---

  async function saveDates() {
    const filtered = datesDraft.filter((d) => d.label.trim() && d.date);
    await saveCustomField("important_dates", filtered);
    setEditingDates(false);
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
        entity_type: "contact" as const,
        entity_id: contactId,
        activity_type: activityType,
        title: activityTitle.trim(),
        description: activityDescription.trim() || null,
        created_by: user?.id ?? null,
      });

      if (insertError) throw insertError;

      toast.success("Activity logged", "A new activity has been recorded for this contact.");
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

  async function handleDelete() {
    if (!contact) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contact.id);

      if (error) throw error;
      toast.success("Contact deleted", "The contact has been removed from your network.");
      router.push("/contacts");
    } catch (err) {
      toast.error(
        "Failed to delete contact",
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
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Contact not found."}
        </p>
      </div>
    );
  }

  const fullName = getFullName(contact.first_name, contact.last_name ?? undefined);
  const initials = getInitials(contact.first_name, contact.last_name ?? undefined);
  const cf = parseCustomFields(contact.custom_fields);

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));
  const relationshipOptions = RELATIONSHIP_TYPES.map((t) => ({
    value: t,
    label: formatLabel(t),
  }));
  const preferredContactOptions = PREFERRED_CONTACT_METHODS.map((m) => ({
    value: m,
    label: formatLabel(m),
  }));

  const inputClassName =
    "block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 shadow-sm placeholder:text-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-100 dark:placeholder:text-primary-600";

  const smallBtnClassName =
    "inline-flex items-center gap-1 rounded-md border border-primary-200 px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/30";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Clickable avatar for photo upload */}
          <div className="group relative">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {contact.profile_photo_url ? (
                <img
                  src={contact.profile_photo_url}
                  alt={fullName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100"
              title="Change photo"
            >
              {isUploadingPhoto ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CameraIcon className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {contact.profile_photo_url && (
              <button
                type="button"
                onClick={handlePhotoRemove}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                title="Remove photo"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            )}
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
              {fullName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-500 dark:text-primary-400">
              {contact.job_title && (
                <span>{contact.job_title}</span>
              )}
              {contact.company?.name && (
                <span className="flex items-center gap-1">
                  <BuildingOfficeIcon className="h-3.5 w-3.5" />
                  {contact.company.name}
                </span>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <EnvelopeIcon className="h-3.5 w-3.5" />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <PhoneIcon className="h-3.5 w-3.5" />
                  {formatPhone(contact.phone)}
                </a>
              )}
              {contact.generation != null && (
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    contact.generation === 1
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  )}
                >
                  Gen {contact.generation}
                </span>
              )}
            </div>
            {/* Inline tags */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {(contact.tags ?? []).map((tag) => (
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
                    selectedTags={contact.tags ?? []}
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
          {canExchangeReferrals && (
            <button
              onClick={() => setShowSendModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Send Referral
            </button>
          )}
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
          {/* Recent Activity */}
          <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.BoltIcon}</span>
                Recent Activity
              </h3>
              <button
                onClick={() => setActiveTab("activity")}
                className="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                View all
              </button>
            </div>
            {isLoadingActivities ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-900/30" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-primary-400 dark:text-primary-500">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-1">
                {activities.slice(0, 5).map((activity) => {
                  const meta = activity.metadata as Record<string, unknown> | null;
                  const field = meta?.field as string | undefined;
                  const oldVal = meta?.old_value as string | null | undefined;
                  const newVal = meta?.new_value as string | null | undefined;
                  const isAutoLog = activity.activity_type === "contact_updated" && field;

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-lg p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                        {activityIcons[activity.activity_type] || fallbackIcon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-primary-800 dark:text-primary-100">
                          {activity.title}
                        </p>
                        {isAutoLog ? (
                          <p className="truncate text-xs text-primary-400">
                            <span className="line-through decoration-red-400/50">{oldVal ?? "empty"}</span>
                            {" → "}
                            <span className="text-primary-600 dark:text-primary-300">{newVal ?? "empty"}</span>
                          </p>
                        ) : activity.description ? (
                          <p className="truncate text-xs text-primary-400">
                            {activity.description}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-xs text-primary-400">
                        {formatRelative(activity.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.UsersIcon}</span>
              Contact Information
            </h3>
            <dl className="space-y-1">
              <EditableField
                label="First Name"
                value={contact.first_name}
                onSave={(v) => saveField("first_name", v || contact.first_name)}
                placeholder="First name"
              />
              <EditableField
                label="Last Name"
                value={contact.last_name}
                onSave={(v) => saveField("last_name", v)}
                placeholder="Last name"
              />
              <EditableField
                label="Email"
                value={contact.email}
                onSave={(v) => saveField("email", v)}
                type="email"
                placeholder="Email address"
              />
              <EditableField
                label="Phone"
                value={contact.phone}
                onSave={(v) => saveField("phone", v)}
                type="tel"
                placeholder="Phone number"
              />
              <EditableField
                label="Mobile"
                value={contact.mobile_phone}
                onSave={(v) => saveField("mobile_phone", v)}
                type="tel"
                placeholder="Mobile number"
              />
              <EditableField
                label="Job Title"
                value={contact.job_title}
                onSave={(v) => saveField("job_title", v)}
                placeholder="Job title"
              />
              {/* Company — select with "New" option */}
              <div className="flex items-center justify-between gap-3 py-1">
                <dt className="shrink-0 text-sm text-primary-500 dark:text-primary-400">
                  Company
                </dt>
                <dd className="flex items-center gap-1.5">
                  <EditableField
                    label=""
                    value={contact.company_id}
                    onSave={(v) => saveField("company_id", v)}
                    type="select"
                    options={companyOptions}
                    placeholder={contact.company?.name || "Select company"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCompanyModal(true)}
                    className="shrink-0 rounded border border-primary-200 p-1 text-primary-400 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:border-primary-700 dark:hover:bg-primary-900/30 dark:hover:text-primary-300"
                    title="Create new company"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </dd>
              </div>
              <EditableField
                label="Industry"
                value={contact.industry}
                onSave={(v) => saveField("industry", v)}
                type="select"
                options={INDUSTRIES.map((ind) => ({ value: ind, label: ind }))}
                placeholder="Industry"
              />
              <EditableField
                label="Relationship"
                value={contact.relationship_type}
                onSave={(v) => saveField("relationship_type", v || "contact")}
                type="select"
                options={relationshipOptions}
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
                  value={contact.address_line1}
                  onSave={(v) => saveField("address_line1", v)}
                  placeholder="Street address"
                />
                <EditableField
                  label="Address Line 2"
                  value={contact.address_line2}
                  onSave={(v) => saveField("address_line2", v)}
                  placeholder="Suite, unit, etc."
                />
                <EditableField
                  label="City"
                  value={contact.city}
                  onSave={(v) => saveField("city", v)}
                  placeholder="City"
                />
                <EditableField
                  label="State / Province"
                  value={contact.state_province}
                  onSave={(v) => saveField("state_province", v)}
                  placeholder="State"
                />
                <EditableField
                  label="Postal Code"
                  value={contact.postal_code}
                  onSave={(v) => saveField("postal_code", v)}
                  placeholder="Postal code"
                />
                <EditableField
                  label="Country"
                  value={contact.country}
                  onSave={(v) => saveField("country", v)}
                  placeholder="Country"
                />
              </dl>
            </div>

            <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.GlobeAltIcon}</span>
                Social & Web
              </h3>
              <dl className="space-y-1">
                <EditableField
                  label="LinkedIn"
                  value={contact.linkedin_url}
                  onSave={(v) => saveField("linkedin_url", v)}
                  type="url"
                  isLink
                  placeholder="LinkedIn URL"
                />
                <EditableField
                  label="Twitter"
                  value={contact.twitter_url}
                  onSave={(v) => saveField("twitter_url", v)}
                  type="url"
                  isLink
                  placeholder="Twitter URL"
                />
                <EditableField
                  label="Facebook"
                  value={contact.facebook_url}
                  onSave={(v) => saveField("facebook_url", v)}
                  type="url"
                  isLink
                  placeholder="Facebook URL"
                />
                <EditableField
                  label="Website"
                  value={contact.website_url}
                  onSave={(v) => saveField("website_url", v)}
                  type="url"
                  isLink
                  placeholder="Website URL"
                />
              </dl>
            </div>
          </div>

          {/* Personal Details — always visible */}
          <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.HeartIcon}</span>
              Personal Details
            </h3>
            <dl className="space-y-1">
              <EditableField
                label="Birthday"
                value={contact.birthday}
                onSave={(v) => saveField("birthday", v)}
                type="date"
                placeholder="Add birthday"
                formatDisplay={(v) => formatDate(v)}
              />
              <EditableField
                label="Anniversary"
                value={contact.anniversary}
                onSave={(v) => saveField("anniversary", v)}
                type="date"
                placeholder="Add anniversary"
                formatDisplay={(v) => formatDate(v)}
              />
              <EditableField
                label="Spouse / Partner"
                value={contact.spouse_partner_name}
                onSave={(v) => saveField("spouse_partner_name", v)}
                placeholder="Spouse or partner name"
              />
              <EditableField
                label="Preferred Contact"
                value={contact.preferred_contact_method}
                onSave={(v) => saveField("preferred_contact_method", v || "email")}
                type="select"
                options={preferredContactOptions}
              />
            </dl>
          </div>

          {/* Interests & Family — always visible */}
          <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.SparklesIcon}</span>
              Interests & Family
            </h3>
            <div className="space-y-4">
              {/* Children */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-sm text-primary-500 dark:text-primary-400">
                    <UserGroupIcon className="h-4 w-4" />
                    Children
                  </dt>
                  {!editingChildren && (
                    <button
                      type="button"
                      onClick={() => {
                        setChildrenDraft(cf.children.length > 0 ? [...cf.children] : [{ name: "" }]);
                        setEditingChildren(true);
                      }}
                      className={smallBtnClassName}
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      {cf.children.length > 0 ? "Edit" : "Add"}
                    </button>
                  )}
                </div>
                {editingChildren ? (
                  <div className="space-y-2">
                    {childrenDraft.map((child, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => {
                            const next = [...childrenDraft];
                            next[i] = { ...next[i], name: e.target.value };
                            setChildrenDraft(next);
                          }}
                          className={cn(inputClassName, "flex-1")}
                          placeholder="Name"
                        />
                        <input
                          type="date"
                          value={child.birthday ?? ""}
                          onChange={(e) => {
                            const next = [...childrenDraft];
                            next[i] = { ...next[i], birthday: e.target.value || undefined };
                            setChildrenDraft(next);
                          }}
                          className={cn(inputClassName, "w-40")}
                        />
                        <button
                          type="button"
                          onClick={() => setChildrenDraft((prev) => prev.filter((_, idx) => idx !== i))}
                          className="rounded p-1 text-primary-400 hover:bg-primary-100 hover:text-red-500 dark:hover:bg-primary-900/30"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChildrenDraft((prev) => [...prev, { name: "" }])}
                        className={smallBtnClassName}
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={saveChildren}
                        className="rounded-md bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingChildren(false)}
                        className="text-xs text-primary-400 hover:text-primary-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : cf.children.length > 0 ? (
                  <dd className="space-y-1">
                    {cf.children.map((child, i) => (
                      <div key={i} className="text-sm text-primary-800 dark:text-primary-100">
                        {child.name}
                        {child.birthday && (
                          <span className="ml-1.5 text-xs text-primary-400">
                            ({formatDate(child.birthday)})
                          </span>
                        )}
                      </div>
                    ))}
                  </dd>
                ) : (
                  <p className="text-xs text-primary-400 dark:text-primary-500">
                    No children added yet.
                  </p>
                )}
              </div>

              {/* Hobbies */}
              <EditableField
                label="Hobbies / Interests"
                value={cf.hobbies.length > 0 ? cf.hobbies.join(", ") : null}
                onSave={async (v) => {
                  await saveCustomField("hobbies", v ?? "");
                }}
                placeholder="Golf, Reading, Cooking (comma-separated)"
              />

              {/* Important Dates */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-sm text-primary-500 dark:text-primary-400">
                    <CakeIcon className="h-4 w-4" />
                    Important Dates
                  </dt>
                  {!editingDates && (
                    <button
                      type="button"
                      onClick={() => {
                        setDatesDraft(cf.important_dates.length > 0 ? [...cf.important_dates] : [{ label: "", date: "" }]);
                        setEditingDates(true);
                      }}
                      className={smallBtnClassName}
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      {cf.important_dates.length > 0 ? "Edit" : "Add"}
                    </button>
                  )}
                </div>
                {editingDates ? (
                  <div className="space-y-2">
                    {datesDraft.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={d.label}
                          onChange={(e) => {
                            const next = [...datesDraft];
                            next[i] = { ...next[i], label: e.target.value };
                            setDatesDraft(next);
                          }}
                          className={cn(inputClassName, "flex-1")}
                          placeholder="Label (e.g., Work Anniversary)"
                        />
                        <input
                          type="date"
                          value={d.date}
                          onChange={(e) => {
                            const next = [...datesDraft];
                            next[i] = { ...next[i], date: e.target.value };
                            setDatesDraft(next);
                          }}
                          className={cn(inputClassName, "w-40")}
                        />
                        <button
                          type="button"
                          onClick={() => setDatesDraft((prev) => prev.filter((_, idx) => idx !== i))}
                          className="rounded p-1 text-primary-400 hover:bg-primary-100 hover:text-red-500 dark:hover:bg-primary-900/30"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDatesDraft((prev) => [...prev, { label: "", date: "" }])}
                        className={smallBtnClassName}
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={saveDates}
                        className="rounded-md bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDates(false)}
                        className="text-xs text-primary-400 hover:text-primary-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : cf.important_dates.length > 0 ? (
                  <dd className="space-y-1">
                    {cf.important_dates.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-primary-500 dark:text-primary-400">{d.label}</span>
                        <span className="font-medium text-primary-800 dark:text-primary-100">
                          {formatDate(d.date)}
                        </span>
                      </div>
                    ))}
                  </dd>
                ) : (
                  <p className="text-xs text-primary-400 dark:text-primary-500">
                    No important dates added yet.
                  </p>
                )}
              </div>

              {/* Favorites */}
              <div>
                <dt className="mb-1.5 flex items-center gap-1.5 text-sm text-primary-500 dark:text-primary-400">
                  <HeartIcon className="h-4 w-4" />
                  Favorites
                </dt>
                <dl className="space-y-1">
                  <EditableField
                    label="Restaurant"
                    value={cf.favorites.restaurant ?? null}
                    onSave={async (v) => {
                      await saveCustomField("favorites", { ...cf.favorites, restaurant: v ?? undefined });
                    }}
                    placeholder="Favorite restaurant"
                  />
                  <EditableField
                    label="Sports Team"
                    value={cf.favorites.sports_team ?? null}
                    onSave={async (v) => {
                      await saveCustomField("favorites", { ...cf.favorites, sports_team: v ?? undefined });
                    }}
                    placeholder="Favorite team"
                  />
                  <EditableField
                    label="Other"
                    value={cf.favorites.other ?? null}
                    onSave={async (v) => {
                      await saveCustomField("favorites", { ...cf.favorites, other: v ?? undefined });
                    }}
                    placeholder="Anything else"
                  />
                </dl>
              </div>
            </div>
          </div>

          {/* Scores & Metrics */}
          <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.ChartBarIcon}</span>
              Scores & Metrics
            </h3>
            <dl className="space-y-1">
              <EditableField
                label="Generation"
                value={contact.generation != null ? `Gen ${contact.generation}` : null}
                onSave={async () => {}}
                readOnly
              />
              <EditableField
                label="Referral Score"
                value={String(contact.referral_score)}
                onSave={async () => {}}
                readOnly
                tooltip="1 point per referral + 2 bonus points for each converted referral"
              />
              <EditableField
                label="Lifetime Referral Value"
                value={`$${contact.lifetime_referral_value.toLocaleString()}`}
                onSave={async () => {}}
                readOnly
              />
              {/* Interactive star rating */}
              <div className="flex items-center justify-between py-1">
                <dt className="text-sm text-primary-500 dark:text-primary-400">
                  Rating
                </dt>
                <dd className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => saveRating(star)}
                      className="transition-colors hover:scale-110"
                    >
                      {star <= (contact.rating ?? 0) ? (
                        <StarSolidIcon className="h-4 w-4 text-primary-400" />
                      ) : (
                        <StarIcon className="h-4 w-4 text-primary-300 hover:text-primary-300 dark:text-primary-700" />
                      )}
                    </button>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Notes — always visible */}
          <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.DocumentTextIcon}</span>
              Notes
            </h3>
            <EditableField
              label=""
              value={contact.notes}
              onSave={(v) => saveField("notes", v)}
              type="textarea"
              placeholder="Click to add notes about this contact..."
            />
          </div>

          {/* Meta */}
          <div className="text-xs text-primary-400 dark:text-primary-500 lg:col-span-2">
            Created {formatDate(contact.created_at)} &middot; Last updated{" "}
            {formatRelative(contact.updated_at)}
          </div>
        </div>
      )}

      {activeTab === "referrals" && (
        <ReferralList contactId={contactId} />
      )}

      {activeTab === "deals" && (
        <DealList contactId={contactId} />
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
                Notes, calls, and meetings for this contact will appear here.
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

                // Resolve display values for IDs and special fields
                const resolveValue = (f: string | undefined, v: string | null | undefined): string => {
                  if (v == null) return "empty";
                  if (f === "company_id") {
                    const c = companies.find((co) => co.id === v);
                    return c ? c.name : v;
                  }
                  if (f === "relationship_type") return formatLabel(v);
                  if (f === "preferred_contact_method") return formatLabel(v);
                  if (f === "birthday" || f === "anniversary") return formatDate(v);
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
                          <span className="line-through decoration-red-400/50">{resolveValue(field, oldVal ?? null)}</span>
                          {" "}
                          <span className="text-primary-400 dark:text-primary-500">&rarr;</span>
                          {" "}
                          <span className="text-primary-700 dark:text-primary-200">{resolveValue(field, newVal ?? null)}</span>
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

      {activeTab === "documents" && (
        <div className="rounded-xl border border-dashed border-primary-200 p-12 text-center dark:border-primary-700">
          <p className="text-sm text-primary-500 dark:text-primary-400">
            Attached documents will appear here.
          </p>
        </div>
      )}

      {showSendModal && (
        <SendReferralModal
          contact={contact}
          onClose={() => setShowSendModal(false)}
        />
      )}

      <CreateCompanyModal
        open={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onCreated={handleCompanyCreated}
      />

      <Dialog open={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} size="sm">
        <DialogTitle>Delete this contact?</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {contact ? getFullName(contact.first_name, contact.last_name ?? undefined) : "this contact"}
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
