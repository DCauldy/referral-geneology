"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import type { Contact } from "@/types/database";

interface UseContactsOptions {
  search?: string;
  relationshipType?: string;
  industry?: string;
  companyId?: string;
  tagIds?: string[];
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

interface UseContactsReturn {
  contacts: Contact[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useContacts(options: UseContactsOptions = {}): UseContactsReturn {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    search,
    relationshipType,
    industry,
    companyId,
    sortKey = "created_at",
    sortDirection = "desc",
    page = 0,
    pageSize = 25,
  } = options;

  const fetchContacts = useCallback(async () => {
    if (!org) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("contacts")
        .select("*, company:companies(id, name)", { count: "exact" })
        .eq("org_id", org.id);

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      if (relationshipType) {
        query = query.eq("relationship_type", relationshipType);
      }

      if (industry) {
        query = query.eq("industry", industry);
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

      setContacts(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts");
    } finally {
      setIsLoading(false);
    }
  }, [
    supabase,
    org,
    search,
    relationshipType,
    industry,
    companyId,
    sortKey,
    sortDirection,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return { contacts, totalCount, isLoading, error, refresh: fetchContacts };
}

export function useContact(id: string) {
  const supabase = useSupabase();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContact = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("contacts")
        .select("*, company:companies(id, name)")
        .eq("id", id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setContact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contact");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, id]);

  useEffect(() => {
    if (id) fetchContact();
  }, [id, fetchContact]);

  return { contact, isLoading, error, refresh: fetchContact };
}
