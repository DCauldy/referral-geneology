"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import type { Contact, Tag } from "@/types/database";

interface UseContactsOptions {
  search?: string;
  relationshipType?: string;
  industry?: string;
  companyId?: string;
  /** Comma-joined tag IDs (e.g. "uuid1,uuid2") */
  tagFilter?: string;
  tagMode?: "or" | "and";
  /** Serialized activity preset (e.g. "active_within:30", "never:0") */
  activity?: string;
  generation?: string;
  location?: string;
  minScore?: number;
  hasEmail?: boolean;
  hasPhone?: boolean;
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
    tagFilter,
    tagMode = "or",
    activity,
    generation,
    location,
    minScore,
    hasEmail,
    hasPhone,
    sortKey = "created_at",
    sortDirection = "desc",
    page = 0,
    pageSize = 25,
  } = options;

  // Parse tag IDs from comma-joined string (stable primitive dep)
  const tagIds = useMemo(
    () => (tagFilter ? tagFilter.split(",").filter(Boolean) : []),
    [tagFilter]
  );

  // Parse activity filter from string (stable primitive dep)
  const activityFilter = useMemo(() => {
    if (!activity) return null;
    const [mode, daysStr] = activity.split(":");
    if (!mode || daysStr == null) return null;
    return {
      mode: mode as "active_within" | "inactive_since" | "never",
      days: parseInt(daysStr, 10),
    };
  }, [activity]);

  const fetchContacts = useCallback(async () => {
    if (!org) return;

    setIsLoading(true);
    setError(null);

    try {
      // --- Pre-query: resolve ID sets for tag and activity filters ---
      let tagFilterIds: string[] | null = null;
      let activityFilterIds: string[] | null = null;

      // Tag filter: query entity_tags to get matching contact IDs
      if (tagIds.length > 0) {
        if (tagMode === "and") {
          // AND mode: contacts that have ALL selected tags
          const { data: tagRows, error: tagError } = await supabase
            .from("entity_tags")
            .select("entity_id, tag_id")
            .eq("entity_type", "contact")
            .in("tag_id", tagIds);

          if (tagError) throw new Error(tagError.message);

          // Group by entity_id and keep only those with all tags
          const countMap = new Map<string, number>();
          for (const row of tagRows || []) {
            countMap.set(row.entity_id, (countMap.get(row.entity_id) || 0) + 1);
          }
          tagFilterIds = [];
          for (const [entityId, count] of countMap) {
            if (count >= tagIds.length) tagFilterIds.push(entityId);
          }
        } else {
          // OR mode: contacts that have ANY selected tag
          const { data: tagRows, error: tagError } = await supabase
            .from("entity_tags")
            .select("entity_id")
            .eq("entity_type", "contact")
            .in("tag_id", tagIds);

          if (tagError) throw new Error(tagError.message);

          tagFilterIds = [...new Set((tagRows || []).map((r) => r.entity_id))];
        }

        // If no contacts matched the tag filter, short-circuit
        if (tagFilterIds.length === 0) {
          setContacts([]);
          setTotalCount(0);
          setIsLoading(false);
          return;
        }
      }

      // Activity filter: call RPC to get matching contact IDs
      if (activityFilter) {
        const { data: activityIds, error: rpcError } = await supabase.rpc(
          "filter_contacts_by_activity",
          {
            p_org_id: org.id,
            p_mode: activityFilter.mode,
            p_days: activityFilter.days,
          }
        );

        if (rpcError) throw new Error(rpcError.message);

        activityFilterIds = (activityIds || []) as string[];

        if (activityFilterIds.length === 0) {
          setContacts([]);
          setTotalCount(0);
          setIsLoading(false);
          return;
        }
      }

      // Intersect tag + activity ID sets if both are present
      let filterIds: string[] | null = null;
      if (tagFilterIds && activityFilterIds) {
        const activitySet = new Set(activityFilterIds);
        filterIds = tagFilterIds.filter((id) => activitySet.has(id));
        if (filterIds.length === 0) {
          setContacts([]);
          setTotalCount(0);
          setIsLoading(false);
          return;
        }
      } else if (tagFilterIds) {
        filterIds = tagFilterIds;
      } else if (activityFilterIds) {
        filterIds = activityFilterIds;
      }

      // --- Main query ---
      let query = supabase
        .from("contacts")
        .select("*, company:companies(id, name)", { count: "exact" })
        .eq("org_id", org.id);

      // Apply pre-resolved ID filter
      if (filterIds) {
        query = query.in("id", filterIds);
      }

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

      // Generation filter
      if (generation) {
        if (generation === "4+") {
          query = query.gte("generation", 4);
        } else {
          query = query.eq("generation", parseInt(generation, 10));
        }
      }

      // Location filter (search city or state)
      if (location) {
        query = query.or(
          `city.ilike.%${location}%,state_province.ilike.%${location}%`
        );
      }

      // Min score filter
      if (minScore != null && minScore > 0) {
        query = query.gte("referral_score", minScore);
      }

      // Has email filter
      if (hasEmail) {
        query = query.not("email", "is", null);
      }

      // Has phone filter (checks both phone and mobile_phone)
      if (hasPhone) {
        query = query.or("phone.not.is.null,mobile_phone.not.is.null");
      }

      query = query
        .order(sortKey, { ascending: sortDirection === "asc" })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const contactsList = (data || []) as Contact[];

      // Batch-fetch tags for all contacts via polymorphic entity_tags junction
      if (contactsList.length > 0) {
        const ids = contactsList.map((c) => c.id);
        const { data: tagRows } = await supabase
          .from("entity_tags")
          .select("entity_id, tag:tags(*)")
          .eq("entity_type", "contact")
          .in("entity_id", ids);

        if (tagRows) {
          const tagsByContact = new Map<string, Tag[]>();
          for (const row of tagRows) {
            const tag = row.tag as unknown as Tag;
            if (!tag) continue;
            const list = tagsByContact.get(row.entity_id) || [];
            list.push(tag);
            tagsByContact.set(row.entity_id, list);
          }
          for (const contact of contactsList) {
            contact.tags = tagsByContact.get(contact.id) || [];
          }
        }
      }

      setContacts(contactsList);
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
    tagIds,
    tagMode,
    activityFilter,
    generation,
    location,
    minScore,
    hasEmail,
    hasPhone,
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

      // Fetch tags via polymorphic entity_tags junction
      const { data: tagRows } = await supabase
        .from("entity_tags")
        .select("tag:tags(*)")
        .eq("entity_type", "contact")
        .eq("entity_id", id);

      const contactData = data as Contact;
      contactData.tags = tagRows
        ? tagRows.map((r) => r.tag as unknown as Tag).filter(Boolean)
        : [];

      setContact(contactData);
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
