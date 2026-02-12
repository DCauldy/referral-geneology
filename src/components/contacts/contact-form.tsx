"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { RELATIONSHIP_TYPES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/format";
import { uploadContactPhoto, deleteContactPhoto } from "@/lib/supabase/storage";
import type { Contact, ContactChild, ImportantDate, ContactFavorites } from "@/types/database";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon, CameraIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

const PREFERRED_CONTACT_METHODS = [
  "email",
  "phone",
  "text",
  "linkedin",
  "in_person",
] as const;

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
  mobile_phone: z.string().optional().default(""),
  job_title: z.string().optional().default(""),
  company_id: z.string().optional().default(""),
  industry: z.string().optional().default(""),
  relationship_type: z.enum(RELATIONSHIP_TYPES).default("contact"),
  address_line1: z.string().optional().default(""),
  address_line2: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state_province: z.string().optional().default(""),
  postal_code: z.string().optional().default(""),
  country: z.string().optional().default(""),
  linkedin_url: z.string().optional().default(""),
  twitter_url: z.string().optional().default(""),
  facebook_url: z.string().optional().default(""),
  website_url: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  rating: z.number().min(0).max(5).optional().default(0),
  // Personal details (dedicated columns)
  birthday: z.string().optional().default(""),
  anniversary: z.string().optional().default(""),
  spouse_partner_name: z.string().optional().default(""),
  preferred_contact_method: z.enum(PREFERRED_CONTACT_METHODS).default("email"),
  // Interests stored in custom_fields JSONB
  hobbies: z.string().optional().default(""),
  fav_restaurant: z.string().optional().default(""),
  fav_sports_team: z.string().optional().default(""),
  fav_other: z.string().optional().default(""),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact;
  onSuccess?: () => void;
}

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const errorClassName = "mt-1 text-xs text-red-600 dark:text-red-400";

const smallBtnClassName =
  "inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/** Extract typed arrays/objects from the contact's custom_fields JSONB. */
function parseCustomFields(cf: unknown) {
  const obj = (cf && typeof cf === "object" && !Array.isArray(cf) ? cf : {}) as Record<string, unknown>;
  return {
    children: (Array.isArray(obj.children) ? obj.children : []) as ContactChild[],
    hobbies: (Array.isArray(obj.hobbies) ? obj.hobbies : []) as string[],
    important_dates: (Array.isArray(obj.important_dates) ? obj.important_dates : []) as ImportantDate[],
    favorites: (obj.favorites && typeof obj.favorites === "object" ? obj.favorites : {}) as ContactFavorites,
  };
}

export function ContactForm({ contact, onSuccess }: ContactFormProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!contact;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    contact?.profile_photo_url ?? null
  );
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Dynamic arrays managed outside react-hook-form (stored in custom_fields JSONB)
  const existingCf = parseCustomFields(contact?.custom_fields);
  const [children, setChildren] = useState<ContactChild[]>(existingCf.children);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>(existingCf.important_dates);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPhotoError("Please select a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError("Image must be under 5 MB.");
      return;
    }

    setPhotoFile(file);
    setPhotoRemoved(false);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handlePhotoRemove() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoRemoved(true);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: contact?.first_name ?? "",
      last_name: contact?.last_name ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ? formatPhone(contact.phone) : "",
      mobile_phone: contact?.mobile_phone ? formatPhone(contact.mobile_phone) : "",
      job_title: contact?.job_title ?? "",
      company_id: contact?.company_id ?? "",
      industry: contact?.industry ?? "",
      relationship_type: contact?.relationship_type ?? "contact",
      address_line1: contact?.address_line1 ?? "",
      address_line2: contact?.address_line2 ?? "",
      city: contact?.city ?? "",
      state_province: contact?.state_province ?? "",
      postal_code: contact?.postal_code ?? "",
      country: contact?.country ?? "",
      linkedin_url: contact?.linkedin_url ?? "",
      twitter_url: contact?.twitter_url ?? "",
      facebook_url: contact?.facebook_url ?? "",
      website_url: contact?.website_url ?? "",
      notes: contact?.notes ?? "",
      rating: contact?.rating ?? 0,
      birthday: contact?.birthday ?? "",
      anniversary: contact?.anniversary ?? "",
      spouse_partner_name: contact?.spouse_partner_name ?? "",
      preferred_contact_method: contact?.preferred_contact_method ?? "email",
      hobbies: existingCf.hobbies.join(", "),
      fav_restaurant: existingCf.favorites.restaurant ?? "",
      fav_sports_team: existingCf.favorites.sports_team ?? "",
      fav_other: existingCf.favorites.other ?? "",
    },
  });

  const currentRating = watch("rating");

  // Load companies for the dropdown
  useEffect(() => {
    async function loadCompanies() {
      if (!org) return;
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("org_id", org.id)
        .order("name");
      setCompanies(data ?? []);
    }
    loadCompanies();
  }, [supabase, org]);

  async function onSubmit(values: ContactFormValues) {
    if (!org) return;
    setIsSubmitting(true);

    try {
      let profilePhotoUrl: string | null | undefined;

      // Handle photo upload for new contacts — we need the record ID first
      // For edits, we can upload immediately
      if (photoFile && isEditing) {
        // Delete old photo if replacing
        if (contact.profile_photo_url) {
          await deleteContactPhoto(supabase, contact.profile_photo_url).catch(
            () => {} // non-fatal: old file may already be gone
          );
        }
        profilePhotoUrl = await uploadContactPhoto(
          supabase,
          org.id,
          contact.id,
          photoFile
        );
      } else if (photoRemoved && isEditing && contact.profile_photo_url) {
        await deleteContactPhoto(supabase, contact.profile_photo_url).catch(
          () => {}
        );
        profilePhotoUrl = null;
      }

      // Build custom_fields JSONB with interests/family data
      const hobbiesArray = values.hobbies
        ? values.hobbies.split(",").map((h) => h.trim()).filter(Boolean)
        : [];

      const favorites: ContactFavorites = {};
      if (values.fav_restaurant) favorites.restaurant = values.fav_restaurant;
      if (values.fav_sports_team) favorites.sports_team = values.fav_sports_team;
      if (values.fav_other) favorites.other = values.fav_other;

      const filteredChildren = children.filter((c) => c.name.trim());
      const filteredDates = importantDates.filter((d) => d.label.trim() && d.date);

      const customFields: Record<string, unknown> = {};
      if (filteredChildren.length > 0) customFields.children = filteredChildren;
      if (hobbiesArray.length > 0) customFields.hobbies = hobbiesArray;
      if (filteredDates.length > 0) customFields.important_dates = filteredDates;
      if (Object.keys(favorites).length > 0) customFields.favorites = favorites;

      const payload = {
        first_name: values.first_name,
        last_name: values.last_name || null,
        email: values.email || null,
        phone: values.phone || null,
        mobile_phone: values.mobile_phone || null,
        job_title: values.job_title || null,
        company_id: values.company_id || null,
        industry: values.industry || null,
        relationship_type: values.relationship_type,
        address_line1: values.address_line1 || null,
        address_line2: values.address_line2 || null,
        city: values.city || null,
        state_province: values.state_province || null,
        postal_code: values.postal_code || null,
        country: values.country || null,
        linkedin_url: values.linkedin_url || null,
        twitter_url: values.twitter_url || null,
        facebook_url: values.facebook_url || null,
        website_url: values.website_url || null,
        notes: values.notes || null,
        rating: values.rating || null,
        birthday: values.birthday || null,
        anniversary: values.anniversary || null,
        spouse_partner_name: values.spouse_partner_name || null,
        preferred_contact_method: values.preferred_contact_method,
        custom_fields: customFields,
        ...(profilePhotoUrl !== undefined && {
          profile_photo_url: profilePhotoUrl,
        }),
      };

      if (isEditing) {
        const { error } = await supabase
          .from("contacts")
          .update(payload)
          .eq("id", contact.id);

        if (error) throw error;
        toast.success("Contact updated", "The contact details have been saved.");
      } else {
        const { data: inserted, error } = await supabase
          .from("contacts")
          .insert({ ...payload, org_id: org.id, generation: 1 })
          .select("id")
          .single();

        if (error) throw error;

        // Upload photo for newly created contact
        if (photoFile && inserted) {
          const url = await uploadContactPhoto(
            supabase,
            org.id,
            inserted.id,
            photoFile
          );
          await supabase
            .from("contacts")
            .update({ profile_photo_url: url })
            .eq("id", inserted.id);
        }

        toast.success("Contact created", "The contact has been added to your network.");
      }

      onSuccess?.();
    } catch (err) {
      toast.error(
        isEditing ? "Failed to update contact" : "Failed to create contact",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatLabel(value: string): string {
    return value
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Children helpers
  function addChild() {
    setChildren((prev) => [...prev, { name: "" }]);
  }
  function removeChild(index: number) {
    setChildren((prev) => prev.filter((_, i) => i !== index));
  }
  function updateChild(index: number, field: keyof ContactChild, value: string) {
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  // Important dates helpers
  function addImportantDate() {
    setImportantDates((prev) => [...prev, { label: "", date: "" }]);
  }
  function removeImportantDate(index: number) {
    setImportantDates((prev) => prev.filter((_, i) => i !== index));
  }
  function updateImportantDate(index: number, field: keyof ImportantDate, value: string) {
    setImportantDates((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
      {/* Photo */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Photo
        </h3>
        <div className="flex items-center gap-5">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-lg font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Contact photo"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              getInitials(watch("first_name"), watch("last_name"))
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <CameraIcon className="h-4 w-4" />
                {photoPreview ? "Change photo" : "Upload photo"}
              </button>
              {photoPreview && (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {photoError && (
              <p className={errorClassName}>{photoError}</p>
            )}
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              JPEG, PNG, GIF, or WebP. Max 5 MB.
            </p>
          </div>
        </div>
      </section>

      {/* Basic Information */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Basic Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className={labelClassName}>
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="first_name"
              type="text"
              {...register("first_name")}
              className={cn(inputClassName, errors.first_name && "border-red-500")}
              placeholder="John"
            />
            {errors.first_name && (
              <p className={errorClassName}>{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="last_name" className={labelClassName}>
              Last Name
            </label>
            <input
              id="last_name"
              type="text"
              {...register("last_name")}
              className={inputClassName}
              placeholder="Doe"
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
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className={errorClassName}>{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className={labelClassName}>
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={watch("phone")}
              onChange={(e) => setValue("phone", formatPhone(e.target.value))}
              className={inputClassName}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label htmlFor="mobile_phone" className={labelClassName}>
              Mobile Phone
            </label>
            <input
              id="mobile_phone"
              type="tel"
              value={watch("mobile_phone")}
              onChange={(e) => setValue("mobile_phone", formatPhone(e.target.value))}
              className={inputClassName}
              placeholder="(555) 987-6543"
            />
          </div>
        </div>
      </section>

      {/* Personal Details */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Personal Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="birthday" className={labelClassName}>
              Birthday
            </label>
            <input
              id="birthday"
              type="date"
              {...register("birthday")}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="anniversary" className={labelClassName}>
              Anniversary
            </label>
            <input
              id="anniversary"
              type="date"
              {...register("anniversary")}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="spouse_partner_name" className={labelClassName}>
              Spouse / Partner Name
            </label>
            <input
              id="spouse_partner_name"
              type="text"
              {...register("spouse_partner_name")}
              className={inputClassName}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="preferred_contact_method" className={labelClassName}>
              Preferred Contact Method
            </label>
            <select
              id="preferred_contact_method"
              {...register("preferred_contact_method")}
              className={inputClassName}
            >
              {PREFERRED_CONTACT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {formatLabel(method)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Professional Information */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Professional Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="job_title" className={labelClassName}>
              Job Title
            </label>
            <input
              id="job_title"
              type="text"
              {...register("job_title")}
              className={inputClassName}
              placeholder="Software Engineer"
            />
          </div>
          <div>
            <label htmlFor="company_id" className={labelClassName}>
              Company
            </label>
            <select
              id="company_id"
              {...register("company_id")}
              className={inputClassName}
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
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
            <label htmlFor="relationship_type" className={labelClassName}>
              Relationship Type
            </label>
            <select
              id="relationship_type"
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

      {/* Social Links */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Social Links
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="linkedin_url" className={labelClassName}>
              LinkedIn
            </label>
            <input
              id="linkedin_url"
              type="url"
              {...register("linkedin_url")}
              className={inputClassName}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div>
            <label htmlFor="twitter_url" className={labelClassName}>
              Twitter
            </label>
            <input
              id="twitter_url"
              type="url"
              {...register("twitter_url")}
              className={inputClassName}
              placeholder="https://twitter.com/username"
            />
          </div>
          <div>
            <label htmlFor="facebook_url" className={labelClassName}>
              Facebook
            </label>
            <input
              id="facebook_url"
              type="url"
              {...register("facebook_url")}
              className={inputClassName}
              placeholder="https://facebook.com/username"
            />
          </div>
          <div>
            <label htmlFor="website_url" className={labelClassName}>
              Website
            </label>
            <input
              id="website_url"
              type="url"
              {...register("website_url")}
              className={inputClassName}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </section>

      {/* Interests & Family */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Interests & Family
        </h3>
        <div className="space-y-5">
          {/* Children */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={labelClassName}>Children</label>
              <button type="button" onClick={addChild} className={smallBtnClassName}>
                <PlusIcon className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            {children.length === 0 && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                No children added yet.
              </p>
            )}
            <div className="space-y-2">
              {children.map((child, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => updateChild(i, "name", e.target.value)}
                    className={cn(inputClassName, "flex-1")}
                    placeholder="Name"
                  />
                  <input
                    type="date"
                    value={child.birthday ?? ""}
                    onChange={(e) => updateChild(i, "birthday", e.target.value)}
                    className={cn(inputClassName, "w-40")}
                  />
                  <button
                    type="button"
                    onClick={() => removeChild(i)}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Hobbies */}
          <div>
            <label htmlFor="hobbies" className={labelClassName}>
              Hobbies / Interests
            </label>
            <input
              id="hobbies"
              type="text"
              {...register("hobbies")}
              className={inputClassName}
              placeholder="Golf, Reading, Cooking"
            />
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Comma-separated list
            </p>
          </div>

          {/* Important Dates */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={labelClassName}>Important Dates</label>
              <button type="button" onClick={addImportantDate} className={smallBtnClassName}>
                <PlusIcon className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            {importantDates.length === 0 && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                No important dates added yet.
              </p>
            )}
            <div className="space-y-2">
              {importantDates.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={d.label}
                    onChange={(e) => updateImportantDate(i, "label", e.target.value)}
                    className={cn(inputClassName, "flex-1")}
                    placeholder="Label (e.g., Work Anniversary)"
                  />
                  <input
                    type="date"
                    value={d.date}
                    onChange={(e) => updateImportantDate(i, "date", e.target.value)}
                    className={cn(inputClassName, "w-40")}
                  />
                  <button
                    type="button"
                    onClick={() => removeImportantDate(i)}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Favorites */}
          <div>
            <label className={labelClassName}>Favorites</label>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="fav_restaurant" className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  Restaurant
                </label>
                <input
                  id="fav_restaurant"
                  type="text"
                  {...register("fav_restaurant")}
                  className={inputClassName}
                  placeholder="Favorite restaurant"
                />
              </div>
              <div>
                <label htmlFor="fav_sports_team" className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  Sports Team
                </label>
                <input
                  id="fav_sports_team"
                  type="text"
                  {...register("fav_sports_team")}
                  className={inputClassName}
                  placeholder="Favorite team"
                />
              </div>
              <div>
                <label htmlFor="fav_other" className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  Other
                </label>
                <input
                  id="fav_other"
                  type="text"
                  {...register("fav_other")}
                  className={inputClassName}
                  placeholder="Anything else"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notes & Rating */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Notes & Rating
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="notes" className={labelClassName}>
              Notes
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={4}
              className={inputClassName}
              placeholder="Add any notes about this contact..."
            />
          </div>
          <div>
            <label className={labelClassName}>Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setValue("rating", currentRating === star ? 0 : star)
                  }
                  className="text-zinc-300 transition-colors hover:text-primary-400 dark:text-zinc-600"
                >
                  {star <= (currentRating ?? 0) ? (
                    <StarIcon className="h-6 w-6 text-primary-400" />
                  ) : (
                    <StarOutlineIcon className="h-6 w-6" />
                  )}
                </button>
              ))}
            </div>
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
              ? "Update Contact"
              : "Create Contact"}
        </button>
      </div>
    </form>
  );
}
