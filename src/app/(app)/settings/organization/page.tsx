"use client";

import { useEffect, useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";
import { useOrg } from "@/components/providers/org-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useImpersonation } from "@/lib/hooks/use-impersonation";
import { INDUSTRIES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function OrganizationSettingsPage() {
  const supabase = useSupabase();
  const { org, membership, refreshOrg } = useOrg();
  const toast = useToast();
  const { isImpersonating } = useImpersonation();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = membership?.role === "owner";

  useEffect(() => {
    if (org) {
      setName(org.name || "");
      setWebsite(org.website || "");
      setIndustry(org.industry || "");
    }
  }, [org]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: name || org.name,
          website: website || null,
          industry: industry || null,
        })
        .eq("id", org.id);

      if (error) throw error;

      await refreshOrg();
      toast.success(
        "Organization updated",
        "Your organization details have been updated."
      );
    } catch (err) {
      toast.error(
        "Failed to update organization",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {isImpersonating && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200 sm:mx-6 lg:mx-8">
          <ExclamationTriangleIcon className="size-5 shrink-0" />
          <p>Viewing organization settings in read-only mode.</p>
        </div>
      )}

      {/* Organization Details */}
      <SettingsSection
        title="Organization Details"
        description="Manage your organization settings and details."
      >
        <form onSubmit={handleSave} className="grid max-w-lg gap-6">
          <div>
            <label htmlFor="org_name" className={labelClassName}>
              Name
            </label>
            <input
              id="org_name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isImpersonating}
              className={cn(inputClassName, isImpersonating && "cursor-not-allowed opacity-60")}
              placeholder="Acme Inc."
            />
          </div>

          <div>
            <label htmlFor="org_slug" className={labelClassName}>
              Slug
            </label>
            <input
              id="org_slug"
              type="text"
              value={org?.slug || ""}
              readOnly
              className={cn(
                inputClassName,
                "cursor-not-allowed bg-zinc-50 dark:bg-zinc-900"
              )}
            />
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Used in URLs. Cannot be changed.
            </p>
          </div>

          <div>
            <label htmlFor="org_website" className={labelClassName}>
              Website
            </label>
            <input
              id="org_website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={isImpersonating}
              className={cn(inputClassName, isImpersonating && "cursor-not-allowed opacity-60")}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="org_industry" className={labelClassName}>
              Industry
            </label>
            <select
              id="org_industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={isImpersonating}
              className={cn(inputClassName, isImpersonating && "cursor-not-allowed opacity-60")}
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {!isImpersonating && (
            <div>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </form>
      </SettingsSection>

      {/* Danger Zone - Owner only, hidden during impersonation */}
      {isOwner && !isImpersonating && (
        <SettingsSection
          title="Danger Zone"
          description="Permanently delete this organization and all its data. This cannot be undone."
        >
          <button
            type="button"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
          >
            Delete organization
          </button>
        </SettingsSection>
      )}
    </div>
  );
}
