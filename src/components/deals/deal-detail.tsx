"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDeal, usePipelineStages } from "@/lib/hooks/use-deals";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils/cn";
import { EditableField } from "@/components/shared/editable-field";
import { TagInput } from "@/components/shared/tag-input";
import { DEAL_TYPES, CURRENCIES } from "@/lib/utils/constants";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";
import {
  formatCurrency,
  formatDate,
  formatRelative,
  formatPhone,
  getFullName,
} from "@/lib/utils/format";
import { linkWonDealToReferrals } from "@/lib/utils/deal-referral-link";
import { Skeleton } from "@/components/shared/loading-skeleton";
import {
  TrashIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  PlusIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import type { Tag, Contact, PipelineStage, Activity } from "@/types/database";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogActions,
} from "@/components/catalyst/dialog";

type TabKey = "overview" | "activity" | "documents";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "activity", label: "Activity" },
  { key: "documents", label: "Documents" },
];

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface DealDetailProps {
  dealId: string;
}

export function DealDetail({ dealId }: DealDetailProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const { deal, isLoading, error, refresh } = useDeal(dealId);
  const { stages } = usePipelineStages();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Contacts for select dropdown
  const [contacts, setContacts] = useState<Pick<Contact, "id" | "first_name" | "last_name">[]>([]);

  // Tags
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);

  // Activity changelog
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const fetchActivities = useCallback(async () => {
    setIsLoadingActivities(true);
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("entity_type", "deal")
      .eq("entity_id", dealId)
      .order("created_at", { ascending: false });
    setActivities(data || []);
    setIsLoadingActivities(false);
  }, [supabase, dealId]);

  useEffect(() => {
    if (activeTab === "activity") {
      fetchActivities();
    }
  }, [activeTab, fetchActivities]);

  // Load contacts for dropdown
  useEffect(() => {
    async function load() {
      if (!org) return;
      const { data } = await supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .eq("org_id", org.id)
        .order("first_name");
      setContacts(data ?? []);
    }
    load();
  }, [supabase, org]);

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

  // --- Save helpers ---

  async function logChange(field: string, oldValue: string | null, newValue: string | null) {
    if (!org) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("activities").insert({
      org_id: org.id,
      entity_type: "deal" as const,
      entity_id: dealId,
      activity_type: "deal_updated" as const,
      title: `Updated ${formatLabel(field)}`,
      description: null,
      metadata: { field, old_value: oldValue, new_value: newValue },
      created_by: user?.id ?? null,
    });
  }

  async function saveField(field: string, value: string | null) {
    if (!deal || !org) return;
    const oldValue = (deal as unknown as Record<string, unknown>)[field] as string | null;

    // If changing stage, check if new stage is won/lost and update status accordingly
    const updatePayload: Record<string, unknown> = { [field]: value };
    if (field === "stage_id" && value) {
      const newStage = stages.find((s) => s.id === value);
      if (newStage?.is_won) {
        updatePayload.status = "won";
        if (!deal.actual_close_date) {
          updatePayload.actual_close_date = new Date().toISOString().split("T")[0];
        }
      } else if (newStage?.is_lost) {
        updatePayload.status = "lost";
        if (!deal.actual_close_date) {
          updatePayload.actual_close_date = new Date().toISOString().split("T")[0];
        }
      }
    }

    const { error: updateError } = await supabase
      .from("deals")
      .update(updatePayload)
      .eq("id", deal.id);
    if (updateError) {
      toast.error("Failed to save", updateError.message);
      throw updateError;
    }

    // Auto-link deal to referrals when won
    if (field === "stage_id" && value) {
      const newStage = stages.find((s) => s.id === value);
      if (newStage?.is_won) {
        await linkWonDealToReferrals(supabase, deal.id, org.id);
      }
    }

    await logChange(field, oldValue, value);
    await refresh();
  }

  async function saveNumberField(field: string, value: string | null) {
    if (!deal) return;
    const oldRaw = (deal as unknown as Record<string, unknown>)[field];
    const oldValue = oldRaw != null ? String(oldRaw) : null;
    const numVal = value ? Number(value) : null;
    const { error: updateError } = await supabase
      .from("deals")
      .update({ [field]: numVal })
      .eq("id", deal.id);
    if (updateError) {
      toast.error("Failed to save", updateError.message);
      throw updateError;
    }
    await logChange(field, oldValue, value);
    await refresh();
  }

  // --- Tag helpers ---

  async function handleAddTag(tag: Tag) {
    if (!deal) return;
    await supabase.from("entity_tags").insert({
      tag_id: tag.id,
      entity_type: "deal",
      entity_id: deal.id,
    });
    await refresh();
  }

  async function handleRemoveTag(tagId: string) {
    if (!deal) return;
    await supabase
      .from("entity_tags")
      .delete()
      .eq("entity_type", "deal")
      .eq("entity_id", deal.id)
      .eq("tag_id", tagId);
    await refresh();
  }

  async function handleCreateTag(name: string) {
    if (!org) return;
    const { data, error: tagError } = await supabase
      .from("tags")
      .insert({ name, org_id: org.id, entity_type: "deal", color: "#2f5435" })
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

  async function handleDelete() {
    if (!deal) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", deal.id);

      if (error) throw error;
      toast.success("Deal deleted", "The deal has been removed from your pipeline.");
      router.push("/deals");
    } catch (err) {
      toast.error(
        "Failed to delete deal",
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
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Deal not found."}
        </p>
      </div>
    );
  }

  const contactOptions = contacts.map((c) => ({
    value: c.id,
    label: [c.first_name, c.last_name].filter(Boolean).join(" "),
  }));

  const stageOptions = stages.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const dealTypeOptions = DEAL_TYPES.map((t) => ({
    value: t,
    label: formatLabel(t),
  }));

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.symbol} ${c.name}`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
              {deal.name}
            </h2>
            {deal.stage && (
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${deal.stage.color}20`,
                  color: deal.stage.color,
                }}
              >
                {deal.stage.name}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-500 dark:text-primary-400">
            {deal.value != null && (
              <span className="flex items-center gap-1 font-semibold text-primary-800 dark:text-primary-100">
                <CurrencyDollarIcon className="h-4 w-4" />
                {formatCurrency(deal.value, deal.currency)}
              </span>
            )}
            {deal.contact && (
              <Link
                href={`/contacts/${deal.contact.id}`}
                className="flex items-center gap-1 hover:text-primary-600"
              >
                <UserIcon className="h-3.5 w-3.5" />
                {getFullName(
                  deal.contact.first_name,
                  deal.contact.last_name ?? undefined
                )}
              </Link>
            )}
            {deal.expected_close_date && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                Expected close: {formatDate(deal.expected_close_date)}
              </span>
            )}
          </div>
          {/* Inline tags */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {(deal.tags ?? []).map((tag) => (
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
                  selectedTags={deal.tags ?? []}
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
          {/* Deal Information */}
          <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.CurrencyDollarIcon}</span>
              Deal Information
            </h3>
            <dl className="space-y-1">
              <EditableField
                label="Name"
                value={deal.name}
                onSave={(v) => saveField("name", v || deal.name)}
                placeholder="Deal name"
              />
              <EditableField
                label="Value"
                value={deal.value != null ? String(deal.value) : null}
                onSave={(v) => saveNumberField("value", v)}
                placeholder="Deal value"
                formatDisplay={(v) => formatCurrency(Number(v), deal.currency)}
              />
              <EditableField
                label="Currency"
                value={deal.currency}
                onSave={(v) => saveField("currency", v || "USD")}
                type="select"
                options={currencyOptions}
              />
              <EditableField
                label="Deal Type"
                value={deal.deal_type}
                onSave={(v) => saveField("deal_type", v || "one_time")}
                type="select"
                options={dealTypeOptions}
              />
              <EditableField
                label="Pipeline Stage"
                value={deal.stage_id}
                onSave={(v) => saveField("stage_id", v)}
                type="select"
                options={stageOptions}
              />
            </dl>
          </div>

          {/* Relations & Dates */}
          <div className="space-y-6">
            <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.UsersIcon}</span>
                Relations
              </h3>
              <dl className="space-y-1">
                <EditableField
                  label="Contact"
                  value={deal.contact_id}
                  onSave={(v) => saveField("contact_id", v)}
                  type="select"
                  options={contactOptions}
                  placeholder="Select contact"
                />
              </dl>
              {deal.contact && (
                <div className="mt-3 space-y-1.5 border-t border-primary-100 pt-3 dark:border-primary-800">
                  {deal.contact.email && (
                    <div className="flex items-center gap-2 text-sm text-primary-500 dark:text-primary-400">
                      <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" />
                      <a href={`mailto:${deal.contact.email}`} className="hover:text-primary-700 dark:hover:text-primary-200">
                        {deal.contact.email}
                      </a>
                    </div>
                  )}
                  {deal.contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-primary-500 dark:text-primary-400">
                      <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
                      <a href={`tel:${deal.contact.phone}`} className="hover:text-primary-700 dark:hover:text-primary-200">
                        {formatPhone(deal.contact.phone)}
                      </a>
                      <span className="text-xs text-primary-300 dark:text-primary-600">Office</span>
                    </div>
                  )}
                  {deal.contact.mobile_phone && (
                    <div className="flex items-center gap-2 text-sm text-primary-500 dark:text-primary-400">
                      <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
                      <a href={`tel:${deal.contact.mobile_phone}`} className="hover:text-primary-700 dark:hover:text-primary-200">
                        {formatPhone(deal.contact.mobile_phone)}
                      </a>
                      <span className="text-xs text-primary-300 dark:text-primary-600">Mobile</span>
                    </div>
                  )}
                  {!deal.contact.email && !deal.contact.phone && !deal.contact.mobile_phone && (
                    <p className="text-xs text-primary-300 dark:text-primary-600">No contact details on file.</p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.CalendarIcon}</span>
                Dates
              </h3>
              <dl className="space-y-1">
                <EditableField
                  label="Expected Close"
                  value={deal.expected_close_date?.split("T")[0] ?? null}
                  onSave={(v) => saveField("expected_close_date", v)}
                  type="date"
                  placeholder="Set expected close date"
                  formatDisplay={(v) => formatDate(v)}
                />
                <EditableField
                  label="Actual Close"
                  value={deal.actual_close_date?.split("T")[0] ?? null}
                  onSave={(v) => saveField("actual_close_date", v)}
                  type="date"
                  placeholder="Set actual close date"
                  formatDisplay={(v) => formatDate(v)}
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
              value={deal.description}
              onSave={(v) => saveField("description", v)}
              type="textarea"
              placeholder="Click to add a description for this deal..."
            />
          </div>

          {/* Notes — always visible */}
          <div className="rounded-xl border border-primary-200 p-6 dark:border-primary-800 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tan-500">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{DUOTONE_ICONS.DocumentTextIcon}</span>
              Notes
            </h3>
            <EditableField
              label=""
              value={deal.notes}
              onSave={(v) => saveField("notes", v)}
              type="textarea"
              placeholder="Click to add notes about this deal..."
            />
          </div>

          {/* Meta */}
          <div className="text-xs text-primary-400 dark:text-primary-500 lg:col-span-2">
            Created {formatDate(deal.created_at)} &middot; Last updated{" "}
            {formatRelative(deal.updated_at)}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-0">
          {isLoadingActivities ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-900/30" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-primary-200 p-12 text-center dark:border-primary-700">
              <p className="text-sm text-primary-500 dark:text-primary-400">
                Changes to this deal will be logged here automatically.
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

                // Resolve display values for IDs
                const resolveValue = (f: string | undefined, v: string | null | undefined): string => {
                  if (v == null) return "empty";
                  if (f === "stage_id") {
                    const s = stages.find((st) => st.id === v);
                    return s ? s.name : v;
                  }
                  if (f === "contact_id") {
                    const c = contacts.find((ct) => ct.id === v);
                    return c ? [c.first_name, c.last_name].filter(Boolean).join(" ") : v;
                  }
                  if (f === "value") {
                    return formatCurrency(Number(v), deal.currency);
                  }
                  if (f === "deal_type") {
                    return formatLabel(v);
                  }
                  if (f === "currency") {
                    const cur = CURRENCIES.find((c) => c.code === v);
                    return cur ? `${cur.symbol} ${cur.name}` : v;
                  }
                  if (f === "expected_close_date" || f === "actual_close_date") {
                    return formatDate(v);
                  }
                  // Truncate long text values
                  if (v.length > 60) return v.slice(0, 60) + "...";
                  return v;
                };

                const hasChange = field && (oldVal !== undefined || newVal !== undefined);

                return (
                  <div key={activity.id} className="relative flex items-start gap-4 py-3">
                    {/* Icon */}
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-primary-950">
                      <div className="flex h-5 w-5 items-center justify-center">
                        {DUOTONE_ICONS.ArrowsRightLeftIcon}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium text-primary-800 dark:text-primary-100">
                        {activity.title}
                      </p>
                      {hasChange && (
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

      <Dialog open={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} size="sm">
        <DialogTitle>Remove this deal?</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {deal.name}
          </span>{" "}
          from your pipeline? This action cannot be undone.
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
