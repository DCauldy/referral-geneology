"use client";

import { useState } from "react";
import { useExchangeActions } from "@/lib/hooks/use-referral-exchange";
import { useToast } from "@/components/providers/toast-provider";
import type { Contact } from "@/types/database";
import {
  XMarkIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

interface SendReferralModalProps {
  contact: Contact;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SendReferralModal({
  contact,
  onClose,
  onSuccess,
}: SendReferralModalProps) {
  const toast = useToast();
  const { sendExchange, isSubmitting } = useExchangeActions();

  const [receiverEmail, setReceiverEmail] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [shareEmail, setShareEmail] = useState(!!contact.email);
  const [sharePhone, setSharePhone] = useState(!!contact.phone);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!receiverEmail) {
      toast.error("Email required", "Enter the recipient's email address.");
      return;
    }

    try {
      const result = await sendExchange({
        receiver_email: receiverEmail,
        contact_snapshot: {
          first_name: contact.first_name,
          last_name: contact.last_name,
          company_name: contact.company?.name || null,
          email: shareEmail ? contact.email : null,
          phone: sharePhone ? contact.phone : null,
          industry: contact.industry,
        },
        context_note: contextNote || undefined,
        source_contact_id: contact.id,
      });

      if (result.exchange?.status === "undeliverable") {
        toast.warning(
          "Referral pending",
          "The recipient is on a free plan. They'll be notified to upgrade."
        );
      } else if (result.exchange?.receiver_user_id) {
        toast.success(
          "Seed planted",
          "Your referral has been delivered to their inbox."
        );
      } else {
        toast.success(
          "Seed planted",
          "An invitation has been sent. They'll receive it when they join."
        );
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        "Failed to send referral",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  const fullName = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Send Referral
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Share this branch with another network to help it grow new roots.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Contact being shared */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Sharing
            </p>
            <p className="mt-1 font-medium text-zinc-900 dark:text-white">
              {fullName}
            </p>
            {contact.company?.name && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {contact.company.name}
              </p>
            )}
          </div>

          {/* Receiver email */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Recipient Email
            </label>
            <input
              type="email"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              If they're on Referral Genealogy (paid plan), it'll appear in their inbox.
              Otherwise they'll get an email invitation.
            </p>
          </div>

          {/* Data sharing toggles */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Information to Share
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input type="checkbox" checked disabled className="rounded" />
                Name: {fullName}
              </label>
              {contact.company?.name && (
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input type="checkbox" checked disabled className="rounded" />
                  Company: {contact.company.name}
                </label>
              )}
              {contact.email && (
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={shareEmail}
                    onChange={(e) => setShareEmail(e.target.checked)}
                    className="rounded"
                  />
                  Email: {contact.email}
                </label>
              )}
              {contact.phone && (
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={sharePhone}
                    onChange={(e) => setSharePhone(e.target.checked)}
                    className="rounded"
                  />
                  Phone: {contact.phone}
                </label>
              )}
            </div>
          </div>

          {/* Context note */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Context Note
            </label>
            <textarea
              value={contextNote}
              onChange={(e) => setContextNote(e.target.value)}
              placeholder="Why are you referring this contact? What do they need?"
              rows={3}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              {isSubmitting ? "Sending..." : "Send Referral"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
