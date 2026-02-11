"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import type { AutomationEnrollment, EnrollmentStatus } from "@/types/database";

interface UseAutomationEnrollmentsOptions {
  status?: EnrollmentStatus;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

interface UseAutomationEnrollmentsReturn {
  enrollments: AutomationEnrollment[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAutomationEnrollments(
  automationId: string,
  options: UseAutomationEnrollmentsOptions = {}
): UseAutomationEnrollmentsReturn {
  const supabase = useSupabase();
  const [enrollments, setEnrollments] = useState<AutomationEnrollment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    status,
    sortKey = "created_at",
    sortDirection = "desc",
    page = 0,
    pageSize = 25,
  } = options;

  const fetchEnrollments = useCallback(async () => {
    if (!automationId) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("automation_enrollments")
        .select(
          "*, contact:contacts(id, first_name, last_name, email, profile_photo_url)",
          { count: "exact" }
        )
        .eq("automation_id", automationId);

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

      setEnrollments((data || []) as unknown as AutomationEnrollment[]);
      setTotalCount(count || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch enrollments"
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase, automationId, status, sortKey, sortDirection, page, pageSize]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  return {
    enrollments,
    totalCount,
    isLoading,
    error,
    refresh: fetchEnrollments,
  };
}

export function useContactEnrollments(contactId: string) {
  const supabase = useSupabase();
  const [enrollments, setEnrollments] = useState<AutomationEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    if (!contactId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("automation_enrollments")
        .select("*, automation:automations(id, name, status)")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setEnrollments((data || []) as unknown as AutomationEnrollment[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch enrollments"
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase, contactId]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  return { enrollments, isLoading, error, refresh: fetchEnrollments };
}
