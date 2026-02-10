"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSupabase } from "./supabase-provider";
import type { Organization, OrgMember, UserProfile } from "@/types/database";

interface OrgContextValue {
  org: Organization | null;
  membership: OrgMember | null;
  profile: UserProfile | null;
  isLoading: boolean;
  switchOrg: (orgId: string) => Promise<void>;
  refreshOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const [org, setOrg] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrgMember | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrg = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setOrg(null);
        setMembership(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      // Get user profile with active org
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!userProfile?.active_org_id) {
        setProfile(userProfile);
        setIsLoading(false);
        return;
      }

      setProfile(userProfile);

      // Get org details
      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", userProfile.active_org_id)
        .single();

      setOrg(orgData);

      // Get membership
      const { data: memberData } = await supabase
        .from("org_members")
        .select("*")
        .eq("org_id", userProfile.active_org_id)
        .eq("user_id", user.id)
        .single();

      setMembership(memberData);
    } catch (error) {
      console.error("Error loading org:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadOrg();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadOrg();
      } else {
        setOrg(null);
        setMembership(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadOrg]);

  const switchOrg = useCallback(
    async (orgId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_profiles")
        .update({ active_org_id: orgId })
        .eq("id", user.id);

      await loadOrg();
    },
    [supabase, loadOrg]
  );

  return (
    <OrgContext.Provider
      value={{
        org,
        membership,
        profile,
        isLoading,
        switchOrg,
        refreshOrg: loadOrg,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
