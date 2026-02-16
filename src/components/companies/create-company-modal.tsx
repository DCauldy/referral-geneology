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
  employee_count: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal("")),
  annual_revenue: z.coerce.number().positive().optional().or(z.literal("")),
  description: z.string().optional().default(""),
  linkedin_url: z.string().optional().default(""),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CreateCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (companyId: string) => void;
}

const inputClassName =
  "block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 shadow-sm placeholder:text-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-100 dark:placeholder:text-primary-600";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-primary-700 dark:text-primary-300";

const errorClassName = "mt-1 text-xs text-red-600 dark:text-red-400";

export function CreateCompanyModal({
  open,
  onClose,
  onCreated,
}: CreateCompanyModalProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      industry: "",
      website: "",
      phone: "",
      email: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state_province: "",
      postal_code: "",
      country: "",
      employee_count: "",
      annual_revenue: "",
      description: "",
      linkedin_url: "",
    },
  });

  function handleClose() {
    reset();
    onClose();
  }

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

      const { data, error } = await supabase
        .from("companies")
        .insert({ ...payload, org_id: org.id })
        .select("id")
        .single();

      if (error) throw error;

      toast.success(
        "Company created",
        "The company has been added to your network."
      );
      reset();
      onCreated(data.id);
    } catch (err) {
      toast.error(
        "Failed to create company",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} size="2xl">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Create Company</DialogTitle>
        <DialogDescription>
          Add a new company to your network. Only the company name is required.
        </DialogDescription>

        <DialogBody className="max-h-[60vh] space-y-6 overflow-y-auto">
          {/* Basic Information */}
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-tan-500">
              Basic Information
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="modal_company_name" className={labelClassName}>
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal_company_name"
                  type="text"
                  {...register("name")}
                  className={cn(
                    inputClassName,
                    errors.name && "border-red-500"
                  )}
                  placeholder="Acme Inc."
                  autoFocus
                />
                {errors.name && (
                  <p className={errorClassName}>{errors.name.message}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="modal_company_industry"
                  className={labelClassName}
                >
                  Industry
                </label>
                <input
                  id="modal_company_industry"
                  type="text"
                  {...register("industry")}
                  className={inputClassName}
                  placeholder="Technology"
                />
              </div>
              <div>
                <label
                  htmlFor="modal_company_website"
                  className={labelClassName}
                >
                  Website
                </label>
                <input
                  id="modal_company_website"
                  type="url"
                  {...register("website")}
                  className={inputClassName}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="modal_company_phone"
                  className={labelClassName}
                >
                  Phone
                </label>
                <input
                  id="modal_company_phone"
                  type="tel"
                  {...register("phone")}
                  className={inputClassName}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label
                  htmlFor="modal_company_email"
                  className={labelClassName}
                >
                  Email
                </label>
                <input
                  id="modal_company_email"
                  type="email"
                  {...register("email")}
                  className={cn(
                    inputClassName,
                    errors.email && "border-red-500"
                  )}
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
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-tan-500">
              Address
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="modal_company_address1"
                  className={labelClassName}
                >
                  Address Line 1
                </label>
                <input
                  id="modal_company_address1"
                  type="text"
                  {...register("address_line1")}
                  className={inputClassName}
                  placeholder="123 Main St"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="modal_company_address2"
                  className={labelClassName}
                >
                  Address Line 2
                </label>
                <input
                  id="modal_company_address2"
                  type="text"
                  {...register("address_line2")}
                  className={inputClassName}
                  placeholder="Suite 100"
                />
              </div>
              <div>
                <label
                  htmlFor="modal_company_city"
                  className={labelClassName}
                >
                  City
                </label>
                <input
                  id="modal_company_city"
                  type="text"
                  {...register("city")}
                  className={inputClassName}
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <label
                  htmlFor="modal_company_state"
                  className={labelClassName}
                >
                  State / Province
                </label>
                <input
                  id="modal_company_state"
                  type="text"
                  {...register("state_province")}
                  className={inputClassName}
                  placeholder="CA"
                />
              </div>
              <div>
                <label
                  htmlFor="modal_company_postal"
                  className={labelClassName}
                >
                  Postal Code
                </label>
                <input
                  id="modal_company_postal"
                  type="text"
                  {...register("postal_code")}
                  className={inputClassName}
                  placeholder="94102"
                />
              </div>
              <div>
                <label
                  htmlFor="modal_company_country"
                  className={labelClassName}
                >
                  Country
                </label>
                <input
                  id="modal_company_country"
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
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-tan-500">
              Company Details
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="modal_company_employees"
                  className={labelClassName}
                >
                  Employee Count
                </label>
                <input
                  id="modal_company_employees"
                  type="number"
                  {...register("employee_count")}
                  className={inputClassName}
                  placeholder="50"
                  min="0"
                />
              </div>
              <div>
                <label
                  htmlFor="modal_company_revenue"
                  className={labelClassName}
                >
                  Annual Revenue ($)
                </label>
                <input
                  id="modal_company_revenue"
                  type="number"
                  {...register("annual_revenue")}
                  className={inputClassName}
                  placeholder="1000000"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="modal_company_description"
                  className={labelClassName}
                >
                  Description
                </label>
                <textarea
                  id="modal_company_description"
                  {...register("description")}
                  rows={3}
                  className={inputClassName}
                  placeholder="Brief description of the company..."
                />
              </div>
            </div>
          </section>

          {/* Social */}
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-tan-500">
              Social
            </h4>
            <div>
              <label
                htmlFor="modal_company_linkedin"
                className={labelClassName}
              >
                LinkedIn
              </label>
              <input
                id="modal_company_linkedin"
                type="url"
                {...register("linkedin_url")}
                className={inputClassName}
                placeholder="https://linkedin.com/company/acme"
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
            {isSubmitting ? "Creating..." : "Create Company"}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
