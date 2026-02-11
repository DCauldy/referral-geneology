"use client";

import { useEffect, useRef, useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";
import { useOrg } from "@/components/providers/org-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { getInitials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { CameraIcon } from "@heroicons/react/24/outline";

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export default function ProfileSettingsPage() {
  const supabase = useSupabase();
  const { profile, refreshOrg } = useOrg();
  const toast = useToast();
  const { theme, setTheme } = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Load profile data
  useEffect(() => {
    if (profile) {
      const parts = (profile.full_name || "").split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" "));
      setPhone(profile.phone || "");
      setJobTitle(profile.job_title || "");
      setAvatarUrl(profile.avatar_url);
      setPhotoPreview(profile.avatar_url);
    }

    async function loadEmail() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    }
    loadEmail();
  }, [profile, supabase]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
  }

  function handlePhotoRemove() {
    setPhotoPreview(null);
    setAvatarUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    try {
      let newAvatarUrl = avatarUrl;

      // Handle avatar upload if a new file was selected
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `avatars/${profile.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);
        newAvatarUrl = publicUrl;
      }

      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: fullName || null,
          phone: phone || null,
          job_title: jobTitle || null,
          avatar_url: photoPreview === null ? null : newAvatarUrl,
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshOrg();
      toast.success(
        "Profile updated",
        "Your branch details have been saved to the tree."
      );
    } catch (err) {
      toast.error(
        "Failed to update profile",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {/* Personal Information */}
      <SettingsSection
        title="Personal Information"
        description="Update your personal details and how others see you on the tree."
      >
        <form onSubmit={handleSave} className="grid max-w-lg gap-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-lg font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                getInitials(firstName, lastName)
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
                  {photoPreview ? "Change" : "Upload"}
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
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                JPEG, PNG, GIF, or WebP. Max 5 MB.
              </p>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className={labelClassName}>
                First Name
              </label>
              <input
                id="first_name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClassName}
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="last_name" className={labelClassName}>
                Last Name
              </label>
              <input
                id="last_name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClassName}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className={labelClassName}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className={cn(inputClassName, "cursor-not-allowed bg-zinc-50 dark:bg-zinc-900")}
            />
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Managed by your authentication provider.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className={labelClassName}>
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClassName}
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Job Title */}
          <div>
            <label htmlFor="job_title" className={labelClassName}>
              Job Title
            </label>
            <input
              id="job_title"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className={inputClassName}
              placeholder="Software Engineer"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection
        title="Appearance"
        description="Customize the look and feel of your workspace."
      >
        <fieldset>
          <legend className="sr-only">Theme preference</legend>
          <div className="flex gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  theme === opt.value
                    ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      </SettingsSection>

      {/* Delete Account */}
      <SettingsSection
        title="Delete Account"
        description="Permanently remove your account and all associated data. This action cannot be undone."
      >
        <button
          type="button"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
        >
          Delete my account
        </button>
      </SettingsSection>
    </div>
  );
}
