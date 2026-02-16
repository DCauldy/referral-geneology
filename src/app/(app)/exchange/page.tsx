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
import { formatDate } from "@/lib/utils/format";
import type { ReferralExchange } from "@/types/database";
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
  ShieldCheckIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

type TabKey = "inbox" | "outbox";

const statusColors: Record<string, string> = {
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

      {activeTab === "inbox" ? <InboxTab /> : <OutboxTab />}

      {showSendModal && (
        <SendReferralModal
          onClose={() => setShowSendModal(false)}
          onSuccess={() => setShowSendModal(false)}
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
        // Refresh to update the list
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
        <PaperAirplaneIcon className="mx-auto h-10 w-10 text-primary-400" />
        <p className="mt-2 text-sm text-primary-500 dark:text-primary-400">
          No referrals sent yet. Click &ldquo;Send Referral&rdquo; above to share a vine
          with another network.
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
          direction="sent"
        />
      ))}
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

  return (
    <div className="mt-4 space-y-3 border-t border-primary-100 pt-4 dark:border-primary-800">
      <div className="flex items-center gap-2">
        <ArrowPathIcon className="h-4 w-4 text-primary-400" />
        <span className="text-xs font-medium text-primary-600 dark:text-primary-300">
          Share your status update with the sender
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["none", "in_progress", "converted", "lost"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              status === s
                ? receiverStatusColors[s]
                : "bg-primary-50 text-primary-500 hover:bg-primary-100 dark:bg-primary-800 dark:text-primary-400 dark:hover:bg-primary-700"
            )}
          >
            {receiverStatusLabels[s]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-primary-500 dark:text-primary-400">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-primary-300 text-primary-600 focus:ring-primary-500 dark:border-primary-600 dark:bg-primary-800"
          />
          {visible ? (
            <span className="inline-flex items-center gap-1">
              <EyeIcon className="h-3 w-3" /> Visible to sender
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <EyeSlashIcon className="h-3 w-3" /> Private
            </span>
          )}
        </label>
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Update"}
        </button>
      </div>
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

  return (
    <div className="rounded-xl border border-primary-200 bg-white p-5 shadow-sm dark:border-primary-700 dark:bg-primary-900/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Sender/receiver info */}
          <div className="mb-3 flex items-center gap-2 text-xs text-primary-500 dark:text-primary-400">
            {direction === "received" ? (
              <>
                <span>From</span>
                <span className="font-medium text-primary-700 dark:text-primary-300">
                  {exchange.sender_profile?.full_name || "Unknown"}
                </span>
                {exchange.sender_org && (
                  <>
                    <span>at</span>
                    <span className="font-medium text-primary-700 dark:text-primary-300">
                      {exchange.sender_org.name}
                    </span>
                  </>
                )}
                {trustUserId && <TrustBadge userId={trustUserId} />}
              </>
            ) : (
              <>
                <span>To</span>
                <span className="font-medium text-primary-700 dark:text-primary-300">
                  {exchange.receiver_email}
                </span>
                {trustUserId && <TrustBadge userId={trustUserId} />}
              </>
            )}
            <span>&middot;</span>
            <span>{formatDate(exchange.created_at)}</span>
          </div>

          {/* Contact snapshot */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-primary-800 dark:text-white">
                {contactName}
              </p>
              <div className="flex items-center gap-3 text-sm text-primary-500 dark:text-primary-400">
                {snapshot.company_name && (
                  <span className="inline-flex items-center gap-1">
                    <BuildingOfficeIcon className="h-3.5 w-3.5" />
                    {snapshot.company_name}
                  </span>
                )}
                {snapshot.email && <span>{snapshot.email}</span>}
              </div>
            </div>
          </div>

          {/* Context note */}
          {exchange.context_note && (
            <p className="mt-3 text-sm italic text-primary-600 dark:text-primary-400">
              &ldquo;{exchange.context_note}&rdquo;
            </p>
          )}
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            statusColors[exchange.status]
          )}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
        </span>
      </div>

      {/* Actions for pending inbox items */}
      {direction === "received" && exchange.status === "pending" && (
        <div className="mt-4 flex items-center gap-3 border-t border-primary-100 pt-4 dark:border-primary-800">
          <button
            onClick={onAccept}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Accept & Import
          </button>
          <button
            onClick={onDecline}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
          >
            <XCircleIcon className="h-4 w-4" />
            Decline
          </button>
        </div>
      )}

      {/* Show imported contact link + receiver status panel (inbox, accepted) */}
      {direction === "received" &&
        exchange.status === "accepted" &&
        exchange.imported_contact_id && (
          <>
            <div className="mt-4 border-t border-primary-100 pt-4 dark:border-primary-800">
              <Link
                href={`/contacts/${exchange.imported_contact_id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                View imported contact
              </Link>
            </div>
            <ReceiverStatusPanel
              exchange={exchange}
              onUpdate={onStatusUpdate || (() => {})}
            />
          </>
        )}

      {/* Show imported contact link (outbox, accepted) */}
      {direction === "sent" &&
        exchange.status === "accepted" &&
        exchange.imported_contact_id && (
          <div className="mt-4 border-t border-primary-100 pt-4 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary-500 dark:text-primary-400">
                Accepted on {exchange.accepted_at ? formatDate(exchange.accepted_at) : "N/A"}
              </span>
            </div>
          </div>
        )}

      {/* Enhanced receiver status feedback (for sent items) */}
      {direction === "sent" && exchange.status === "accepted" && (
        <div className="mt-3 border-t border-primary-100 pt-3 dark:border-primary-800">
          {exchange.receiver_status_visible &&
          exchange.receiver_status !== "none" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary-500 dark:text-primary-400">
                Status update:
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  receiverStatusColors[exchange.receiver_status]
                )}
              >
                {exchange.receiver_status === "converted" && (
                  <StarIcon className="h-3 w-3" />
                )}
                {receiverStatusLabels[exchange.receiver_status]}
              </span>
            </div>
          ) : (
            <p className="text-xs text-primary-400 dark:text-primary-500">
              Awaiting status update from receiver...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
