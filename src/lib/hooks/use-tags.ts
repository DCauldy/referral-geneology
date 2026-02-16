"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import type { Tag, EntityType } from "@/types/database";

interface UseTagsReturn {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTags(entityType?: EntityType): UseTagsReturn {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    if (!org) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("tags")
        .select("*")
        .eq("org_id", org.id)
        .order("name");

      if (entityType) {
        query = query.eq("entity_type", entityType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setTags((data || []) as Tag[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tags");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, org, entityType]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { tags, isLoading, error, refresh: fetchTags };
}
