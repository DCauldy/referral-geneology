"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { formatRelative, getInitials } from "@/lib/utils/format";
import { useExchangeMessages } from "@/lib/hooks/use-referral-exchange";
import { useSupabase } from "@/components/providers/supabase-provider";
import {
  PaperAirplaneIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { useExchangeActions } from "@/lib/hooks/use-referral-exchange";
import { useToast } from "@/components/providers/toast-provider";
import type { ReferralExchange, ReceiverStatus } from "@/types/database";

interface ExchangeThreadProps {
  exchange: ReferralExchange;
  contactId: string;
}

const RECEIVER_STATUS_COLORS: Record<string, string> = {
  none: "bg-primary-100 text-primary-500 dark:bg-primary-800 dark:text-primary-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  converted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  lost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const RECEIVER_STATUS_LABELS: Record<string, string> = {
  none: "No update",
  in_progress: "In Progress",
  converted: "Converted",
  lost: "Lost",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  declined: { label: "Declined", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  expired: { label: "Expired", color: "bg-primary-100 text-primary-500 dark:bg-primary-900/30 dark:text-primary-400" },
};

export function ExchangeThread({ exchange }: ExchangeThreadProps) {
  const supabase = useSupabase();
  const toast = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [senderName, setSenderName] = useState<string>(exchange.sender_profile?.full_name || "");
  const { messages, isLoading, sendMessage } = useExchangeMessages(exchange.id);
  const { updateReceiverStatus, isSubmitting: isUpdatingStatus } = useExchangeActions();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Receiver status state
  const [receiverStatus, setReceiverStatus] = useState<ReceiverStatus>(exchange.receiver_status);
  const [statusVisible, setStatusVisible] = useState(exchange.receiver_status_visible);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, [supabase]);

  // Fetch sender name if not available from join
  useEffect(() => {
    if (senderName || !exchange.sender_user_id) return;
    supabase
      .from("user_profiles")
      .select("full_name")
      .eq("id", exchange.sender_user_id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setSenderName(data.full_name);
      });
  }, [supabase, exchange.sender_user_id, senderName]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isSender = currentUserId === exchange.sender_user_id;
  const statusInfo = STATUS_LABELS[exchange.status] ?? STATUS_LABELS.pending;
  const displaySenderName = senderName || "Sender";
  const snapshot = exchange.contact_snapshot;
  const contactName = [snapshot.first_name, snapshot.last_name].filter(Boolean).join(" ");

  async function handleSend() {
    if (!draft.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(draft.trim());
      setDraft("");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSaveStatus() {
    try {
      await updateReceiverStatus(exchange.id, receiverStatus, statusVisible);
      toast.success(
        "Status updated",
        statusVisible
          ? "The sender can now see how this referral is progressing."
          : "Your update has been saved privately."
      );
    } catch (err) {
      toast.error(
        "Failed to update",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  const isReceiver = currentUserId === exchange.receiver_user_id;

  return (
    <div className="space-y-4">
      {/* Exchange context header */}
      <div className="rounded-xl border border-primary-200 p-5 dark:border-primary-800">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-primary-600 dark:text-primary-300">
              {isSender ? (
                <>You sent <span className="font-medium">{contactName}</span> to {exchange.receiver_email || "a recipient"}</>
              ) : (
                <><span className="font-medium">{displaySenderName}</span> sent you <span className="font-medium">{contactName}</span></>
              )}
            </p>
            {exchange.context_note && (
              <p className="text-sm text-primary-400 dark:text-primary-500">
                &ldquo;{exchange.context_note}&rdquo;
              </p>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusInfo.color
            )}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Receiver status controls (receiver sees edit, sender sees read-only) */}
        {exchange.status === "accepted" && isReceiver && (
          <div className="mt-4 space-y-3 border-t border-primary-100 pt-4 dark:border-primary-800">
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="h-4 w-4 text-primary-400" />
              <span className="text-xs font-medium text-primary-600 dark:text-primary-300">
                Share your status update with the sender
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["none", "in_progress", "converted", "lost"] as ReceiverStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setReceiverStatus(s)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    receiverStatus === s
                      ? RECEIVER_STATUS_COLORS[s]
                      : "bg-primary-50 text-primary-500 hover:bg-primary-100 dark:bg-primary-800 dark:text-primary-400 dark:hover:bg-primary-700"
                  )}
                >
                  {RECEIVER_STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-primary-500 dark:text-primary-400">
                <input
                  type="checkbox"
                  checked={statusVisible}
                  onChange={(e) => setStatusVisible(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-primary-300 text-primary-600 focus:ring-primary-500 dark:border-primary-600 dark:bg-primary-800"
                />
                {statusVisible ? (
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
                onClick={handleSaveStatus}
                disabled={isUpdatingStatus}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
              >
                {isUpdatingStatus ? "Saving..." : "Save Update"}
              </button>
            </div>
          </div>
        )}

        {/* Sender sees receiver's status (read-only) */}
        {exchange.status === "accepted" && isSender && (
          <div className="mt-4 border-t border-primary-100 pt-4 dark:border-primary-800">
            {exchange.receiver_status_visible && exchange.receiver_status !== "none" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary-500 dark:text-primary-400">
                  Status update:
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    RECEIVER_STATUS_COLORS[exchange.receiver_status]
                  )}
                >
                  {exchange.receiver_status === "converted" && (
                    <StarIcon className="h-3 w-3" />
                  )}
                  {RECEIVER_STATUS_LABELS[exchange.receiver_status]}
                </span>
              </div>
            ) : (
              <p className="text-xs text-primary-400 dark:text-primary-500">
                Awaiting status update from receiver.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Message thread */}
      <div className="rounded-xl border border-primary-200 dark:border-primary-800">
        <div className="border-b border-primary-200 px-5 py-3 dark:border-primary-800">
          <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-200">
            Messages
          </h3>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-900/30" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-primary-400 dark:text-primary-500">
                No messages yet. Start the conversation below.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.sender_user_id === currentUserId;
                const name = isOwn
                  ? "You"
                  : msg.sender_profile?.full_name || "Unknown";
                const initials = isOwn
                  ? "You"
                  : getInitials(
                      msg.sender_profile?.full_name?.split(" ")[0] || "?",
                      msg.sender_profile?.full_name?.split(" ").slice(1).join(" ")
                    );

                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    {/* Avatar */}
                    {msg.sender_profile?.avatar_url ? (
                      <img
                        src={msg.sender_profile.avatar_url}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600 dark:bg-primary-800 dark:text-primary-300">
                        {isOwn ? "Y" : initials}
                      </div>
                    )}
                    {/* Message bubble */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-primary-800 dark:text-primary-100">
                          {name}
                        </span>
                        <span className="text-xs text-primary-400 dark:text-primary-500">
                          {formatRelative(msg.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-primary-600 dark:text-primary-300 whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>
          )}
        </div>

        {/* Compose area — only for accepted exchanges */}
        {exchange.status === "accepted" && (
          <div className="border-t border-primary-200 p-4 dark:border-primary-800">
            <div className="flex gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={2}
                maxLength={2000}
                className="flex-1 resize-none rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 placeholder:text-primary-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-100 dark:placeholder:text-primary-600"
              />
              <button
                onClick={handleSend}
                disabled={isSending || !draft.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                title="Send message"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-right text-xs text-primary-400">
              {draft.length}/2000
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
