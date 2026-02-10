"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import type { Referral } from "@/types/database";

interface UseReferralsOptions {
  contactId?: string;
  status?: string;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export function useReferrals(options: UseReferralsOptions = {}) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    contactId,
    status,
    sortKey = "referral_date",
    sortDirection = "desc",
    page = 0,
    pageSize = 25,
  } = options;

  const fetchReferrals = useCallback(async () => {
    if (!org) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("referrals")
        .select(
          "*, referrer:contacts!referrals_referrer_id_fkey(id, first_name, last_name, email), referred:contacts!referrals_referred_id_fkey(id, first_name, last_name, email), deal:deals(id, name, value)",
          { count: "exact" }
        )
        .eq("org_id", org.id);

      if (contactId) {
        query = query.or(
          `referrer_id.eq.${contactId},referred_id.eq.${contactId}`
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

      setReferrals(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch referrals");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, org, contactId, status, sortKey, sortDirection, page, pageSize]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  return { referrals, totalCount, isLoading, error, refresh: fetchReferrals };
}

export function useReferralChain(contactId: string, direction: "upstream" | "downstream" = "downstream") {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [chain, setChain] = useState<Array<{
    contact_id: string;
    first_name: string;
    last_name: string | null;
    depth: number;
    path: string[];
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChain = useCallback(async () => {
    if (!org || !contactId) return;

    setIsLoading(true);

    try {
      const { data } = await supabase.rpc("get_referral_chain", {
        p_org_id: org.id,
        p_contact_id: contactId,
        p_direction: direction,
        p_max_depth: 10,
      });

      setChain(data || []);
    } catch (err) {
      console.error("Failed to fetch referral chain:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, org, contactId, direction]);

  useEffect(() => {
    fetchChain();
  }, [fetchChain]);

  return { chain, isLoading, refresh: fetchChain };
}
