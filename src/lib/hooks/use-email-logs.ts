"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import type { EmailLog, EmailLogStatus } from "@/types/database";

interface UseEmailLogsOptions {
  automationId?: string;
  contactId?: string;
  templateId?: string;
  status?: EmailLogStatus;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

interface UseEmailLogsReturn {
  logs: EmailLog[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEmailLogs(
  options: UseEmailLogsOptions = {}
): UseEmailLogsReturn {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    automationId,
    contactId,
    templateId,
    status,
    sortKey = "created_at",
    sortDirection = "desc",
    page = 0,
    pageSize = 25,
  } = options;

  const fetchLogs = useCallback(async () => {
    if (!org) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("email_logs")
        .select(
          "*, contact:contacts(id, first_name, last_name, email)",
          { count: "exact" }
        )
        .eq("org_id", org.id);

      if (automationId) {
        query = query.eq("automation_id", automationId);
      }

      if (contactId) {
        query = query.eq("contact_id", contactId);
      }

      if (templateId) {
        query = query.eq("template_id", templateId);
      }

      if (status) {
        query = query.eq("status", status);
      }

      query = query
        .order(sortKey, { ascending: sortDirection === "asc" })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setLogs((data || []) as unknown as EmailLog[]);
      setTotalCount(count || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch email logs"
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    supabase,
    org,
    automationId,
    contactId,
    templateId,
    status,
    sortKey,
    sortDirection,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, totalCount, isLoading, error, refresh: fetchLogs };
}
