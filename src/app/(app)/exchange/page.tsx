"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import {
  useReferralExchange,
  useExchangeActions,
} from "@/lib/hooks/use-referral-exchange";
import { useTrustScore } from "@/lib/hooks/use-trust-score";
import { useToast } from "@/components/providers/toast-provider";
import { SendReferralModal } from "@/components/referrals/send-referral-modal";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatPhone } from "@/lib/utils/format";
import type { ReferralExchange, SenderMetadata } from "@/types/database";
import {
  InboxIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

type TabKey = "inbox" | "outbox" | "drafts";

const statusColors: Record<string, string> = {
  draft:
    "bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-400",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  expired:
    "bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-400",
  undeliverable:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const statusIcons: Record<string, typeof ClockIcon> = {
  draft: DocumentTextIcon,
  pending: ClockIcon,
  accepted: CheckCircleIcon,
  declined: XCircleIcon,
  expired: ClockIcon,
  undeliverable: ExclamationTriangleIcon,
};

const receiverStatusColors: Record<string, string> = {
  none: "bg-primary-100 text-primary-500 dark:bg-primary-800 dark:text-primary-400",
  in_progress:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  converted:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  lost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const receiverStatusLabels: Record<string, string> = {
  none: "No update",
  in_progress: "In Progress",
  converted: "Converted",
  lost: "Lost",
};

const interestLevelLabels: Record<string, string> = {
  just_curious: "Just Curious",
  exploring_options: "Exploring Options",
  actively_looking: "Actively Looking",
  ready_soon: "Ready Soon",
  ready_now: "Ready Now",
};

const contactApproachLabels: Record<string, string> = {
  they_will_contact: "They'll Reach Out",
  please_reach_out: "Please Reach Out",
  intro_already_made: "Intro Already Made",
  timing_tbd: "Timing TBD",
};


function TrustBadge({ userId }: { userId: string }) {
  const { score } = useTrustScore(userId);

  if (!score || score.trust_rating === 0) return null;

  const rating = Math.round(score.trust_rating);
  const color =
    rating >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : rating >= 40
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-primary-400";

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-xs font-medium", color)}
      title={`Trust rating: ${rating}/100 (${score.total_sent + score.total_received} exchanges)`}
    >
      <ShieldCheckIcon className="h-3.5 w-3.5" />
      {rating}
    </span>
  );
}

export default function ReferralExchangePage() {
  const { canExchangeReferrals, isFreePlan } = usePlanLimits();
  const [activeTab, setActiveTab] = useState<TabKey>("inbox");
  const [showSendModal, setShowSendModal] = useState(false);
  const [editingDraft, setEditingDraft] = useState<ReferralExchange | null>(null);

  if (!canExchangeReferrals) {
    return (
      <div>
        <div className="mx-auto max-w-lg py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <ArrowTopRightOnSquareIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-primary-800 dark:text-white">
            Referral Exchange
          </h1>
          <p className="mt-2 text-primary-500 dark:text-primary-400">
            Send and receive referrals across networks. Share contacts with
            other professionals to expand your reach.
          </p>
          <p className="mt-4 text-sm text-primary-500 dark:text-primary-400">
            {isFreePlan
              ? "Upgrade to a Pro or Team plan to unlock inter-network referral exchange."
              : "This feature is available on paid plans."}
          </p>
          <Link
            href="/settings/billing"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-800 dark:text-white">
            Referral Exchange
          </h1>
          <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
            Send and receive referrals across networks to grow your business
            together.
          </p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          Send Referral
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-primary-200 dark:border-primary-800">
        <nav className="-mb-px flex gap-6">
          {(
            [
              { key: "inbox" as const, label: "Inbox", icon: InboxIcon },
              {
                key: "outbox" as const,
                label: "Sent",
                icon: PaperAirplaneIcon,
              },
              {
                key: "drafts" as const,
                label: "Drafts",
                icon: DocumentTextIcon,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "border-transparent text-primary-500 hover:border-primary-300 hover:text-primary-700 dark:text-primary-400 dark:hover:border-primary-600 dark:hover:text-primary-200"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "inbox" && <InboxTab />}
      {activeTab === "outbox" && <OutboxTab />}
      {activeTab === "drafts" && (
        <DraftsTab onEditDraft={(d) => setEditingDraft(d)} />
      )}

      {showSendModal && (
        <SendReferralModal
          onClose={() => setShowSendModal(false)}
          onSuccess={() => setShowSendModal(false)}
        />
      )}

      {editingDraft && (
        <SendReferralModal
          draft={editingDraft}
          onClose={() => setEditingDraft(null)}
          onSuccess={() => setEditingDraft(null)}
        />
      )}
    </div>
  );
}

function InboxTab() {
  const toast = useToast();
  const { exchanges, isLoading, refresh } = useReferralExchange({
    direction: "received",
  });
  const { acceptExchange, declineExchange, isSubmitting } =
    useExchangeActions();

  async function handleAccept(exchange: ReferralExchange) {
    try {
      const result = await acceptExchange(exchange.id);
      toast.success(
        "Referral accepted",
        "The referral has been accepted and the contact imported into your network."
      );
      if (result.contact_id) {
        refresh();
      }
    } catch (err) {
      toast.error(
        "Failed to accept",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  async function handleDecline(exchange: ReferralExchange) {
    if (
      !window.confirm(
        "Are you sure you want to decline this referral? The sender will be notified."
      )
    )
      return;

    try {
      await declineExchange(exchange.id);
      toast.success("Referral declined", "The sender has been notified.");
      refresh();
    } catch (err) {
      toast.error(
        "Failed to decline",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-700 dark:bg-primary-800"
          />
        ))}
      </div>
    );
  }

  if (exchanges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary-300 p-12 text-center dark:border-primary-700">
        <InboxIcon className="mx-auto h-10 w-10 text-primary-400" />
        <p className="mt-2 text-sm text-primary-500 dark:text-primary-400">
          No referrals received yet. When someone sends you a referral, it will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {exchanges.map((exchange) => (
        <ExchangeCard
          key={exchange.id}
          exchange={exchange}
          direction="received"
          onAccept={() => handleAccept(exchange)}
          onDecline={() => handleDecline(exchange)}
          onStatusUpdate={refresh}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
}

function OutboxTab() {
  const { exchanges, isLoading } = useReferralExchange({
    direction: "sent",
  });

  // Filter out drafts from outbox (they have their own tab)
  const sentExchanges = exchanges.filter((e) => e.status !== "draft");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-700 dark:bg-primary-800"
          />
        ))}
      </div>
    );
  }

  if (sentExchanges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary-300 p-12 text-center dark:border-primary-700">
        <PaperAirplaneIcon className="mx-auto h-10 w-10 text-primary-400" />
        <p className="mt-2 text-sm text-primary-500 dark:text-primary-400">
          No referrals sent yet. Click &ldquo;Send Referral&rdquo; above to
          share a contact with another network.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sentExchanges.map((exchange) => (
        <ExchangeCard
          key={exchange.id}
          exchange={exchange}
          direction="sent"
        />
      ))}
    </div>
  );
}

function DraftsTab({
  onEditDraft,
}: {
  onEditDraft: (draft: ReferralExchange) => void;
}) {
  const toast = useToast();
  const { exchanges, isLoading, refresh } = useReferralExchange({
    direction: "sent",
    status: "draft",
  });

  async function handleDelete(exchange: ReferralExchange) {
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/exchange/${exchange.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete draft");
      }
      toast.success("Draft deleted", "The draft has been removed.");
      refresh();
    } catch (err) {
      toast.error(
        "Failed to delete",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-700 dark:bg-primary-800"
          />
        ))}
      </div>
    );
  }

  if (exchanges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary-300 p-12 text-center dark:border-primary-700">
        <DocumentTextIcon className="mx-auto h-10 w-10 text-primary-400" />
        <p className="mt-2 text-sm text-primary-500 dark:text-primary-400">
          No drafts yet. Save a referral as a draft to finish it later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exchanges.map((exchange) => {
        const snapshot = exchange.contact_snapshot;
        const contactName = [snapshot.first_name, snapshot.last_name]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={exchange.id}
            className="flex items-center justify-between rounded-xl border border-primary-200 bg-white px-4 py-3 shadow-sm dark:border-primary-700 dark:bg-primary-900/50"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <UserIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <span className="text-sm font-semibold text-primary-800 dark:text-white">
                  {contactName}
                </span>
                <div className="flex items-center gap-2 text-xs text-primary-500 dark:text-primary-400">
                  {exchange.receiver_email ? (
                    <span>To: {exchange.receiver_email}</span>
                  ) : (
                    <span className="italic">No recipient yet</span>
                  )}
                  <span>&middot;</span>
                  <span>Edited {formatDate(exchange.updated_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditDraft(exchange)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700"
              >
                <PencilSquareIcon className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(exchange)}
                className="inline-flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReceiverStatusPanel({
  exchange,
  onUpdate,
}: {
  exchange: ReferralExchange;
  onUpdate: () => void;
}) {
  const toast = useToast();
  const { updateReceiverStatus, isSubmitting } = useExchangeActions();
  const [status, setStatus] = useState(exchange.receiver_status);
  const [visible, setVisible] = useState(exchange.receiver_status_visible);

  async function handleSave() {
    try {
      await updateReceiverStatus(exchange.id, status, visible);
      toast.success(
        "Status updated",
        visible
          ? "The sender can now see how this referral is progressing."
          : "Your update has been saved privately."
      );
      onUpdate();
    } catch (err) {
      toast.error(
        "Failed to update",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  const statusDescriptions: Record<string, string> = {
    none: "No status to report yet",
    in_progress: "Actively working this referral",
    converted: "Successfully closed or converted",
    lost: "Did not convert",
  };

  return (
    <div className="mt-2 space-y-1.5 pl-10">
      <span className="text-[11px] font-medium text-primary-500 dark:text-primary-400">
        How is this referral progressing?
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {(["none", "in_progress", "converted", "lost"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            title={statusDescriptions[s]}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              status === s
                ? receiverStatusColors[s]
                : "bg-primary-50 text-primary-500 hover:bg-primary-100 dark:bg-primary-800 dark:text-primary-400 dark:hover:bg-primary-700"
            )}
          >
            {receiverStatusLabels[s]}
          </button>
        ))}
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="ml-1 shrink-0 rounded-lg bg-primary-600 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
        <label
          className="ml-1 flex items-center gap-1 text-[11px] text-primary-500 dark:text-primary-400"
          title={visible ? "The sender can see your status update" : "Your status update is private — only you can see it"}
        >
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-3 w-3 rounded border-primary-300 text-primary-600 focus:ring-primary-500 dark:border-primary-600 dark:bg-primary-800"
          />
          {visible ? (
            <>
              <EyeIcon className="h-3 w-3" />
              <span>Visible to sender</span>
            </>
          ) : (
            <>
              <EyeSlashIcon className="h-3 w-3" />
              <span>Private</span>
            </>
          )}
        </label>
      </div>
      {status !== exchange.receiver_status && (
        <p className="text-[11px] text-primary-400 dark:text-primary-500">
          {statusDescriptions[status]}
        </p>
      )}
    </div>
  );
}

function ExchangeCard({
  exchange,
  direction,
  onAccept,
  onDecline,
  onStatusUpdate,
  isSubmitting,
}: {
  exchange: ReferralExchange;
  direction: "sent" | "received";
  onAccept?: () => void;
  onDecline?: () => void;
  onStatusUpdate?: () => void;
  isSubmitting?: boolean;
}) {
  const snapshot = exchange.contact_snapshot;
  const contactName = [snapshot.first_name, snapshot.last_name]
    .filter(Boolean)
    .join(" ");

  const StatusIcon = statusIcons[exchange.status] || ClockIcon;

  // Show trust badge for the other party
  const trustUserId =
    direction === "received"
      ? exchange.sender_user_id
      : exchange.receiver_user_id;

  const metadata = exchange.sender_metadata as SenderMetadata | undefined;

  return (
    <div className="rounded-xl border border-primary-200 bg-white px-4 py-3 shadow-sm dark:border-primary-700 dark:bg-primary-900/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Contact name + details row */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <UserIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {exchange.imported_contact_id ? (
                  <Link
                    href={`/contacts/${exchange.imported_contact_id}`}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {contactName}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-primary-800 dark:text-white">
                    {contactName}
                  </span>
                )}
                {snapshot.company_name && (
                  <span className="hidden text-xs text-primary-400 sm:inline dark:text-primary-500">
                    at {snapshot.company_name}
                  </span>
                )}
              </div>
              {/* Contact details */}
              {(snapshot.email || snapshot.phone) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-primary-500 dark:text-primary-400">
                  {snapshot.email && (
                    <span className="inline-flex items-center gap-0.5">
                      <EnvelopeIcon className="h-3 w-3" />
                      {snapshot.email}
                    </span>
                  )}
                  {snapshot.phone && (
                    <span className="inline-flex items-center gap-0.5">
                      <PhoneIcon className="h-3 w-3" />
                      {formatPhone(snapshot.phone)}
                    </span>
                  )}
                </div>
              )}
              {/* Referrer info */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-primary-500 dark:text-primary-400">
                {direction === "received" ? (
                  <>
                    <span>
                      From{" "}
                      <span className="font-medium text-primary-700 dark:text-primary-300">
                        {exchange.sender_profile?.full_name || "Unknown"}
                      </span>
                      {exchange.sender_org && (
                        <> at {exchange.sender_org.name}</>
                      )}
                    </span>
                    {trustUserId && <TrustBadge userId={trustUserId} />}
                  </>
                ) : (
                  <>
                    <span>
                      To{" "}
                      <span className="font-medium text-primary-700 dark:text-primary-300">
                        {exchange.receiver_email}
                      </span>
                    </span>
                    {trustUserId && <TrustBadge userId={trustUserId} />}
                  </>
                )}
                <span>{formatDate(exchange.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Badges row */}
          {(exchange.interest_level || exchange.contact_approach) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-10">
              {exchange.interest_level && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {interestLevelLabels[exchange.interest_level] || exchange.interest_level}
                </span>
              )}
              {exchange.contact_approach && (
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {contactApproachLabels[exchange.contact_approach] || exchange.contact_approach}
                </span>
              )}
            </div>
          )}

          {/* Context note */}
          {exchange.context_note && (
            <p className="mt-1 pl-10 text-xs italic text-primary-600 dark:text-primary-400">
              &ldquo;{exchange.context_note}&rdquo;
            </p>
          )}

          {/* Sender metadata */}
          {direction === "sent" && metadata && (metadata.how_you_know || metadata.timeline_urgency) && (
            <div className="mt-1 flex flex-wrap gap-3 pl-10 text-[11px] text-primary-400 dark:text-primary-500">
              {metadata.how_you_know && <span>Relationship: {metadata.how_you_know}</span>}
              {metadata.timeline_urgency && <span>Timeline: {metadata.timeline_urgency}</span>}
            </div>
          )}
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            statusColors[exchange.status]
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
        </span>
      </div>

      {/* Actions for pending inbox items */}
      {direction === "received" && exchange.status === "pending" && (
        <div className="mt-2 flex items-center gap-2 pl-10">
          <button
            onClick={onAccept}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircleIcon className="h-3.5 w-3.5" />
            Accept & Import
          </button>
          <button
            onClick={onDecline}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
          >
            <XCircleIcon className="h-3.5 w-3.5" />
            Decline
          </button>
        </div>
      )}

      {/* Receiver status panel (inbox, accepted) */}
      {direction === "received" &&
        exchange.status === "accepted" &&
        exchange.imported_contact_id && (
          <ReceiverStatusPanel
            exchange={exchange}
            onUpdate={onStatusUpdate || (() => {})}
          />
        )}

      {/* Accepted info (outbox) */}
      {direction === "sent" && exchange.status === "accepted" && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-10">
          <span className="text-[11px] text-primary-400 dark:text-primary-500">
            Accepted {exchange.accepted_at ? formatDate(exchange.accepted_at) : ""}
          </span>
          {exchange.receiver_status_visible &&
          exchange.receiver_status !== "none" ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                receiverStatusColors[exchange.receiver_status]
              )}
            >
              {exchange.receiver_status === "converted" && (
                <StarIcon className="h-3 w-3" />
              )}
              {receiverStatusLabels[exchange.receiver_status]}
            </span>
          ) : (
            <span className="text-[11px] italic text-primary-400 dark:text-primary-500">
              Awaiting update...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
