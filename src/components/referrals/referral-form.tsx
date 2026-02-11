"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { ContactPicker } from "@/components/contacts/contact-picker";
import { DealPicker } from "@/components/deals/deal-picker";
import { Button } from "@/components/catalyst/button";
import { Input } from "@/components/catalyst/input";
import { Select } from "@/components/catalyst/select";
import { Textarea } from "@/components/catalyst/textarea";
import { Field, Label } from "@/components/catalyst/fieldset";
import { REFERRAL_TYPES, REFERRAL_STATUSES } from "@/lib/utils/constants";
import { format } from "date-fns";

const referralSchema = z.object({
  referrer_id: z.string().min(1, "Referrer is required"),
  referred_id: z.string().min(1, "Referred contact is required"),
  deal_id: z.string().nullable(),
  referral_date: z.string().min(1, "Referral date is required"),
  referral_type: z.enum(["direct", "introduction", "recommendation", "mutual"]),
  status: z.enum(["pending", "active", "converted", "inactive", "declined"]),
  notes: z.string().nullable(),
});

type ReferralFormValues = z.infer<typeof referralSchema>;

interface ReferralFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<ReferralFormValues>;
}

export function ReferralForm({
  onSuccess,
  onCancel,
  defaultValues,
}: ReferralFormProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ReferralFormValues>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referrer_id: defaultValues?.referrer_id ?? "",
      referred_id: defaultValues?.referred_id ?? "",
      deal_id: defaultValues?.deal_id ?? null,
      referral_date:
        defaultValues?.referral_date ?? format(new Date(), "yyyy-MM-dd"),
      referral_type: defaultValues?.referral_type ?? "direct",
      status: defaultValues?.status ?? "pending",
      notes: defaultValues?.notes ?? null,
    },
  });

  const referrerId = watch("referrer_id");
  const referredId = watch("referred_id");

  const onSubmit = async (data: ReferralFormValues) => {
    if (!org) return;

    setIsSubmitting(true);

    try {
      // Compute depth and root_referrer_id by checking if the referrer was themselves referred
      let depth = 0;
      let rootReferrerId: string | null = data.referrer_id;

      // Look up the referrer's incoming referral to determine chain depth
      const { data: parentReferral } = await supabase
        .from("referrals")
        .select("depth, root_referrer_id, referrer_id")
        .eq("org_id", org.id)
        .eq("referred_id", data.referrer_id)
        .order("referral_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (parentReferral) {
        depth = parentReferral.depth + 1;
        rootReferrerId =
          parentReferral.root_referrer_id || parentReferral.referrer_id;
      }

      const { error: insertError } = await supabase
        .from("referrals")
        .insert({
          org_id: org.id,
          referrer_id: data.referrer_id,
          referred_id: data.referred_id,
          deal_id: data.deal_id,
          referral_date: data.referral_date,
          referral_type: data.referral_type,
          status: data.status,
          notes: data.notes,
          depth,
          root_referrer_id: rootReferrerId,
        });

      if (insertError) {
        toast.error("Failed to create referral", insertError.message);
        return;
      }

      toast.success("New growth recorded", "A new connection is extending your tree.");
      onSuccess?.();
    } catch (err) {
      toast.error(
        "Error",
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Referrer */}
      <Field>
        <Controller
          name="referrer_id"
          control={control}
          render={({ field }) => (
            <ContactPicker
              label="Referrer"
              value={field.value || null}
              onChange={(id) => field.onChange(id || "")}
              excludeIds={referredId ? [referredId] : []}
              error={errors.referrer_id?.message}
              placeholder="Who made the referral?"
            />
          )}
        />
      </Field>

      {/* Referred */}
      <Field>
        <Controller
          name="referred_id"
          control={control}
          render={({ field }) => (
            <ContactPicker
              label="Referred Contact"
              value={field.value || null}
              onChange={(id) => field.onChange(id || "")}
              excludeIds={referrerId ? [referrerId] : []}
              error={errors.referred_id?.message}
              placeholder="Who was referred?"
            />
          )}
        />
      </Field>

      {/* Deal (optional) */}
      <Field>
        <Controller
          name="deal_id"
          control={control}
          render={({ field }) => (
            <DealPicker
              label="Associated Deal (optional)"
              value={field.value}
              onChange={(id) => field.onChange(id)}
              error={errors.deal_id?.message}
            />
          )}
        />
      </Field>

      {/* Referral Date */}
      <Field>
        <Input
          label="Referral Date"
          type="date"
          {...register("referral_date")}
          error={errors.referral_date?.message}
        />
      </Field>

      {/* Referral Type */}
      <Field>
        <Select
          label="Referral Type"
          {...register("referral_type")}
          error={errors.referral_type?.message}
        >
          {REFERRAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </Select>
      </Field>

      {/* Status */}
      <Field>
        <Select
          label="Status"
          {...register("status")}
          error={errors.status?.message}
        >
          {REFERRAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </Select>
      </Field>

      {/* Notes */}
      <Field>
        <Label>Notes</Label>
        <Textarea
          {...register("notes")}
          placeholder="Additional notes about this referral..."
          rows={3}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          Create Referral
        </Button>
      </div>
    </form>
  );
}
