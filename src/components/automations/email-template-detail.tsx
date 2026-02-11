"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEmailTemplate } from "@/lib/hooks/use-email-templates";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { TemplatePreview } from "./template-preview";
import { EmailLogList } from "./email-log-list";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  PencilSquareIcon,
  TrashIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

interface EmailTemplateDetailProps {
  templateId: string;
}

export function EmailTemplateDetail({ templateId }: EmailTemplateDetailProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const toast = useToast();
  const { template, isLoading, error } = useEmailTemplate(templateId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "activity">(
    "preview"
  );

  async function handleDelete() {
    if (!template) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", template.id);

      if (error) throw error;
      toast.success("Letter discarded", "The template has been permanently removed.");
      router.push("/automations/templates");
    } catch (err) {
      toast.error(
        "Failed to delete template",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleArchiveToggle() {
    if (!template) return;

    try {
      const { error } = await supabase
        .from("email_templates")
        .update({ is_archived: !template.is_archived })
        .eq("id", template.id);

      if (error) throw error;
      toast.success(
        template.is_archived ? "Template restored" : "Template archived",
        template.is_archived
          ? "This letter is back in your collection."
          : "This letter has been archived."
      );
      router.refresh();
    } catch (err) {
      toast.error(
        "Failed to update template",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-96 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {error || "Template not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            {template.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Subject: {template.subject}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
            <span>Created {formatDate(template.created_at)}</span>
            <span>Updated {formatDate(template.updated_at)}</span>
            {template.is_archived && (
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                Archived
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleArchiveToggle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            {template.is_archived ? "Restore" : "Archive"}
          </button>
          <Link
            href={`/automations/templates/${template.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex gap-x-6">
          {(["preview", "activity"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium capitalize",
                activeTab === tab
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "preview" ? (
        <TemplatePreview html={template.html_content} />
      ) : (
        <EmailLogList templateId={template.id} />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Delete Template
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to discard this letter? This action cannot
              be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
