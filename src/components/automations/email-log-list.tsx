"use client";

import { useMemo } from "react";
import { useEmailLogs } from "@/lib/hooks/use-email-logs";
import { DataTable, type Column } from "@/components/shared/data-table";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { EmailLog, EmailLogStatus } from "@/types/database";

const STATUS_COLORS: Record<EmailLogStatus, string> = {
  queued: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  delivered:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  opened:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  clicked:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  bounced: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  complained:
    "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

interface EmailLogListProps {
  automationId?: string;
  contactId?: string;
  templateId?: string;
}

export function EmailLogList({
  automationId,
  contactId,
  templateId,
}: EmailLogListProps) {
  const { logs, isLoading } = useEmailLogs({
    automationId,
    contactId,
    templateId,
  });

  const columns: Column<EmailLog>[] = useMemo(
    () => [
      {
        key: "to_email",
        header: "To",
        render: (log) => {
          const contact = log.contact;
          if (contact) {
            return (
              <div>
                <p className="font-medium">
                  {contact.first_name} {contact.last_name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {log.to_email}
                </p>
              </div>
            );
          }
          return <span>{log.to_email}</span>;
        },
      },
      {
        key: "subject",
        header: "Subject",
        render: (log) => (
          <span className="text-zinc-600 dark:text-zinc-400">
            {log.subject}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (log) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              STATUS_COLORS[log.status]
            )}
          >
            {log.status}
          </span>
        ),
      },
      {
        key: "created_at",
        header: "Sent At",
        sortable: true,
        render: (log) => (
          <span className="text-zinc-500 dark:text-zinc-400">
            {formatDate(log.created_at)}
          </span>
        ),
      },
      {
        key: "opened_at",
        header: "Opened",
        render: (log) => (
          <span className="text-zinc-500 dark:text-zinc-400">
            {log.opened_at ? formatDate(log.opened_at) : "--"}
          </span>
        ),
      },
      {
        key: "clicked_at",
        header: "Clicked",
        render: (log) => (
          <span className="text-zinc-500 dark:text-zinc-400">
            {log.clicked_at ? formatDate(log.clicked_at) : "--"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={logs}
      keyExtractor={(l) => l.id}
      isLoading={isLoading}
      emptyMessage="No emails sent yet. Messages will appear here once your automation begins."
    />
  );
}
