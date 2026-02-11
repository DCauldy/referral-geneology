"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { usePipelineStages } from "@/lib/hooks/use-deals";
import { DEAL_TYPES, DEAL_STATUSES, CURRENCIES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import type { Deal, Contact, Company, PipelineStage } from "@/types/database";

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  value: z.coerce.number().positive().optional().or(z.literal("")),
  currency: z.string().default("USD"),
  deal_type: z.enum(DEAL_TYPES).default("one_time"),
  probability: z.coerce
    .number()
    .min(0, "Probability must be 0-100")
    .max(100, "Probability must be 0-100")
    .optional()
    .or(z.literal("")),
  contact_id: z.string().optional().default(""),
  company_id: z.string().optional().default(""),
  stage_id: z.string().optional().default(""),
  expected_close_date: z.string().optional().default(""),
  actual_close_date: z.string().optional().default(""),
  status: z.enum(DEAL_STATUSES).default("open"),
  description: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  deal?: Deal;
  onSuccess?: () => void;
}

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

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
  const [companies, setCompanies] = useState<Pick<Company, "id" | "name">[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
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
      probability: deal?.probability ?? "",
      contact_id: deal?.contact_id ?? "",
      company_id: deal?.company_id ?? "",
      stage_id: deal?.stage_id ?? "",
      expected_close_date: deal?.expected_close_date?.split("T")[0] ?? "",
      actual_close_date: deal?.actual_close_date?.split("T")[0] ?? "",
      status: deal?.status ?? "open",
      description: deal?.description ?? "",
      notes: deal?.notes ?? "",
    },
  });

  const selectedContactId = watch("contact_id");
  const selectedCompanyId = watch("company_id");

  // Initialize display names for edit mode
  const [contactDisplayName, setContactDisplayName] = useState("");
  const [companyDisplayName, setCompanyDisplayName] = useState("");

  useEffect(() => {
    if (deal?.contact) {
      const c = deal.contact;
      setContactDisplayName(
        [c.first_name, c.last_name].filter(Boolean).join(" ")
      );
      setContactSearch([c.first_name, c.last_name].filter(Boolean).join(" "));
    }
    if (deal?.company) {
      setCompanyDisplayName(deal.company.name);
      setCompanySearch(deal.company.name);
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

  // Search companies
  useEffect(() => {
    async function searchCompanies() {
      if (!org || companySearch.length < 1) {
        setCompanies([]);
        return;
      }
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("org_id", org.id)
        .ilike("name", `%${companySearch}%`)
        .limit(10);
      setCompanies(data ?? []);
    }
    const timer = setTimeout(searchCompanies, 300);
    return () => clearTimeout(timer);
  }, [supabase, org, companySearch]);

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
        probability:
          values.probability !== "" && values.probability != null
            ? Number(values.probability)
            : null,
        contact_id: values.contact_id || null,
        company_id: values.company_id || null,
        stage_id: values.stage_id || null,
        expected_close_date: values.expected_close_date || null,
        actual_close_date: values.actual_close_date || null,
        status: values.status,
        description: values.description || null,
        notes: values.notes || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("deals")
          .update(payload)
          .eq("id", deal.id);

        if (error) throw error;
        toast.success("Fruit updated", "The fruit details have been saved.");
      } else {
        const { error } = await supabase
          .from("deals")
          .insert({ ...payload, org_id: org.id });

        if (error) throw error;
        toast.success("Fruit added", "New fruit has been added to your grove.");
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
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
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
          <div>
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
          <div>
            <label htmlFor="probability" className={labelClassName}>
              Probability (%)
            </label>
            <input
              id="probability"
              type="number"
              {...register("probability")}
              className={cn(inputClassName, errors.probability && "border-red-500")}
              placeholder="50"
              min="0"
              max="100"
            />
            {errors.probability && (
              <p className={errorClassName}>{errors.probability.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="status" className={labelClassName}>
              Status
            </label>
            <select
              id="status"
              {...register("status")}
              className={inputClassName}
            >
              {DEAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Relations */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Relations
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Contact Combobox */}
          <div className="relative">
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
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
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
            {showContactDropdown && contacts.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
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
                        "cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700",
                        selectedContactId === c.id &&
                          "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      )}
                    >
                      {name}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Company Combobox */}
          <div className="relative">
            <label htmlFor="company_search" className={labelClassName}>
              Company
            </label>
            <input
              id="company_search"
              type="text"
              value={companySearch}
              onChange={(e) => {
                setCompanySearch(e.target.value);
                setShowCompanyDropdown(true);
                if (!e.target.value) {
                  setValue("company_id", "");
                  setCompanyDisplayName("");
                }
              }}
              onFocus={() => setShowCompanyDropdown(true)}
              onBlur={() => {
                setTimeout(() => setShowCompanyDropdown(false), 200);
              }}
              className={inputClassName}
              placeholder="Search companies..."
              autoComplete="off"
            />
            <input type="hidden" {...register("company_id")} />
            {selectedCompanyId && companyDisplayName && (
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Selected: {companyDisplayName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setValue("company_id", "");
                    setCompanySearch("");
                    setCompanyDisplayName("");
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear
                </button>
              </div>
            )}
            {showCompanyDropdown && companies.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                {companies.map((c) => (
                  <li
                    key={c.id}
                    onMouseDown={() => {
                      setValue("company_id", c.id);
                      setCompanySearch(c.name);
                      setCompanyDisplayName(c.name);
                      setShowCompanyDropdown(false);
                    }}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700",
                      selectedCompanyId === c.id &&
                        "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                    )}
                  >
                    {c.name}
                  </li>
                ))}
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
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
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
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
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
      <div className="flex items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-700">
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
    </form>
  );
}
