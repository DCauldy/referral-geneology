"use client";

import { useCallback, useEffect, useState } from "react";
import { useExchangeActions } from "@/lib/hooks/use-referral-exchange";
import { useTags } from "@/lib/hooks/use-tags";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { ContactPicker } from "@/components/contacts/contact-picker";
import { TagInput } from "@/components/shared/tag-input";
import { formatPhone } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type {
  Contact,
  ReferralExchange,
  Tag,
  InterestLevel,
  ContactApproach,
  SenderMetadata,
} from "@/types/database";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ChevronRightIcon,
  EyeSlashIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

const INTEREST_LEVELS: { value: InterestLevel; label: string }[] = [
  { value: "just_curious", label: "Just Curious" },
  { value: "exploring_options", label: "Exploring Options" },
  { value: "actively_looking", label: "Actively Looking" },
  { value: "ready_soon", label: "Ready Soon" },
  { value: "ready_now", label: "Ready Now" },
];

const CONTACT_APPROACHES: { value: ContactApproach; label: string }[] = [
  { value: "they_will_contact", label: "They'll Reach Out" },
  { value: "please_reach_out", label: "Please Reach Out" },
  { value: "intro_already_made", label: "Intro Already Made" },
  { value: "timing_tbd", label: "Timing TBD" },
];

interface SendReferralModalProps {
  contact?: Contact;
  draft?: ReferralExchange;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SendReferralModal({
  contact: initialContact,
  draft,
  onClose,
  onSuccess,
}: SendReferralModalProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const { sendExchange, saveDraft, updateDraft, publishDraft, isSubmitting } =
    useExchangeActions();
  const { tags: availableTags, refresh: refreshTags } = useTags("exchange");

  // Contact state
  const [contactId, setContactId] = useState<string | null>(
    draft?.source_contact_id ?? initialContact?.id ?? null
  );
  const [contact, setContact] = useState<Contact | null>(
    initialContact ?? null
  );
  const [isLoadingContact, setIsLoadingContact] = useState(false);

  // Form fields
  const [receiverEmail, setReceiverEmail] = useState(
    draft?.receiver_email ?? ""
  );
  const [contextNote, setContextNote] = useState(
    draft?.context_note ?? ""
  );
  const [shareEmail, setShareEmail] = useState(!!initialContact?.email);
  const [sharePhone, setSharePhone] = useState(!!initialContact?.phone);
  const [shareMobilePhone, setShareMobilePhone] = useState(
    !!initialContact?.mobile_phone
  );

  // New enhanced fields
  const [interestLevel, setInterestLevel] = useState<InterestLevel | "">(
    draft?.interest_level ?? ""
  );
  const [contactApproach, setContactApproach] = useState<ContactApproach | "">(
    draft?.contact_approach ?? ""
  );
  const [howYouKnow, setHowYouKnow] = useState(
    (draft?.sender_metadata as SenderMetadata)?.how_you_know ?? ""
  );
  const [timelineUrgency, setTimelineUrgency] = useState(
    (draft?.sender_metadata as SenderMetadata)?.timeline_urgency ?? ""
  );
  const [internalNotes, setInternalNotes] = useState(
    draft?.internal_notes ?? ""
  );
  const [notifyOnConnect, setNotifyOnConnect] = useState(
    draft?.notify_on_connect ?? false
  );
  const [remindFollowUp, setRemindFollowUp] = useState(
    draft?.remind_follow_up ?? false
  );

  // Tags
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Advanced section toggle
  const draftHasAdvanced =
    !!howYouKnow || !!timelineUrgency || !!internalNotes;
  const [showAdvanced, setShowAdvanced] = useState(draftHasAdvanced);

  // Load contact for draft editing
  useEffect(() => {
    if (draft?.source_contact_id && !initialContact) {
      setIsLoadingContact(true);
      supabase
        .from("contacts")
        .select("*, company:companies(*)")
        .eq("id", draft.source_contact_id)
        .single()
        .then(({ data }) => {
          if (data) {
            const c = data as unknown as Contact;
            setContact(c);
            setShareEmail(!!draft.contact_snapshot?.email);
            setSharePhone(!!draft.contact_snapshot?.phone);
            setShareMobilePhone(!!c.mobile_phone);
          }
          setIsLoadingContact(false);
        });
    }
  }, [draft, initialContact, supabase]);

  // Fetch full contact when picked from ContactPicker
  useEffect(() => {
    if (contactId && !initialContact && !draft?.source_contact_id) {
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
            setShareMobilePhone(!!c.mobile_phone);
          }
          setIsLoadingContact(false);
        });
    }
  }, [contactId, initialContact, draft, supabase]);

  // Load existing tags for draft
  useEffect(() => {
    if (draft && org) {
      supabase
        .from("entity_tags")
        .select("tag_id, tags(*)")
        .eq("entity_type", "exchange")
        .eq("entity_id", draft.id)
        .then(({ data }) => {
          if (data) {
            const tags = data
              .map((et) => (et as unknown as { tags: Tag }).tags)
              .filter(Boolean);
            setSelectedTags(tags);
          }
        });
    }
  }, [draft, org, supabase]);

  // Tag handlers
  const handleAddTag = useCallback((tag: Tag) => {
    setSelectedTags((prev) => [...prev, tag]);
  }, []);

  const handleRemoveTag = useCallback((tagId: string) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  }, []);

  const handleCreateTag = useCallback(
    async (name: string) => {
      if (!org) return;
      const colors = [
        "#2f5435",
        "#b09352",
        "#4f46e5",
        "#0891b2",
        "#d97706",
        "#dc2626",
        "#7c3aed",
        "#059669",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const { data } = await supabase
        .from("tags")
        .insert({
          org_id: org.id,
          name,
          color,
          entity_type: "exchange",
        })
        .select()
        .single();

      if (data) {
        setSelectedTags((prev) => [...prev, data as unknown as Tag]);
        refreshTags();
      }
    },
    [org, supabase, refreshTags]
  );

  // Sync tags after exchange create/update
  async function syncTags(exchangeId: string) {
    if (!org) return;

    // Get existing entity_tags for this exchange
    const { data: existing } = await supabase
      .from("entity_tags")
      .select("id, tag_id")
      .eq("entity_type", "exchange")
      .eq("entity_id", exchangeId);

    const existingTagIds = new Set(
      (existing || []).map((et) => et.tag_id)
    );
    const selectedTagIds = new Set(selectedTags.map((t) => t.id));

    // Delete removed tags
    const toDelete = (existing || []).filter(
      (et) => !selectedTagIds.has(et.tag_id)
    );
    if (toDelete.length > 0) {
      await supabase
        .from("entity_tags")
        .delete()
        .in(
          "id",
          toDelete.map((et) => et.id)
        );
    }

    // Insert new tags
    const toInsert = selectedTags
      .filter((t) => !existingTagIds.has(t.id))
      .map((t) => ({
        tag_id: t.id,
        entity_type: "exchange" as const,
        entity_id: exchangeId,
      }));

    if (toInsert.length > 0) {
      await supabase.from("entity_tags").insert(toInsert);
    }
  }

  function buildPayload() {
    if (!contact) return null;

    // Include the best phone number(s) — mobile preferred if both selected
    const sharedPhone = sharePhone ? contact.phone : null;
    const sharedMobile = shareMobilePhone ? contact.mobile_phone : null;
    const phoneForSnapshot = sharedMobile || sharedPhone || null;

    return {
      receiver_email: receiverEmail || undefined,
      contact_snapshot: {
        first_name: contact.first_name,
        last_name: contact.last_name,
        company_name: contact.company?.name || null,
        email: shareEmail ? contact.email : null,
        phone: phoneForSnapshot,
        industry: contact.industry,
      },
      context_note: contextNote || undefined,
      source_contact_id: contact.id,
      interest_level: interestLevel || null,
      contact_approach: contactApproach || null,
      internal_notes: internalNotes || undefined,
      sender_metadata: {
        how_you_know: howYouKnow || undefined,
        timeline_urgency: timelineUrgency || undefined,
      } as SenderMetadata,
      notify_on_connect: notifyOnConnect,
      remind_follow_up: remindFollowUp,
    };
  }

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

    const payload = buildPayload();
    if (!payload) return;

    try {
      let result;
      if (draft) {
        // Publishing an existing draft
        // First update draft fields, then publish
        await updateDraft(draft.id, {
          ...payload,
          receiver_email: receiverEmail,
        });
        result = await publishDraft(draft.id);
      } else {
        // Direct send (no draft)
        result = await sendExchange({
          ...payload,
          receiver_email: receiverEmail,
        });
      }

      // Sync tags
      const exchangeId = result.exchange?.id || draft?.id;
      if (exchangeId) {
        await syncTags(exchangeId);
      }

      if (result.exchange?.status === "undeliverable") {
        toast.warning(
          "Referral pending",
          "The recipient is on a free plan. They'll be notified to upgrade."
        );
      } else if (result.exchange?.receiver_user_id) {
        toast.success(
          "Referral sent",
          "Your referral has been delivered to their inbox."
        );
      } else {
        toast.success(
          "Referral sent",
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

  async function handleSaveDraft() {
    if (!contact) {
      toast.error("Contact required", "Select a contact to save as a draft.");
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    try {
      let exchangeId: string;

      if (draft) {
        const result = await updateDraft(draft.id, payload);
        exchangeId = result.exchange?.id || draft.id;
        toast.success("Draft updated", "Your draft has been saved.");
      } else {
        const result = await saveDraft(payload);
        exchangeId = result.exchange?.id;
        toast.success("Draft saved", "You can finish and send it later.");
      }

      if (exchangeId) {
        await syncTags(exchangeId);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        "Failed to save draft",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  const fullName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(" ")
    : "";

  const isEditing = !!draft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-primary-950">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-800 dark:text-white">
              {isEditing ? "Edit Draft" : "Send Referral"}
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
          {!initialContact && !draft && (
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

          {/* Contact loading skeleton */}
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
                  className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-primary-500 dark:text-primary-400">
                  If they&apos;re on Trellis (paid plan), it&apos;ll appear in
                  their inbox. Otherwise they&apos;ll get an email invitation.
                </p>
              </div>

              {/* Data sharing toggles */}
              <div>
                <p className="mb-2 text-sm font-medium text-primary-700 dark:text-primary-300">
                  Information to Share
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="rounded"
                    />
                    Name: {fullName}
                  </label>
                  {contact.company?.name && (
                    <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="rounded"
                      />
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
                  {contact.mobile_phone && (
                    <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                      <input
                        type="checkbox"
                        checked={shareMobilePhone}
                        onChange={(e) =>
                          setShareMobilePhone(e.target.checked)
                        }
                        className="rounded"
                      />
                      Mobile: {formatPhone(contact.mobile_phone)}
                    </label>
                  )}
                </div>
              </div>

              {/* Interest Level & Contact Approach — side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                    Interest Level
                  </label>
                  <select
                    value={interestLevel}
                    onChange={(e) =>
                      setInterestLevel(e.target.value as InterestLevel | "")
                    }
                    className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-800 dark:text-white"
                  >
                    <option value="">Select...</option>
                    {INTEREST_LEVELS.map((il) => (
                      <option key={il.value} value={il.value}>
                        {il.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                    Contact Approach
                  </label>
                  <select
                    value={contactApproach}
                    onChange={(e) =>
                      setContactApproach(
                        e.target.value as ContactApproach | ""
                      )
                    }
                    className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-800 dark:text-white"
                  >
                    <option value="">Select...</option>
                    {CONTACT_APPROACHES.map((ca) => (
                      <option key={ca.value} value={ca.value}>
                        {ca.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Intro message (context note) */}
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                  Short Intro Message
                </label>
                <textarea
                  value={contextNote}
                  onChange={(e) => setContextNote(e.target.value)}
                  placeholder="Anything you want them to know?"
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-800 dark:text-white"
                />
              </div>

              {/* Advanced section — collapsed by default */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex w-full items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <ChevronRightIcon
                    className={cn(
                      "h-4 w-4 transition-transform",
                      showAdvanced && "rotate-90"
                    )}
                  />
                  Add more context (optional)
                </button>

                {showAdvanced && (
                  <div className="mt-3 space-y-4 rounded-lg bg-primary-50/50 p-4 dark:bg-primary-900/30">
                    {/* How you know them */}
                    <div>
                      <label className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                        How you know them
                      </label>
                      <input
                        type="text"
                        value={howYouKnow}
                        onChange={(e) => setHowYouKnow(e.target.value)}
                        placeholder="e.g. Client for 3 years, met at a conference"
                        className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-800 dark:text-white"
                      />
                    </div>

                    {/* Timeline urgency */}
                    <div>
                      <label className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                        Timeline urgency
                      </label>
                      <input
                        type="text"
                        value={timelineUrgency}
                        onChange={(e) => setTimelineUrgency(e.target.value)}
                        placeholder="e.g. Needs help by end of month"
                        className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-800 dark:text-white"
                      />
                    </div>

                    {/* Internal notes (private) */}
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="block text-sm font-medium text-primary-700 dark:text-primary-300">
                          Internal Notes
                        </label>
                        <span className="inline-flex items-center gap-1 rounded bg-primary-200 px-1.5 py-0.5 text-[10px] font-medium text-primary-600 dark:bg-primary-800 dark:text-primary-400">
                          <EyeSlashIcon className="h-3 w-3" />
                          Private
                        </span>
                      </div>
                      <textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Notes for your own reference (never shared with receiver)"
                        rows={2}
                        className="mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-primary-700 dark:bg-primary-800 dark:text-white"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-primary-700 dark:text-primary-300">
                        Tags
                      </label>
                      <TagInput
                        availableTags={availableTags}
                        selectedTags={selectedTags}
                        onAddTag={handleAddTag}
                        onRemoveTag={handleRemoveTag}
                        onCreateTag={handleCreateTag}
                        placeholder="Add tags..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notification preferences */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                  <input
                    type="checkbox"
                    checked={notifyOnConnect}
                    onChange={(e) => setNotifyOnConnect(e.target.checked)}
                    className="rounded"
                  />
                  Notify me when they connect
                </label>
                <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                  <input
                    type="checkbox"
                    checked={remindFollowUp}
                    onChange={(e) => setRemindFollowUp(e.target.checked)}
                    className="rounded"
                  />
                  Remind me to follow up
                </label>
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
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting || !contact}
              className="inline-flex items-center gap-2 rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm hover:bg-primary-50 disabled:opacity-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
            >
              <DocumentIcon className="h-4 w-4" />
              {isEditing ? "Update Draft" : "Save Draft"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !contact}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              {isSubmitting
                ? "Sending..."
                : isEditing
                  ? "Send Now"
                  : "Send Referral"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
