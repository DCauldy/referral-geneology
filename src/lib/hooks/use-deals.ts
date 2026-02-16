"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import type { Deal, PipelineStage } from "@/types/database";

interface UseDealsOptions {
  search?: string;
  status?: string;
  stageId?: string;
  contactId?: string;
  companyId?: string;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export function useDeals(options: UseDealsOptions = {}) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    search,
    status,
    stageId,
    contactId,
    companyId,
    sortKey = "created_at",
    sortDirection = "desc",
    page = 0,
    pageSize = 25,
  } = options;

  const fetchDeals = useCallback(async () => {
    if (!org) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("deals")
        .select(
          "*, contact:contacts(id, first_name, last_name), company:companies(id, name), stage:pipeline_stages(id, name, color, is_won, is_lost)",
          { count: "exact" }
        )
        .eq("org_id", org.id);

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      if (status) {
        query = query.eq("status", status);
      }
      if (stageId) {
        query = query.eq("stage_id", stageId);
      }
      if (contactId) {
        query = query.eq("contact_id", contactId);
      }
      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      query = query
        .order(sortKey, { ascending: sortDirection === "asc" })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setDeals(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deals");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, org, search, status, stageId, contactId, companyId, sortKey, sortDirection, page, pageSize]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return { deals, totalCount, isLoading, error, refresh: fetchDeals };
}

export function useDeal(id: string) {
  const supabase = useSupabase();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeal = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("deals")
        .select(
          "*, contact:contacts(id, first_name, last_name, email, phone, mobile_phone), company:companies(id, name), stage:pipeline_stages(id, name, color)"
        )
        .eq("id", id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setDeal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deal");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, id]);

  useEffect(() => {
    if (id) fetchDeal();
  }, [id, fetchDeal]);

  return { deal, isLoading, error, refresh: fetchDeal };
}

export function usePipelineStages() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStages = useCallback(async () => {
    if (!org) return;

    const { data } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("org_id", org.id)
      .order("display_order");

    setStages(data || []);
    setIsLoading(false);
  }, [supabase, org]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  return { stages, isLoading, refresh: fetchStages };
}
