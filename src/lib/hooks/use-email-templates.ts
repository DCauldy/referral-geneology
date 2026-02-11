"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import type { EmailTemplate } from "@/types/database";

interface UseEmailTemplatesOptions {
  search?: string;
  showArchived?: boolean;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

interface UseEmailTemplatesReturn {
  templates: EmailTemplate[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEmailTemplates(
  options: UseEmailTemplatesOptions = {}
): UseEmailTemplatesReturn {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    search,
    showArchived = false,
    sortKey = "created_at",
    sortDirection = "desc",
    page = 0,
    pageSize = 25,
  } = options;

  const fetchTemplates = useCallback(async () => {
    if (!org) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("email_templates")
        .select("*", { count: "exact" })
        .eq("org_id", org.id);

      if (!showArchived) {
        query = query.eq("is_archived", false);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,subject.ilike.%${search}%`
        );
      }

      query = query
        .order(sortKey, { ascending: sortDirection === "asc" })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setTemplates(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates"
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase, org, search, showArchived, sortKey, sortDirection, page, pageSize]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, totalCount, isLoading, error, refresh: fetchTemplates };
}

export function useEmailTemplate(id: string) {
  const supabase = useSupabase();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setTemplate(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch template"
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase, id]);

  useEffect(() => {
    if (id) fetchTemplate();
  }, [id, fetchTemplate]);

  return { template, isLoading, error, refresh: fetchTemplate };
}
