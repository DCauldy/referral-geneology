"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from "@/components/catalyst/dialog";
import { cn } from "@/lib/utils/cn";
import { RELATIONSHIP_TYPES } from "@/lib/utils/constants";

const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional().default(""),
  email: z
    .string()
    .optional()
    .default("")
    .refine((val) => val === "" || z.string().email().safeParse(val).success, {
      message: "Invalid email address",
    }),
  phone: z.string().optional().default(""),
  job_title: z.string().optional().default(""),
  relationship_type: z.string().default("prospect"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface CreateContactModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (contactId: string, displayName: string) => void;
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

export function CreateContactModal({
  open,
  onClose,
  onCreated,
}: CreateContactModalProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      job_title: "",
      relationship_type: "prospect",
    },
  });

  function handleClose() {
    reset();
    onClose();
  }

  async function onSubmit(values: ContactFormValues) {
    if (!org) return;
    setIsSubmitting(true);

    try {
      const payload = {
        first_name: values.first_name,
        last_name: values.last_name || null,
        email: values.email || null,
        phone: values.phone || null,
        job_title: values.job_title || null,
        relationship_type: values.relationship_type,
        org_id: org.id,
      };

      const { data, error } = await supabase
        .from("contacts")
        .insert(payload)
        .select("id, first_name, last_name")
        .single();

      if (error) throw error;

      const displayName = [data.first_name, data.last_name]
        .filter(Boolean)
        .join(" ");

      toast.success(
        "Contact created",
        "The contact has been added to your network."
      );
      reset();
      onCreated(data.id, displayName);
    } catch (err) {
      toast.error(
        "Failed to create contact",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Create Contact</DialogTitle>
        <DialogDescription>
          Add a new contact to your network. Only the first name is required.
        </DialogDescription>

        <DialogBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="modal_contact_first_name" className={labelClassName}>
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="modal_contact_first_name"
                type="text"
                {...register("first_name")}
                className={cn(
                  inputClassName,
                  errors.first_name && "border-red-500"
                )}
                placeholder="John"
                autoFocus
              />
              {errors.first_name && (
                <p className={errorClassName}>{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="modal_contact_last_name" className={labelClassName}>
                Last Name
              </label>
              <input
                id="modal_contact_last_name"
                type="text"
                {...register("last_name")}
                className={inputClassName}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="modal_contact_email" className={labelClassName}>
                Email
              </label>
              <input
                id="modal_contact_email"
                type="email"
                {...register("email")}
                className={cn(
                  inputClassName,
                  errors.email && "border-red-500"
                )}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className={errorClassName}>{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="modal_contact_phone" className={labelClassName}>
                Phone
              </label>
              <input
                id="modal_contact_phone"
                type="tel"
                {...register("phone")}
                className={inputClassName}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="modal_contact_job_title" className={labelClassName}>
                Job Title
              </label>
              <input
                id="modal_contact_job_title"
                type="text"
                {...register("job_title")}
                className={inputClassName}
                placeholder="Marketing Director"
              />
            </div>
            <div>
              <label htmlFor="modal_contact_relationship" className={labelClassName}>
                Relationship Type
              </label>
              <select
                id="modal_contact_relationship"
                {...register("relationship_type")}
                className={inputClassName}
              >
                {RELATIONSHIP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
            {isSubmitting ? "Creating..." : "Create Contact"}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
