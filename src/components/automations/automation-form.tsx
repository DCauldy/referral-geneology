"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { AUTOMATION_TRIGGER_TYPES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import type { Automation, Tag } from "@/types/database";

const automationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  trigger_type: z.enum(["manual", "on_contact_create", "on_tag_added"]),
  tag_id: z.string().optional().default(""),
});

type AutomationFormValues = z.infer<typeof automationSchema>;

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const errorClassName = "mt-1 text-xs text-red-600 dark:text-red-400";

function formatTriggerLabel(value: string): string {
  switch (value) {
    case "manual":
      return "Manual Enrollment";
    case "on_contact_create":
      return "On Contact Create";
    case "on_tag_added":
      return "On Tag Added";
    default:
      return value;
  }
}

interface AutomationFormProps {
  automation?: Automation;
}

export function AutomationForm({ automation }: AutomationFormProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const isEditing = !!automation;

  const triggerConfig = automation?.trigger_config as Record<string, string> | null;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AutomationFormValues>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      name: automation?.name ?? "",
      description: automation?.description ?? "",
      trigger_type: automation?.trigger_type ?? "manual",
      tag_id: triggerConfig?.tag_id ?? "",
    },
  });

  const triggerType = watch("trigger_type");

  useEffect(() => {
    async function loadTags() {
      if (!org) return;
      const { data } = await supabase
        .from("tags")
        .select("*")
        .eq("org_id", org.id)
        .eq("entity_type", "contact")
        .order("name");
      setTags(data ?? []);
    }
    loadTags();
  }, [supabase, org]);

  async function onSubmit(values: AutomationFormValues) {
    if (!org) return;
    setIsSubmitting(true);

    try {
      const triggerConfig =
        values.trigger_type === "on_tag_added" && values.tag_id
          ? { tag_id: values.tag_id }
          : {};

      const payload = {
        name: values.name,
        description: values.description || null,
        trigger_type: values.trigger_type,
        trigger_config: triggerConfig,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("automations")
          .update(payload)
          .eq("id", automation.id);

        if (error) throw error;
        toast.success(
          "Sequence updated",
          "Your nurture sequence settings have been saved."
        );
        router.push(`/automations/${automation.id}`);
      } else {
        const { data: inserted, error } = await supabase
          .from("automations")
          .insert({ ...payload, org_id: org.id })
          .select("id")
          .single();

        if (error) throw error;
        toast.success(
          "Seeds planted",
          "Your new nurture sequence is ready. Add steps to get started."
        );
        router.push(`/automations/${inserted.id}`);
      }
    } catch (err) {
      toast.error(
        isEditing
          ? "Failed to update automation"
          : "Failed to create automation",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="name" className={labelClassName}>
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className={cn(inputClassName, errors.name && "border-red-500")}
          placeholder="Welcome Sequence"
        />
        {errors.name && (
          <p className={errorClassName}>{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className={labelClassName}>
          Description
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          className={inputClassName}
          placeholder="Describe the purpose of this automation..."
        />
      </div>

      <div>
        <label htmlFor="trigger_type" className={labelClassName}>
          Trigger
        </label>
        <select
          id="trigger_type"
          {...register("trigger_type")}
          className={inputClassName}
        >
          {AUTOMATION_TRIGGER_TYPES.map((t) => (
            <option key={t} value={t}>
              {formatTriggerLabel(t)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {triggerType === "manual" &&
            "You will manually enroll contacts into this sequence."}
          {triggerType === "on_contact_create" &&
            "New contacts will be automatically enrolled when created."}
          {triggerType === "on_tag_added" &&
            "Contacts will be enrolled when a specific tag is added."}
        </p>
      </div>

      {triggerType === "on_tag_added" && (
        <div>
          <label htmlFor="tag_id" className={labelClassName}>
            Tag
          </label>
          <select
            id="tag_id"
            {...register("tag_id")}
            className={inputClassName}
          >
            <option value="">Select a tag...</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Automation"
              : "Create Automation"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
