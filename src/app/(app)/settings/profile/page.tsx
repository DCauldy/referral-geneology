"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";
import { useOrg } from "@/components/providers/org-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { usePlanLimits } from "@/lib/hooks/use-plan-limits";
import { useMyDirectoryProfile } from "@/lib/hooks/use-directory";
import { useImpersonation } from "@/lib/hooks/use-impersonation";
import { getInitials, formatPhone } from "@/lib/utils/format";
import { INDUSTRIES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { CameraIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const inputClassName =
  "block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 shadow-sm placeholder:text-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-primary-700 dark:bg-primary-800 dark:text-white dark:placeholder:text-primary-500";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-primary-700 dark:text-primary-300";

const readOnlyInputClassName =
  "block w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800 dark:border-primary-700 dark:bg-primary-900 dark:text-white";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

interface ImpersonatedUser {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  directory_profile: {
    display_name: string;
    company_name: string | null;
    industry: string | null;
    location: string | null;
    bio: string | null;
    specialties: string[];
    referral_categories: string[];
    accepts_referrals: boolean;
    is_visible: boolean;
  } | null;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className={labelClassName}>{label}</span>
      <div className={readOnlyInputClassName}>{value || "—"}</div>
    </div>
  );
}

function ImpersonatedProfileView({ userId }: { userId: string }) {
  const [user, setUser] = useState<ImpersonatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        setError("Failed to load user profile");
        return;
      }
      setUser(await res.json());
    } catch {
      setError("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="divide-y divide-primary-200 dark:divide-primary-800">
        <SettingsSection
          title="Personal Information"
          description="Viewing this user's profile details."
        >
          <div className="grid max-w-lg gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-900" />
            ))}
          </div>
        </SettingsSection>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="divide-y divide-primary-200 dark:divide-primary-800">
        <SettingsSection
          title="Personal Information"
          description="Viewing this user's profile details."
        >
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error || "User not found"}
          </div>
        </SettingsSection>
      </div>
    );
  }

  const nameParts = (user.full_name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");
  const dir = user.directory_profile;

  return (
    <div className="divide-y divide-primary-200 dark:divide-primary-800">
      <SettingsSection
        title="Personal Information"
        description="Viewing this user's profile details."
      >
        <div className="grid max-w-lg gap-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-lg font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                getInitials(firstName, lastName)
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {user.full_name || "No name set"}
              </p>
              {user.job_title && (
                <p className="text-xs text-primary-500">{user.job_title}</p>
              )}
            </div>
          </div>

          {/* Name fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="First Name" value={firstName} />
            <ReadOnlyField label="Last Name" value={lastName} />
          </div>

          <ReadOnlyField label="Email" value={user.email || ""} />
          <ReadOnlyField label="Phone" value={formatPhone(user.phone)} />
          <ReadOnlyField label="Job Title" value={user.job_title || ""} />
        </div>
      </SettingsSection>

      {/* Directory Profile (read-only) */}
      {dir && (
        <SettingsSection
          title="Directory Presence"
          description="This user's directory profile."
        >
          <div className="grid max-w-lg gap-6">
            <ReadOnlyField label="Display Name" value={dir.display_name} />

            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Company" value={dir.company_name || ""} />
              <ReadOnlyField label="Industry" value={dir.industry || ""} />
            </div>

            <ReadOnlyField label="Location" value={dir.location || ""} />

            {dir.bio && <ReadOnlyField label="Bio" value={dir.bio} />}

            {dir.specialties.length > 0 && (
              <div>
                <span className={labelClassName}>Specialties</span>
                <div className="flex flex-wrap gap-1.5">
                  {dir.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {dir.referral_categories.length > 0 && (
              <div>
                <span className={labelClassName}>Referral Categories</span>
                <div className="flex flex-wrap gap-1.5">
                  {dir.referral_categories.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField
                label="Accepts Referrals"
                value={dir.accepts_referrals ? "Yes" : "No"}
              />
              <ReadOnlyField
                label="Directory Visibility"
                value={dir.is_visible ? "Visible" : "Hidden"}
              />
            </div>
          </div>
        </SettingsSection>
      )}
    </div>
  );
}

export default function ProfileSettingsPage() {
  const supabase = useSupabase();
  const { profile, refreshOrg } = useOrg();
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const { canExchangeReferrals } = usePlanLimits();
  const { profile: dirProfile, isLoading: dirLoading, saveProfile: saveDirProfile } = useMyDirectoryProfile();
  const { isImpersonating, impersonatedUserId, orgName } = useImpersonation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Directory profile state
  const [dirVisible, setDirVisible] = useState(false);
  const [dirDisplayName, setDirDisplayName] = useState("");
  const [dirCompanyName, setDirCompanyName] = useState("");
  const [dirIndustry, setDirIndustry] = useState("");
  const [dirLocation, setDirLocation] = useState("");
  const [dirBio, setDirBio] = useState("");
  const [dirSpecialties, setDirSpecialties] = useState<string[]>([]);
  const [dirCategories, setDirCategories] = useState<string[]>([]);
  const [dirAcceptsReferrals, setDirAcceptsReferrals] = useState(true);
  const [dirEmail, setDirEmail] = useState("");
  const [dirPhone, setDirPhone] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isSavingDir, setIsSavingDir] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Load profile data
  useEffect(() => {
    if (isImpersonating) return;

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
  }, [profile, supabase, isImpersonating]);

  // Load directory profile data
  useEffect(() => {
    if (isImpersonating) return;

    if (dirProfile) {
      setDirVisible(dirProfile.is_visible);
      setDirDisplayName(dirProfile.display_name);
      setDirCompanyName(dirProfile.company_name || "");
      setDirIndustry(dirProfile.industry || "");
      setDirLocation(dirProfile.location || "");
      setDirBio(dirProfile.bio || "");
      setDirSpecialties(dirProfile.specialties || []);
      setDirCategories(dirProfile.referral_categories || []);
      setDirAcceptsReferrals(dirProfile.accepts_referrals);
      setDirEmail(dirProfile.contact_email || "");
      setDirPhone(dirProfile.contact_phone || "");
    } else if (!dirLoading && profile) {
      // Pre-fill from user profile
      setDirDisplayName(profile.full_name || "");
    }
  }, [dirProfile, dirLoading, profile, isImpersonating]);

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
        const path = `${profile.id}/avatar.${ext}`;
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
        "Your profile has been saved."
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

  // Impersonation: show read-only view of target user
  if (isImpersonating) {
    if (impersonatedUserId) {
      return (
        <>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
            <ExclamationTriangleIcon className="size-5 shrink-0" />
            <p>
              Viewing <span className="font-semibold">{orgName}</span>&apos;s profile in read-only mode.
            </p>
          </div>
          <ImpersonatedProfileView userId={impersonatedUserId} />
        </>
      );
    }

    // Org-level impersonation — no specific user ID
    return (
      <div className="divide-y divide-primary-200 dark:divide-primary-800">
        <SettingsSection
          title="Personal Information"
          description="User profile details."
        >
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
            <ExclamationTriangleIcon className="size-5 shrink-0" />
            <p>
              User profile is not available during organization-level impersonation. To view a specific user&apos;s profile, impersonate from the Users page instead.
            </p>
          </div>
        </SettingsSection>
      </div>
    );
  }

  return (
    <div className="divide-y divide-primary-200 dark:divide-primary-800">
      {/* Personal Information */}
      <SettingsSection
        title="Personal Information"
        description="Update your personal details and profile photo."
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
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
              <p className="text-xs text-primary-400 dark:text-primary-500">
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
              className={cn(inputClassName, "cursor-not-allowed bg-primary-50 dark:bg-primary-900")}
            />
            <p className="mt-1 text-xs text-primary-400 dark:text-primary-500">
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
                    : "border-primary-200 text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      </SettingsSection>

      {/* Directory Presence */}
      {canExchangeReferrals && (
        <SettingsSection
          title="Directory Presence"
          description="Control how you appear in the member directory. Other members can find you and send referrals your way."
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingDir(true);
              try {
                await saveDirProfile({
                  display_name: dirDisplayName || profile?.full_name || "User",
                  company_name: dirCompanyName,
                  industry: dirIndustry,
                  location: dirLocation,
                  bio: dirBio,
                  avatar_url: profile?.avatar_url,
                  specialties: dirSpecialties,
                  referral_categories: dirCategories,
                  accepts_referrals: dirAcceptsReferrals,
                  is_visible: dirVisible,
                  contact_email: dirEmail,
                  contact_phone: dirPhone,
                });
                toast.success(
                  "Directory profile saved",
                  dirVisible
                    ? "You are now visible in the member directory."
                    : "Your directory profile has been saved but is hidden."
                );
              } catch (err) {
                toast.error(
                  "Failed to save directory profile",
                  err instanceof Error ? err.message : "An unexpected error occurred."
                );
              } finally {
                setIsSavingDir(false);
              }
            }}
            className="grid max-w-lg gap-6"
          >
            {/* Visibility toggle */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={dirVisible}
                onChange={(e) => setDirVisible(e.target.checked)}
                className="h-4 w-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500 dark:border-primary-600 dark:bg-primary-800"
              />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                List me in the directory
              </span>
            </label>

            {/* Display Name */}
            <div>
              <label htmlFor="dir_display_name" className={labelClassName}>
                Display Name
              </label>
              <input
                id="dir_display_name"
                type="text"
                value={dirDisplayName}
                onChange={(e) => setDirDisplayName(e.target.value)}
                className={inputClassName}
                placeholder="Your public name"
              />
            </div>

            {/* Company + Industry row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dir_company" className={labelClassName}>
                  Company
                </label>
                <input
                  id="dir_company"
                  type="text"
                  value={dirCompanyName}
                  onChange={(e) => setDirCompanyName(e.target.value)}
                  className={inputClassName}
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label htmlFor="dir_industry" className={labelClassName}>
                  Industry
                </label>
                <select
                  id="dir_industry"
                  value={dirIndustry}
                  onChange={(e) => setDirIndustry(e.target.value)}
                  className={inputClassName}
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="dir_location" className={labelClassName}>
                Location
              </label>
              <input
                id="dir_location"
                type="text"
                value={dirLocation}
                onChange={(e) => setDirLocation(e.target.value)}
                className={inputClassName}
                placeholder="San Francisco, CA"
              />
            </div>

            {/* Contact Email + Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dir_email" className={labelClassName}>
                  Public Email
                </label>
                <input
                  id="dir_email"
                  type="email"
                  value={dirEmail}
                  onChange={(e) => setDirEmail(e.target.value)}
                  className={inputClassName}
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="dir_phone" className={labelClassName}>
                  Public Phone
                </label>
                <input
                  id="dir_phone"
                  type="tel"
                  value={dirPhone}
                  onChange={(e) => setDirPhone(e.target.value)}
                  className={inputClassName}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <p className="-mt-4 text-xs text-primary-400 dark:text-primary-500">
              These will be visible to other members in the directory.
            </p>

            {/* Bio */}
            <div>
              <label htmlFor="dir_bio" className={labelClassName}>
                Bio
              </label>
              <textarea
                id="dir_bio"
                value={dirBio}
                onChange={(e) => setDirBio(e.target.value)}
                rows={3}
                className={inputClassName}
                placeholder="A brief intro about you and your business..."
              />
            </div>

            {/* Specialties */}
            <div>
              <label className={labelClassName}>Specialties</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {dirSpecialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setDirSpecialties((prev) => prev.filter((x) => x !== s))}
                      className="ml-0.5 text-primary-500 hover:text-primary-700"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newSpecialty.trim() && !dirSpecialties.includes(newSpecialty.trim())) {
                        setDirSpecialties((prev) => [...prev, newSpecialty.trim()]);
                        setNewSpecialty("");
                      }
                    }
                  }}
                  className={cn(inputClassName, "flex-1")}
                  placeholder="Add a specialty..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSpecialty.trim() && !dirSpecialties.includes(newSpecialty.trim())) {
                      setDirSpecialties((prev) => [...prev, newSpecialty.trim()]);
                      setNewSpecialty("");
                    }
                  }}
                  className="rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Referral Categories */}
            <div>
              <label className={labelClassName}>Referral Categories</label>
              <p className="mb-2 text-xs text-primary-400 dark:text-primary-500">
                What types of referrals are you looking for?
              </p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {dirCategories.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setDirCategories((prev) => prev.filter((x) => x !== c))}
                      className="ml-0.5 text-teal-500 hover:text-teal-700"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newCategory.trim() && !dirCategories.includes(newCategory.trim())) {
                        setDirCategories((prev) => [...prev, newCategory.trim()]);
                        setNewCategory("");
                      }
                    }
                  }}
                  className={cn(inputClassName, "flex-1")}
                  placeholder="e.g., Web Development..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCategory.trim() && !dirCategories.includes(newCategory.trim())) {
                      setDirCategories((prev) => [...prev, newCategory.trim()]);
                      setNewCategory("");
                    }
                  }}
                  className="rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Accepts Referrals */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={dirAcceptsReferrals}
                onChange={(e) => setDirAcceptsReferrals(e.target.checked)}
                className="h-4 w-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500 dark:border-primary-600 dark:bg-primary-800"
              />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                I am currently accepting referrals
              </span>
            </label>

            <div>
              <button
                type="submit"
                disabled={isSavingDir}
                className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
              >
                {isSavingDir ? "Saving..." : "Save Directory Profile"}
              </button>
            </div>
          </form>
        </SettingsSection>
      )}

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
