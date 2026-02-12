"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useContact } from "@/lib/hooks/use-contacts";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils/cn";
import { getFullName, getInitials, formatDate, formatRelative } from "@/lib/utils/format";
import { Skeleton } from "@/components/shared/loading-skeleton";
import type { ContactChild, ImportantDate, ContactFavorites, Activity, ActivityType } from "@/types/database";
import { DUOTONE_ICONS } from "@/components/shared/duotone-icons";
import {
  PencilSquareIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  MapPinIcon,
  StarIcon,
  PaperAirplaneIcon,
  CakeIcon,
  HeartIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
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

export function ContactDetail({ contactId }: ContactDetailProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const { contact, isLoading, error } = useContact(contactId);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);
  const { canExchangeReferrals } = usePlanLimits();

  // Activity tab state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("note");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

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

      toast.success("Growth logged", "A new entry has been recorded for this vine.");
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
      toast.success("Vine pruned", "The contact has been removed from your trellis.");
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

  const address = [
    contact.address_line1,
    contact.address_line2,
    [contact.city, contact.state_province].filter(Boolean).join(", "),
    contact.postal_code,
    contact.country,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
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
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {fullName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
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
                  {contact.phone}
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
          <Link
            href={`/contacts/${contact.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </Link>
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
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
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
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
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
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-1">
                {activities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      {activityIcons[activity.activity_type] || fallbackIcon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-900 dark:text-white">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="truncate text-xs text-zinc-400">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {formatRelative(activity.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Contact Information
            </h3>
            <dl className="space-y-3">
              <DetailRow label="Full Name" value={fullName} />
              <DetailRow label="Email" value={contact.email} />
              <DetailRow label="Phone" value={contact.phone} />
              <DetailRow label="Mobile" value={contact.mobile_phone} />
              <DetailRow label="Job Title" value={contact.job_title} />
              <DetailRow label="Company" value={contact.company?.name} />
              <DetailRow label="Industry" value={contact.industry} />
              <DetailRow
                label="Relationship"
                value={formatLabel(contact.relationship_type)}
              />
            </dl>
          </div>

          {/* Address & Social */}
          <div className="space-y-6">
            {address && (
              <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Address
                </h3>
                <div className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <span className="whitespace-pre-line">{address}</span>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Social & Web
              </h3>
              <dl className="space-y-3">
                <DetailRow label="LinkedIn" value={contact.linkedin_url} isLink />
                <DetailRow label="Twitter" value={contact.twitter_url} isLink />
                <DetailRow label="Facebook" value={contact.facebook_url} isLink />
                <DetailRow label="Website" value={contact.website_url} isLink />
              </dl>
            </div>
          </div>

          {/* Personal Details — only render when at least one field has data */}
          {(contact.birthday || contact.anniversary || contact.spouse_partner_name || (contact.preferred_contact_method && contact.preferred_contact_method !== "email")) && (
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Personal Details
              </h3>
              <dl className="space-y-3">
                <DetailRow
                  label="Birthday"
                  value={contact.birthday ? formatDate(contact.birthday) : null}
                />
                <DetailRow
                  label="Anniversary"
                  value={contact.anniversary ? formatDate(contact.anniversary) : null}
                />
                <DetailRow
                  label="Spouse / Partner"
                  value={contact.spouse_partner_name}
                />
                {contact.preferred_contact_method && contact.preferred_contact_method !== "email" && (
                  <DetailRow
                    label="Preferred Contact"
                    value={formatLabel(contact.preferred_contact_method)}
                  />
                )}
              </dl>
            </div>
          )}

          {/* Interests & Family — only render when custom_fields has relevant data */}
          {(() => {
            const cf = contact.custom_fields;
            const obj = (cf && typeof cf === "object" && !Array.isArray(cf) ? cf : {}) as Record<string, unknown>;
            const cfChildren = (Array.isArray(obj.children) ? obj.children : []) as ContactChild[];
            const cfHobbies = (Array.isArray(obj.hobbies) ? obj.hobbies : []) as string[];
            const cfDates = (Array.isArray(obj.important_dates) ? obj.important_dates : []) as ImportantDate[];
            const cfFavorites = (obj.favorites && typeof obj.favorites === "object" ? obj.favorites : {}) as ContactFavorites;
            const hasFavorites = Object.values(cfFavorites).some(Boolean);
            const hasData = cfChildren.length > 0 || cfHobbies.length > 0 || cfDates.length > 0 || hasFavorites;

            if (!hasData) return null;

            return (
              <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Interests & Family
                </h3>
                <div className="space-y-4">
                  {cfChildren.length > 0 && (
                    <div>
                      <dt className="mb-1.5 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                        <UserGroupIcon className="h-4 w-4" />
                        Children
                      </dt>
                      <dd className="space-y-1">
                        {cfChildren.map((child, i) => (
                          <div key={i} className="text-sm text-zinc-900 dark:text-white">
                            {child.name}
                            {child.birthday && (
                              <span className="ml-1.5 text-xs text-zinc-400">
                                ({formatDate(child.birthday)})
                              </span>
                            )}
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}

                  {cfHobbies.length > 0 && (
                    <div>
                      <dt className="mb-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                        Hobbies / Interests
                      </dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {cfHobbies.map((hobby, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                          >
                            {hobby}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}

                  {cfDates.length > 0 && (
                    <div>
                      <dt className="mb-1.5 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                        <CakeIcon className="h-4 w-4" />
                        Important Dates
                      </dt>
                      <dd className="space-y-1">
                        {cfDates.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500 dark:text-zinc-400">{d.label}</span>
                            <span className="font-medium text-zinc-900 dark:text-white">
                              {formatDate(d.date)}
                            </span>
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}

                  {hasFavorites && (
                    <div>
                      <dt className="mb-1.5 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                        <HeartIcon className="h-4 w-4" />
                        Favorites
                      </dt>
                      <dd className="space-y-1">
                        {cfFavorites.restaurant && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500 dark:text-zinc-400">Restaurant</span>
                            <span className="font-medium text-zinc-900 dark:text-white">{cfFavorites.restaurant}</span>
                          </div>
                        )}
                        {cfFavorites.sports_team && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500 dark:text-zinc-400">Sports Team</span>
                            <span className="font-medium text-zinc-900 dark:text-white">{cfFavorites.sports_team}</span>
                          </div>
                        )}
                        {cfFavorites.other && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500 dark:text-zinc-400">Other</span>
                            <span className="font-medium text-zinc-900 dark:text-white">{cfFavorites.other}</span>
                          </div>
                        )}
                      </dd>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Scores & Meta */}
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Scores & Metrics
            </h3>
            <dl className="space-y-3">
              <DetailRow
                label="Generation"
                value={contact.generation != null ? `Gen ${contact.generation}` : null}
              />
              <DetailRow
                label="Referral Score"
                value={String(contact.referral_score)}
                tooltip="1 point per referral + 2 bonus points for each converted referral"
              />
              <DetailRow
                label="Lifetime Referral Value"
                value={`$${contact.lifetime_referral_value.toLocaleString()}`}
              />
              <div className="flex items-center justify-between py-1">
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  Rating
                </dt>
                <dd className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= (contact.rating ?? 0)
                          ? "fill-primary-400 text-primary-400"
                          : "text-zinc-300 dark:text-zinc-600"
                      )}
                    />
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Notes
              </h3>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {contact.notes}
              </p>
            </div>
          )}

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-zinc-400 dark:text-zinc-500 lg:col-span-2">
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
              className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">
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
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
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
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                />
                {/* Description */}
                <textarea
                  placeholder="Description (optional)"
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
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
                <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Notes, calls, and meetings for this contact will appear here.
              </p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-zinc-200 dark:bg-zinc-700" />

              {activities.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-4 py-3">
                  {/* Icon */}
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-900">
                    <div className="flex h-5 w-5 items-center justify-center">
                      {activityIcons[activity.activity_type] || fallbackIcon}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {activity.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                      {formatRelative(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
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

      <Dialog open={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} size="sm">
        <DialogTitle>Prune this contact?</DialogTitle>
        <DialogDescription>
          Are you sure you want to prune{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {contact ? getFullName(contact.first_name, contact.last_name ?? undefined) : "this contact"}
          </span>{" "}
          from your trellis? This action cannot be undone.
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

function DetailRow({
  label,
  value,
  isLink = false,
  tooltip,
}: {
  label: string;
  value?: string | null;
  isLink?: boolean;
  tooltip?: string;
}) {
  const [showTip, setShowTip] = useState(false);

  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="relative">
            <button
              type="button"
              onClick={() => setShowTip((v) => !v)}
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
              className="inline-flex cursor-help translate-y-px"
              aria-label={`Info: ${label}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" fill="#e0e9df" stroke="#284a2e" strokeWidth="1.8" />
                <line x1="12" y1="11" x2="12" y2="17" stroke="#2f5435" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="7.5" r="1.2" fill="#2f5435" />
              </svg>
            </button>
            {showTip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-56 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {tooltip}
              </div>
            )}
          </span>
        )}
      </dt>
      <dd className="text-sm font-medium text-zinc-900 dark:text-white">
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-500 hover:underline"
          >
            {value.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
