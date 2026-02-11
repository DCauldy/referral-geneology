"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { TemplatePreview } from "./template-preview";
import { TEMPLATE_VARIABLES } from "@/lib/resend/config";
import { cn } from "@/lib/utils/cn";
import type { EmailTemplate } from "@/types/database";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject line is required"),
  html_content: z.string().min(1, "Email content is required"),
  text_content: z.string().optional().default(""),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const errorClassName = "mt-1 text-xs text-red-600 dark:text-red-400";

interface EmailTemplateFormProps {
  template?: EmailTemplate;
}

export function EmailTemplateForm({ template }: EmailTemplateFormProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!template;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? "",
      subject: template?.subject ?? "",
      html_content: template?.html_content ?? "",
      text_content: template?.text_content ?? "",
    },
  });

  const htmlContent = watch("html_content");

  function insertVariable(varKey: string) {
    const textarea = document.getElementById(
      "html_content"
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = watch("html_content");
    const insertion = `{{${varKey}}}`;
    const newValue =
      current.substring(0, start) + insertion + current.substring(end);
    setValue("html_content", newValue);

    // Restore cursor position after variable insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + insertion.length,
        start + insertion.length
      );
    }, 0);
  }

  async function onSubmit(values: TemplateFormValues) {
    if (!org) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name: values.name,
        subject: values.subject,
        html_content: values.html_content,
        text_content: values.text_content || "",
      };

      if (isEditing) {
        const { error } = await supabase
          .from("email_templates")
          .update(payload)
          .eq("id", template.id);

        if (error) throw error;
        toast.success("Letter updated", "Your template has been saved.");
        router.push(`/automations/templates/${template.id}`);
      } else {
        const { data: inserted, error } = await supabase
          .from("email_templates")
          .insert({ ...payload, org_id: org.id })
          .select("id")
          .single();

        if (error) throw error;
        toast.success("Letter crafted", "Your new email template is ready to send.");
        router.push(`/automations/templates/${inserted.id}`);
      }
    } catch (err) {
      toast.error(
        isEditing ? "Failed to update template" : "Failed to create template",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name & Subject */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClassName}>
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className={cn(inputClassName, errors.name && "border-red-500")}
            placeholder="Monthly Newsletter"
          />
          {errors.name && (
            <p className={errorClassName}>{errors.name.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="subject" className={labelClassName}>
            Subject Line <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            {...register("subject")}
            className={cn(inputClassName, errors.subject && "border-red-500")}
            placeholder="Hey {{first_name}}, we have news!"
          />
          {errors.subject && (
            <p className={errorClassName}>{errors.subject.message}</p>
          )}
        </div>
      </div>

      {/* Variable insertion buttons */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Insert Variable
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {`{{${v.key}}}`}
            </button>
          ))}
        </div>
      </div>

      {/* Split-pane editor */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* HTML Editor */}
        <div>
          <label htmlFor="html_content" className={labelClassName}>
            HTML Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="html_content"
            {...register("html_content")}
            rows={20}
            className={cn(
              inputClassName,
              "font-mono text-xs",
              errors.html_content && "border-red-500"
            )}
            placeholder="<html><body><h1>Hello {{first_name}}</h1></body></html>"
          />
          {errors.html_content && (
            <p className={errorClassName}>{errors.html_content.message}</p>
          )}
        </div>

        {/* Live Preview */}
        <TemplatePreview html={htmlContent} className="lg:mt-7" />
      </div>

      {/* Plain text fallback */}
      <div>
        <label htmlFor="text_content" className={labelClassName}>
          Plain Text Fallback
        </label>
        <textarea
          id="text_content"
          {...register("text_content")}
          rows={4}
          className={inputClassName}
          placeholder="Hello {{first_name}}, ..."
        />
      </div>

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
              ? "Save Template"
              : "Create Template"}
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
