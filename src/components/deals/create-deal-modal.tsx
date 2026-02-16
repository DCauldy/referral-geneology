"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { usePipelineStages } from "@/lib/hooks/use-deals";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from "@/components/catalyst/dialog";
import { cn } from "@/lib/utils/cn";
import { DEAL_TYPES, CURRENCIES } from "@/lib/utils/constants";

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  value: z.coerce.number().positive().optional().or(z.literal("")),
  currency: z.string().default("USD"),
  deal_type: z.enum(DEAL_TYPES).default("one_time"),
  stage_id: z.string().optional().default(""),
  expected_close_date: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface CreateDealModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (dealId: string, dealName: string) => void;
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

export function CreateDealModal({
  open,
  onClose,
  onCreated,
}: CreateDealModalProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const { stages } = usePipelineStages();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: "",
      value: "",
      currency: "USD",
      deal_type: "one_time",
      stage_id: "",
      expected_close_date: "",
      description: "",
    },
  });

  // Auto-select the first stage when stages load
  useEffect(() => {
    if (stages.length > 0) {
      setValue("stage_id", stages[0].id);
    }
  }, [stages, setValue]);

  function handleClose() {
    reset();
    onClose();
  }

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
        stage_id: values.stage_id || null,
        expected_close_date: values.expected_close_date || null,
        description: values.description || null,
        org_id: org.id,
      };

      const { data, error } = await supabase
        .from("deals")
        .insert(payload)
        .select("id, name")
        .single();

      if (error) throw error;

      toast.success(
        "Deal created",
        "The deal has been added to your pipeline."
      );
      reset();
      onCreated(data.id, data.name);
    } catch (err) {
      toast.error(
        "Failed to create deal",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Create Deal</DialogTitle>
        <DialogDescription>
          Add a new deal to your pipeline. Only the deal name is required.
        </DialogDescription>

        <DialogBody className="space-y-6">
          {/* Basic Information */}
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-tan-500">
              Basic Information
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="modal_deal_name" className={labelClassName}>
                  Deal Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal_deal_name"
                  type="text"
                  {...register("name")}
                  className={cn(
                    inputClassName,
                    errors.name && "border-red-500"
                  )}
                  placeholder="New Website Project"
                  autoFocus
                />
                {errors.name && (
                  <p className={errorClassName}>{errors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="modal_deal_value" className={labelClassName}>
                  Value
                </label>
                <input
                  id="modal_deal_value"
                  type="number"
                  {...register("value")}
                  className={inputClassName}
                  placeholder="10000"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label htmlFor="modal_deal_currency" className={labelClassName}>
                  Currency
                </label>
                <select
                  id="modal_deal_currency"
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
            </div>
          </section>

          {/* Pipeline & Type */}
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-tan-500">
              Pipeline & Type
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="modal_deal_stage" className={labelClassName}>
                  Pipeline Stage
                </label>
                <select
                  id="modal_deal_stage"
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
              <div>
                <label htmlFor="modal_deal_type" className={labelClassName}>
                  Deal Type
                </label>
                <select
                  id="modal_deal_type"
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
                <label
                  htmlFor="modal_deal_expected_close"
                  className={labelClassName}
                >
                  Expected Close Date
                </label>
                <input
                  id="modal_deal_expected_close"
                  type="date"
                  {...register("expected_close_date")}
                  className={inputClassName}
                />
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-tan-500">
              Details
            </h4>
            <div>
              <label
                htmlFor="modal_deal_description"
                className={labelClassName}
              >
                Description
              </label>
              <textarea
                id="modal_deal_description"
                {...register("description")}
                rows={3}
                className={inputClassName}
                placeholder="Brief description of the deal..."
              />
            </div>
          </section>
        </DialogBody>

        <DialogActions>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border-2 border-primary-500 px-5 py-2.5 text-sm font-semibold text-primary-600 dark:border-primary-400 dark:text-primary-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-primary-200 disabled:text-primary-400"
          >
            {isSubmitting ? "Creating..." : "Create Deal"}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
