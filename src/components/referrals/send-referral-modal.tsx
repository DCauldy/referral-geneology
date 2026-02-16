"use client";

import { useEffect, useState } from "react";
import { useExchangeActions } from "@/lib/hooks/use-referral-exchange";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { ContactPicker } from "@/components/contacts/contact-picker";
import { formatPhone } from "@/lib/utils/format";
import type { Contact } from "@/types/database";
import {
  XMarkIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

interface SendReferralModalProps {
  contact?: Contact;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SendReferralModal({
  contact: initialContact,
  onClose,
  onSuccess,
}: SendReferralModalProps) {
  const supabase = useSupabase();
  const toast = useToast();
  const { sendExchange, isSubmitting } = useExchangeActions();

  const [contactId, setContactId] = useState<string | null>(initialContact?.id ?? null);
  const [contact, setContact] = useState<Contact | null>(initialContact ?? null);
  const [isLoadingContact, setIsLoadingContact] = useState(false);

  const [receiverEmail, setReceiverEmail] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [shareEmail, setShareEmail] = useState(!!initialContact?.email);
  const [sharePhone, setSharePhone] = useState(!!initialContact?.phone);

  // Fetch full contact when picked from ContactPicker (no initialContact)
  useEffect(() => {
    if (contactId && !initialContact) {
      setIsLoadingContact(true);
      supabase
        .from("contacts")
        .select("*, company:companies(*)")
        .eq("id", contactId)
        .single()
        .then(({ data }) => {
          if (data) {
            const c = data as unknown as Contact;
            setContact(c);
            setShareEmail(!!c.email);
            setSharePhone(!!c.phone);
          }
          setIsLoadingContact(false);
        });
    }
  }, [contactId, initialContact, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!contact) {
      toast.error("Contact required", "Select a contact to share.");
      return;
    }

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
          "New growth sent",
          "Your referral has been delivered to their inbox."
        );
      } else {
        toast.success(
          "New growth sent",
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

  const fullName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(" ")
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-primary-950">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-800 dark:text-white">
              Send Referral
            </h2>
            <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
              Share a contact with another professional in your network.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Contact picker (when no initial contact) */}
          {!initialContact && (
            <div>
              <ContactPicker
                value={contactId}
                onChange={(id) => {
                  setContactId(id);
                  if (!id) setContact(null);
                }}
                label="Contact to Share"
                placeholder="Search your contacts..."
                allowCreate
              />
            </div>
          )}

          {/* Contact being shared */}
          {isLoadingContact && (
            <div className="animate-pulse rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-700 dark:bg-primary-800">
              <div className="h-4 w-24 rounded bg-primary-200 dark:bg-primary-700" />
              <div className="mt-2 h-5 w-40 rounded bg-primary-200 dark:bg-primary-700" />
            </div>
          )}

          {contact && !isLoadingContact && (
            <>
              {/* Contact snapshot display */}
              <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-700 dark:bg-primary-800">
                <p className="text-xs font-medium uppercase tracking-wider text-primary-500 dark:text-primary-400">
                  Sharing
                </p>
                <p className="mt-1 font-medium text-primary-800 dark:text-white">
                  {fullName}
                </p>
                {contact.company?.name && (
                  <p className="text-sm text-primary-500 dark:text-primary-400">
                    {contact.company.name}
                  </p>
                )}
              </div>

              {/* Receiver email */}
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-primary-500 dark:text-primary-400">
                  If they&apos;re on Trellis (paid plan), it&apos;ll appear in their inbox.
                  Otherwise they&apos;ll get an email invitation.
                </p>
              </div>

              {/* Data sharing toggles */}
              <div>
                <p className="mb-2 text-sm font-medium text-primary-700 dark:text-primary-300">
                  Information to Share
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                    <input type="checkbox" checked disabled className="rounded" />
                    Name: {fullName}
                  </label>
                  {contact.company?.name && (
                    <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                      <input type="checkbox" checked disabled className="rounded" />
                      Company: {contact.company.name}
                    </label>
                  )}
                  {contact.email && (
                    <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
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
                    <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                      <input
                        type="checkbox"
                        checked={sharePhone}
                        onChange={(e) => setSharePhone(e.target.checked)}
                        className="rounded"
                      />
                      Phone: {formatPhone(contact.phone)}
                    </label>
                  )}
                </div>
              </div>

              {/* Context note */}
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                  Context Note
                </label>
                <textarea
                  value={contextNote}
                  onChange={(e) => setContextNote(e.target.value)}
                  placeholder="Why are you referring this contact? What do they need?"
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-800 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !contact}
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
