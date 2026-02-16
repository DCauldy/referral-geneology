"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { usePipelineStages } from "@/lib/hooks/use-deals";
import { DEAL_TYPES, CURRENCIES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { CreateContactModal } from "@/components/contacts/create-contact-modal";
import type { Deal, Contact, PipelineStage } from "@/types/database";

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  value: z.coerce.number().positive().optional().or(z.literal("")),
  currency: z.string().default("USD"),
  deal_type: z.enum(DEAL_TYPES).default("one_time"),
  contact_id: z.string().optional().default(""),
  stage_id: z.string().optional().default(""),
  expected_close_date: z.string().optional().default(""),
  actual_close_date: z.string().optional().default(""),
  description: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  deal?: Deal;
  onSuccess?: () => void;
}

const inputClassName =
"block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 shadow-sm placeholder:text-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-100 dark:placeholder:text-primary-600";

const labelClassName =
"mb-1.5 block text-sm font-medium text-primary-700 dark:text-primary-300";

const errorClassName = "mt-1 text-xs text-red-600 dark:text-red-400";

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function DealForm({ deal, onSuccess }: DealFormProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const { stages } = usePipelineStages();
  const [contacts, setContacts] = useState<Pick<Contact, "id" | "first_name" | "last_name">[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!deal;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: deal?.name ?? "",
      value: deal?.value ?? "",
      currency: deal?.currency ?? "USD",
      deal_type: deal?.deal_type ?? "one_time",
      contact_id: deal?.contact_id ?? "",
      stage_id: deal?.stage_id ?? "",
      expected_close_date: deal?.expected_close_date?.split("T")[0] ?? "",
      actual_close_date: deal?.actual_close_date?.split("T")[0] ?? "",
      description: deal?.description ?? "",
      notes: deal?.notes ?? "",
    },
  });

  const selectedContactId = watch("contact_id");

  // Initialize display name for edit mode
  const [contactDisplayName, setContactDisplayName] = useState("");

  useEffect(() => {
    if (deal?.contact) {
      const c = deal.contact;
      setContactDisplayName(
        [c.first_name, c.last_name].filter(Boolean).join(" ")
      );
      setContactSearch([c.first_name, c.last_name].filter(Boolean).join(" "));
    }
  }, [deal]);

  // Search contacts
  useEffect(() => {
    async function searchContacts() {
      if (!org || contactSearch.length < 1) {
        setContacts([]);
        return;
      }
      const { data } = await supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .eq("org_id", org.id)
        .or(
          `first_name.ilike.%${contactSearch}%,last_name.ilike.%${contactSearch}%`
        )
        .limit(10);
      setContacts(data ?? []);
    }
    const timer = setTimeout(searchContacts, 300);
    return () => clearTimeout(timer);
  }, [supabase, org, contactSearch]);

  async function onSubmit(values: DealFormValues) {
    if (!org) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name: values.name,
        value:
          values.value !== "" && values.value != null
            ? Number(values.value)
            : null,
        currency: values.currency,
        deal_type: values.deal_type,
        contact_id: values.contact_id || null,
        stage_id: values.stage_id || null,
        expected_close_date: values.expected_close_date || null,
        actual_close_date: values.actual_close_date || null,
        description: values.description || null,
        notes: values.notes || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("deals")
          .update(payload)
          .eq("id", deal.id);

        if (error) throw error;
        toast.success("Deal updated", "The deal details have been saved.");
      } else {
        const { error } = await supabase
          .from("deals")
          .insert({ ...payload, org_id: org.id });

        if (error) throw error;
        toast.success("Deal created", "The deal has been added to your pipeline.");
      }

      onSuccess?.();
    } catch (err) {
      toast.error(
        isEditing ? "Failed to update deal" : "Failed to create deal",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
      {/* Basic Information */}
      <section>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-tan-500">
          Basic Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={labelClassName}>
              Deal Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className={cn(inputClassName, errors.name && "border-red-500")}
              placeholder="New Website Project"
            />
            {errors.name && (
              <p className={errorClassName}>{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="value" className={labelClassName}>
              Value
            </label>
            <input
              id="value"
              type="number"
              {...register("value")}
              className={inputClassName}
              placeholder="10000"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="currency" className={labelClassName}>
              Currency
            </label>
            <select
              id="currency"
              {...register("currency")}
              className={inputClassName}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="deal_type" className={labelClassName}>
              Deal Type
            </label>
            <select
              id="deal_type"
              {...register("deal_type")}
              className={inputClassName}
            >
              {DEAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Relations */}
      <section>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-tan-500">
          Relations
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Contact Combobox */}
          <div className="relative sm:col-span-2">
            <label htmlFor="contact_search" className={labelClassName}>
              Contact
            </label>
            <input
              id="contact_search"
              type="text"
              value={contactSearch}
              onChange={(e) => {
                setContactSearch(e.target.value);
                setShowContactDropdown(true);
                if (!e.target.value) {
                  setValue("contact_id", "");
                  setContactDisplayName("");
                }
              }}
              onFocus={() => setShowContactDropdown(true)}
              onBlur={() => {
                // Delay to allow click on dropdown item
                setTimeout(() => setShowContactDropdown(false), 200);
              }}
              className={inputClassName}
              placeholder="Search contacts..."
              autoComplete="off"
            />
            <input type="hidden" {...register("contact_id")} />
            {selectedContactId && contactDisplayName && (
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs text-primary-500 dark:text-primary-400">
                  Selected: {contactDisplayName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setValue("contact_id", "");
                    setContactSearch("");
                    setContactDisplayName("");
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear
                </button>
              </div>
            )}
            {showContactDropdown && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-primary-200 bg-white shadow-lg dark:border-primary-700 dark:bg-primary-900/50">
                {contacts.map((c) => {
                  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
                  return (
                    <li
                      key={c.id}
                      onMouseDown={() => {
                        setValue("contact_id", c.id);
                        setContactSearch(name);
                        setContactDisplayName(name);
                        setShowContactDropdown(false);
                      }}
                      className={cn(
                        "cursor-pointer px-3 py-2 text-sm hover:bg-primary-50 dark:hover:bg-primary-900/30",
                        selectedContactId === c.id &&
                          "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      )}
                    >
                      {name}
                    </li>
                  );
                })}
                <li
                  onMouseDown={() => {
                    setShowContactDropdown(false);
                    setShowCreateContact(true);
                  }}
                  className="cursor-pointer border-t border-primary-200 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/30"
                >
                  + Create New Contact
                </li>
              </ul>
            )}
          </div>

          {/* Pipeline Stage */}
          <div className="sm:col-span-2">
            <label htmlFor="stage_id" className={labelClassName}>
              Pipeline Stage
            </label>
            <select
              id="stage_id"
              {...register("stage_id")}
              className={inputClassName}
            >
              <option value="">Select a stage</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Dates */}
      <section>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-tan-500">
          Dates
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="expected_close_date" className={labelClassName}>
              Expected Close Date
            </label>
            <input
              id="expected_close_date"
              type="date"
              {...register("expected_close_date")}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="actual_close_date" className={labelClassName}>
              Actual Close Date
            </label>
            <input
              id="actual_close_date"
              type="date"
              {...register("actual_close_date")}
              className={inputClassName}
            />
          </div>
        </div>
      </section>

      {/* Details */}
      <section>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-tan-500">
          Details
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="description" className={labelClassName}>
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={3}
              className={inputClassName}
              placeholder="Brief description of the deal..."
            />
          </div>
          <div>
            <label htmlFor="notes" className={labelClassName}>
              Notes
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={3}
              className={inputClassName}
              placeholder="Additional notes..."
            />
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3 border-t border-primary-200 pt-6 dark:border-primary-700">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Deal"
              : "Create Deal"}
        </button>
      </div>
      <CreateContactModal
        open={showCreateContact}
        onClose={() => setShowCreateContact(false)}
        onCreated={(contactId, displayName) => {
          setValue("contact_id", contactId);
          setContactSearch(displayName);
          setContactDisplayName(displayName);
          setShowCreateContact(false);
        }}
      />
    </form>
  );
}
