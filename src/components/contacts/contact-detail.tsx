"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useContact } from "@/lib/hooks/use-contacts";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils/cn";
import { getFullName, getInitials, formatDate, formatRelative } from "@/lib/utils/format";
import { Skeleton } from "@/components/shared/loading-skeleton";
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
} from "@heroicons/react/24/outline";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { SendReferralModal } from "@/components/referrals/send-referral-modal";

type TabKey = "overview" | "referrals" | "deals" | "activity" | "documents";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "referrals", label: "Referrals" },
  { key: "deals", label: "Deals" },
  { key: "activity", label: "Activity" },
  { key: "documents", label: "Documents" },
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
  const toast = useToast();
  const { contact, isLoading, error } = useContact(contactId);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const { canExchangeReferrals } = usePlanLimits();

  async function handleDelete() {
    if (!contact) return;
    if (!window.confirm("Are you sure you want to delete this contact? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contact.id);

      if (error) throw error;
      toast.success("Contact deleted", "The contact has been removed.");
      router.push("/contacts");
    } catch (err) {
      toast.error(
        "Failed to delete contact",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsDeleting(false);
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
            onClick={handleDelete}
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

          {/* Scores & Meta */}
          <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Scores & Metrics
            </h3>
            <dl className="space-y-3">
              <DetailRow
                label="Referral Score"
                value={String(contact.referral_score)}
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
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Referral connections and chains will appear here.
          </p>
        </div>
      )}

      {activeTab === "deals" && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Associated deals will appear here.
          </p>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Activity timeline will appear here.
          </p>
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
    </div>
  );
}

function DetailRow({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value?: string | null;
  isLink?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
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
