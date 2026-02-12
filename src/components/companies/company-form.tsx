"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils/cn";
import type { Company } from "@/types/database";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().optional().default(""),
  website: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z
    .string()
    .optional()
    .default("")
    .refine((val) => val === "" || z.string().email().safeParse(val).success, {
      message: "Invalid email address",
    }),
  address_line1: z.string().optional().default(""),
  address_line2: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state_province: z.string().optional().default(""),
  postal_code: z.string().optional().default(""),
  country: z.string().optional().default(""),
  employee_count: z.coerce.number().int().positive().optional().or(z.literal("")),
  annual_revenue: z.coerce.number().positive().optional().or(z.literal("")),
  description: z.string().optional().default(""),
  linkedin_url: z.string().optional().default(""),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  company?: Company;
  onSuccess?: () => void;
}

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const errorClassName = "mt-1 text-xs text-red-600 dark:text-red-400";

export function CompanyForm({ company, onSuccess }: CompanyFormProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!company;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? "",
      industry: company?.industry ?? "",
      website: company?.website ?? "",
      phone: company?.phone ?? "",
      email: company?.email ?? "",
      address_line1: company?.address_line1 ?? "",
      address_line2: company?.address_line2 ?? "",
      city: company?.city ?? "",
      state_province: company?.state_province ?? "",
      postal_code: company?.postal_code ?? "",
      country: company?.country ?? "",
      employee_count: company?.employee_count ?? "",
      annual_revenue: company?.annual_revenue ?? "",
      description: company?.description ?? "",
      linkedin_url: company?.linkedin_url ?? "",
    },
  });

  async function onSubmit(values: CompanyFormValues) {
    if (!org) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name: values.name,
        industry: values.industry || null,
        website: values.website || null,
        phone: values.phone || null,
        email: values.email || null,
        address_line1: values.address_line1 || null,
        address_line2: values.address_line2 || null,
        city: values.city || null,
        state_province: values.state_province || null,
        postal_code: values.postal_code || null,
        country: values.country || null,
        employee_count:
          values.employee_count !== "" && values.employee_count != null
            ? Number(values.employee_count)
            : null,
        annual_revenue:
          values.annual_revenue !== "" && values.annual_revenue != null
            ? Number(values.annual_revenue)
            : null,
        description: values.description || null,
        linkedin_url: values.linkedin_url || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("companies")
          .update(payload)
          .eq("id", company.id);

        if (error) throw error;
        toast.success("Company updated", "The company details have been saved.");
      } else {
        const { error } = await supabase
          .from("companies")
          .insert({ ...payload, org_id: org.id });

        if (error) throw error;
        toast.success("Company created", "The company has been added to your network.");
      }

      onSuccess?.();
    } catch (err) {
      toast.error(
        isEditing ? "Failed to update company" : "Failed to create company",
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
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className={cn(inputClassName, errors.name && "border-red-500")}
              placeholder="Acme Inc."
            />
            {errors.name && (
              <p className={errorClassName}>{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="industry" className={labelClassName}>
              Industry
            </label>
            <input
              id="industry"
              type="text"
              {...register("industry")}
              className={inputClassName}
              placeholder="Technology"
            />
          </div>
          <div>
            <label htmlFor="website" className={labelClassName}>
              Website
            </label>
            <input
              id="website"
              type="url"
              {...register("website")}
              className={inputClassName}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClassName}>
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              {...register("phone")}
              className={inputClassName}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClassName}>
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className={cn(inputClassName, errors.email && "border-red-500")}
              placeholder="info@example.com"
            />
            {errors.email && (
              <p className={errorClassName}>{errors.email.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Address */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Address
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="address_line1" className={labelClassName}>
              Address Line 1
            </label>
            <input
              id="address_line1"
              type="text"
              {...register("address_line1")}
              className={inputClassName}
              placeholder="123 Main St"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address_line2" className={labelClassName}>
              Address Line 2
            </label>
            <input
              id="address_line2"
              type="text"
              {...register("address_line2")}
              className={inputClassName}
              placeholder="Suite 100"
            />
          </div>
          <div>
            <label htmlFor="city" className={labelClassName}>
              City
            </label>
            <input
              id="city"
              type="text"
              {...register("city")}
              className={inputClassName}
              placeholder="San Francisco"
            />
          </div>
          <div>
            <label htmlFor="state_province" className={labelClassName}>
              State / Province
            </label>
            <input
              id="state_province"
              type="text"
              {...register("state_province")}
              className={inputClassName}
              placeholder="CA"
            />
          </div>
          <div>
            <label htmlFor="postal_code" className={labelClassName}>
              Postal Code
            </label>
            <input
              id="postal_code"
              type="text"
              {...register("postal_code")}
              className={inputClassName}
              placeholder="94102"
            />
          </div>
          <div>
            <label htmlFor="country" className={labelClassName}>
              Country
            </label>
            <input
              id="country"
              type="text"
              {...register("country")}
              className={inputClassName}
              placeholder="United States"
            />
          </div>
        </div>
      </section>

      {/* Company Details */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Company Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="employee_count" className={labelClassName}>
              Employee Count
            </label>
            <input
              id="employee_count"
              type="number"
              {...register("employee_count")}
              className={inputClassName}
              placeholder="50"
              min="0"
            />
          </div>
          <div>
            <label htmlFor="annual_revenue" className={labelClassName}>
              Annual Revenue ($)
            </label>
            <input
              id="annual_revenue"
              type="number"
              {...register("annual_revenue")}
              className={inputClassName}
              placeholder="1000000"
              min="0"
              step="0.01"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClassName}>
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className={inputClassName}
              placeholder="Brief description of the company..."
            />
          </div>
        </div>
      </section>

      {/* Social */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Social
        </h3>
        <div>
          <label htmlFor="linkedin_url" className={labelClassName}>
            LinkedIn
          </label>
          <input
            id="linkedin_url"
            type="url"
            {...register("linkedin_url")}
            className={inputClassName}
            placeholder="https://linkedin.com/company/acme"
          />
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
              ? "Update Company"
              : "Create Company"}
        </button>
      </div>
    </form>
  );
}
