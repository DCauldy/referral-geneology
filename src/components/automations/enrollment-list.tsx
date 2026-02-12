"use client";

import { useMemo, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useAutomationEnrollments } from "@/lib/hooks/use-automation-enrollments";
import { ContactPicker } from "@/components/contacts/contact-picker";
import { DataTable, type Column } from "@/components/shared/data-table";
import { getFullName, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AutomationEnrollment, EnrollmentStatus } from "@/types/database";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

const STATUS_COLORS: Record<EnrollmentStatus, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  completed:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  paused:
    "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300",
  canceled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

interface EnrollmentListProps {
  automationId: string;
}

export function EnrollmentList({ automationId }: EnrollmentListProps) {
  const supabase = useSupabase();
  const toast = useToast();
  const { enrollments, isLoading, refresh } =
    useAutomationEnrollments(automationId);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [isEnrolling, setIsEnrolling] = useState(false);

  const enrolledContactIds = useMemo(
    () => enrollments.map((e) => e.contact_id),
    [enrollments]
  );

  async function handleEnroll() {
    if (!selectedContactId) return;
    setIsEnrolling(true);

    try {
      const { error } = await supabase
        .from("automation_enrollments")
        .insert({
          automation_id: automationId,
          contact_id: selectedContactId,
          status: "active",
          current_step_order: 0,
          next_action_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success(
        "Contact enrolled",
        "The contact has been enrolled in this automation."
      );
      setSelectedContactId(null);
      setShowEnrollForm(false);
      refresh();
    } catch (err) {
      toast.error(
        "Failed to enroll contact",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsEnrolling(false);
    }
  }

  async function updateEnrollmentStatus(
    enrollmentId: string,
    newStatus: EnrollmentStatus
  ) {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("automation_enrollments")
        .update(updates)
        .eq("id", enrollmentId);

      if (error) throw error;
      toast.success("Enrollment updated", `Status changed to ${newStatus}.`);
      refresh();
    } catch (err) {
      toast.error(
        "Failed to update enrollment",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  const columns: Column<AutomationEnrollment>[] = useMemo(
    () => [
      {
        key: "contact",
        header: "Contact",
        render: (e) => {
          const contact = e.contact;
          if (!contact) return <span>--</span>;
          return (
            <div>
              <p className="font-medium">
                {getFullName(
                  contact.first_name,
                  contact.last_name ?? undefined
                )}
              </p>
              {contact.email && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {contact.email}
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        render: (e) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              STATUS_COLORS[e.status]
            )}
          >
            {e.status}
          </span>
        ),
      },
      {
        key: "current_step_order",
        header: "Current Step",
        render: (e) => (
          <span className="text-zinc-600 dark:text-zinc-400">
            {e.current_step_order}
          </span>
        ),
      },
      {
        key: "next_action_at",
        header: "Next Action",
        render: (e) => (
          <span className="text-zinc-500 dark:text-zinc-400">
            {e.next_action_at ? formatDate(e.next_action_at) : "--"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (e) => {
          if (e.status === "completed" || e.status === "canceled") return null;
          return (
            <div className="flex items-center gap-1">
              {e.status === "active" && (
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    updateEnrollmentStatus(e.id, "paused");
                  }}
                  className="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950"
                >
                  Pause
                </button>
              )}
              {e.status === "paused" && (
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    updateEnrollmentStatus(e.id, "active");
                  }}
                  className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                >
                  Resume
                </button>
              )}
              {(e.status === "active" || e.status === "paused") && (
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    updateEnrollmentStatus(e.id, "canceled");
                  }}
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Cancel
                </button>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-4">
      {/* Enroll button / form */}
      {showEnrollForm ? (
        <div className="flex items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex-1">
            <ContactPicker
              value={selectedContactId}
              onChange={setSelectedContactId}
              excludeIds={enrolledContactIds}
              label="Select a contact to enroll"
            />
          </div>
          <button
            onClick={handleEnroll}
            disabled={!selectedContactId || isEnrolling}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isEnrolling ? "Enrolling..." : "Enroll"}
          </button>
          <button
            onClick={() => {
              setShowEnrollForm(false);
              setSelectedContactId(null);
            }}
            className="rounded-lg border border-zinc-300 p-2 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowEnrollForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          Enroll Contact
        </button>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={enrollments}
        keyExtractor={(e) => e.id}
        isLoading={isLoading}
        emptyMessage="No contacts enrolled yet. Enroll contacts to start this automation."
      />
    </div>
  );
}
