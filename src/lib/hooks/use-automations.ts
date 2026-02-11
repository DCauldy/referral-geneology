"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import type { Automation, AutomationStatus } from "@/types/database";

interface UseAutomationsOptions {
  search?: string;
  status?: AutomationStatus;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

interface UseAutomationsReturn {
  automations: Automation[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAutomations(
  options: UseAutomationsOptions = {}
): UseAutomationsReturn {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    search,
    status,
    sortKey = "created_at",
    sortDirection = "desc",
    page = 0,
    pageSize = 25,
  } = options;

  const fetchAutomations = useCallback(async () => {
    if (!org) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("automations")
        .select(
          "*, steps:automation_steps(id), enrollments:automation_enrollments(id)",
          { count: "exact" }
        )
        .eq("org_id", org.id);

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%`
        );
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

      // Map joined counts
      const mapped = (data || []).map((a) => {
        const raw = a as unknown as {
          steps: { id: string }[];
          enrollments: { id: string }[];
          [key: string]: unknown;
        };
        return {
          ...a,
          steps: undefined,
          _enrollment_count: raw.enrollments?.length ?? 0,
          _step_count: raw.steps?.length ?? 0,
        } as Automation & { _step_count: number };
      });

      setAutomations(mapped);
      setTotalCount(count || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch automations"
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase, org, search, status, sortKey, sortDirection, page, pageSize]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  return {
    automations,
    totalCount,
    isLoading,
    error,
    refresh: fetchAutomations,
  };
}

export function useAutomation(id: string) {
  const supabase = useSupabase();
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("automations")
        .select(
          "*, steps:automation_steps(*, template:email_templates(id, name, subject))"
        )
        .eq("id", id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      // Sort steps by step_order
      const raw = data as unknown as Automation & {
        steps: (Automation["steps"] extends (infer T)[] | undefined ? T : never)[];
      };
      if (raw.steps) {
        raw.steps.sort((a, b) => a.step_order - b.step_order);
      }

      setAutomation(raw as unknown as Automation);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch automation"
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase, id]);

  useEffect(() => {
    if (id) fetchAutomation();
  }, [id, fetchAutomation]);

  return { automation, isLoading, error, refresh: fetchAutomation };
}
