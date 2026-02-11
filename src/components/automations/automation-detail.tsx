"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAutomation } from "@/lib/hooks/use-automations";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { StepBuilder } from "./step-builder";
import { EnrollmentList } from "./enrollment-list";
import { EmailLogList } from "./email-log-list";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AutomationStatus, AutomationStep } from "@/types/database";
import {
  PencilSquareIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/react/24/outline";

const STATUS_COLORS: Record<AutomationStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  paused:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  archived: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

type TabKey = "steps" | "enrolled" | "activity" | "settings";

interface AutomationDetailProps {
  automationId: string;
}

export function AutomationDetail({ automationId }: AutomationDetailProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const toast = useToast();
  const { automation, isLoading, error, refresh } =
    useAutomation(automationId);
  const [activeTab, setActiveTab] = useState<TabKey>("steps");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function toggleStatus() {
    if (!automation) return;

    const newStatus: AutomationStatus =
      automation.status === "active" ? "paused" : "active";

    try {
      const { error } = await supabase
        .from("automations")
        .update({ status: newStatus })
        .eq("id", automation.id);

      if (error) throw error;
      toast.success(
        newStatus === "active" ? "Sequence activated" : "Sequence paused",
        newStatus === "active"
          ? "This nurture sequence is now running."
          : "This nurture sequence has been paused."
      );
      refresh();
    } catch (err) {
      toast.error(
        "Failed to update automation",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  async function handleDelete() {
    if (!automation) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("automations")
        .delete()
        .eq("id", automation.id);

      if (error) throw error;
      toast.success(
        "Sequence removed",
        "The nurture sequence has been permanently removed."
      );
      router.push("/automations");
    } catch (err) {
      toast.error(
        "Failed to delete automation",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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

  if (error || !automation) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {error || "Automation not found"}
      </div>
    );
  }

  const steps = (automation.steps ?? []) as AutomationStep[];
  const tabs: { key: TabKey; label: string }[] = [
    { key: "steps", label: "Steps" },
    { key: "enrolled", label: "Enrolled" },
    { key: "activity", label: "Activity" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {automation.name}
            </h2>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                STATUS_COLORS[automation.status]
              )}
            >
              {automation.status}
            </span>
          </div>
          {automation.description && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {automation.description}
            </p>
          )}
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Created {formatDate(automation.created_at)} &middot; Trigger:{" "}
            {automation.trigger_type.replace(/_/g, " ")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(automation.status === "draft" ||
            automation.status === "active" ||
            automation.status === "paused") && (
            <button
              onClick={toggleStatus}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium",
                automation.status === "active"
                  ? "border-yellow-300 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-950"
                  : "border-green-300 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
              )}
            >
              {automation.status === "active" ? (
                <>
                  <PauseIcon className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  Activate
                </>
              )}
            </button>
          )}
          <Link
            href={`/automations/${automation.id}/edit`}
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
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium",
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "steps" && (
        <StepBuilder
          automationId={automation.id}
          steps={steps}
          onRefresh={refresh}
        />
      )}
      {activeTab === "enrolled" && (
        <EnrollmentList automationId={automation.id} />
      )}
      {activeTab === "activity" && (
        <EmailLogList automationId={automation.id} />
      )}
      {activeTab === "settings" && (
        <div className="max-w-lg space-y-4 rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name
            </p>
            <p className="text-sm text-zinc-900 dark:text-white">
              {automation.name}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description
            </p>
            <p className="text-sm text-zinc-900 dark:text-white">
              {automation.description || "--"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Trigger
            </p>
            <p className="text-sm capitalize text-zinc-900 dark:text-white">
              {automation.trigger_type.replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </p>
            <p className="text-sm capitalize text-zinc-900 dark:text-white">
              {automation.status}
            </p>
          </div>
          <Link
            href={`/automations/${automation.id}/edit`}
            className="inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Edit Settings
          </Link>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Delete Automation
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to uproot this nurture sequence? All steps,
              enrollments, and email logs will be permanently removed.
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
