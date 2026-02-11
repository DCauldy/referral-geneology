"use client";

import { useCallback, useEffect, useState } from "react";
import type { DirectoryProfile } from "@/types/database";

interface DirectorySearchParams {
  search?: string;
  industry?: string;
  location?: string;
  specialty?: string;
  page?: number;
}

interface DirectoryResult {
  profiles: DirectoryProfile[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function useDirectory(params: DirectorySearchParams = {}) {
  const [data, setData] = useState<DirectoryResult>({
    profiles: [],
    total: 0,
    page: 1,
    perPage: 24,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set("search", params.search);
      if (params.industry) searchParams.set("industry", params.industry);
      if (params.location) searchParams.set("location", params.location);
      if (params.specialty) searchParams.set("specialty", params.specialty);
      if (params.page) searchParams.set("page", String(params.page));

      const res = await fetch(`/api/directory?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch directory");
      const json = await res.json();
      setData(json);
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
    }
  }, [params.search, params.industry, params.location, params.specialty, params.page]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { ...data, isLoading, refresh: fetchProfiles };
}

export function useMyDirectoryProfile() {
  const [profile, setProfile] = useState<DirectoryProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/directory/me");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const json = await res.json();
        setProfile(json.profile);
      } catch {
        // Non-critical
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const saveProfile = useCallback(async (data: Partial<DirectoryProfile>) => {
    const res = await fetch("/api/directory/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Failed to save profile");
    }
    const json = await res.json();
    setProfile(json.profile);
    return json.profile;
  }, []);

  return { profile, isLoading, saveProfile };
}
