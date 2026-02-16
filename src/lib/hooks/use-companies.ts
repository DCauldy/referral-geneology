"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import type { Company } from "@/types/database";

interface UseCompaniesOptions {
  search?: string;
  industry?: string;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export function useCompanies(options: UseCompaniesOptions = {}) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    search,
    industry,
    sortKey = "created_at",
    sortDirection = "desc",
    page = 0,
    pageSize = 25,
  } = options;

  const fetchCompanies = useCallback(async () => {
    if (!org) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("companies")
        .select("*, contacts(count)", { count: "exact" })
        .eq("org_id", org.id);

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (industry) {
        query = query.eq("industry", industry);
      }

      query = query
        .order(sortKey, { ascending: sortDirection === "asc" })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const mapped = (data || []).map((c: Record<string, unknown>) => {
        const contacts = c.contacts as { count: number }[] | undefined;
        return {
          ...c,
          _contact_count: contacts?.[0]?.count ?? 0,
        };
      }) as Company[];
      setCompanies(mapped);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch companies");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, org, search, industry, sortKey, sortDirection, page, pageSize]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return { companies, totalCount, isLoading, error, refresh: fetchCompanies };
}

export function useCompany(id: string) {
  const supabase = useSupabase();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setCompany(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch company");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, id]);

  useEffect(() => {
    if (id) fetchCompany();
  }, [id, fetchCompany]);

  return { company, isLoading, error, refresh: fetchCompany };
}
