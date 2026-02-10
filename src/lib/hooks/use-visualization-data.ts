"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import type { VisualizationNode, VisualizationEdge, VisualizationFilters } from "@/types/visualizations";
import { DEFAULT_FILTERS } from "@/types/visualizations";
import { getFullName } from "@/lib/utils/format";

export function useVisualizationData(filters: VisualizationFilters = DEFAULT_FILTERS) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const [nodes, setNodes] = useState<VisualizationNode[]>([]);
  const [edges, setEdges] = useState<VisualizationEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!org) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch contacts
      let contactQuery = supabase
        .from("contacts")
        .select("*, company:companies(name)")
        .eq("org_id", org.id);

      if (filters.relationshipTypes.length > 0) {
        contactQuery = contactQuery.in("relationship_type", filters.relationshipTypes);
      }
      if (filters.industries.length > 0) {
        contactQuery = contactQuery.in("industry", filters.industries);
      }
      if (filters.minReferralScore > 0) {
        contactQuery = contactQuery.gte("referral_score", filters.minReferralScore);
      }

      const { data: contacts, error: contactError } = await contactQuery;
      if (contactError) throw contactError;

      // Fetch referrals
      let referralQuery = supabase
        .from("referrals")
        .select("*, deal:deals(value)")
        .eq("org_id", org.id);

      if (filters.referralStatuses.length > 0) {
        referralQuery = referralQuery.in("status", filters.referralStatuses);
      }
      if (filters.dateRange.start) {
        referralQuery = referralQuery.gte("referral_date", filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        referralQuery = referralQuery.lte("referral_date", filters.dateRange.end);
      }

      const { data: referrals, error: referralError } = await referralQuery;
      if (referralError) throw referralError;

      // Fetch deal values per contact
      const { data: deals } = await supabase
        .from("deals")
        .select("contact_id, value, status")
        .eq("org_id", org.id);

      // Build lookup for deal values per contact
      const dealValueMap = new Map<string, number>();
      deals?.forEach((d) => {
        if (d.contact_id && d.value) {
          dealValueMap.set(
            d.contact_id,
            (dealValueMap.get(d.contact_id) || 0) + d.value
          );
        }
      });

      // Count referrals per contact
      const referralCountMap = new Map<string, number>();
      referrals?.forEach((r) => {
        referralCountMap.set(
          r.referrer_id,
          (referralCountMap.get(r.referrer_id) || 0) + 1
        );
      });

      // Build contact set that appears in referrals
      const contactsInReferrals = new Set<string>();
      referrals?.forEach((r) => {
        contactsInReferrals.add(r.referrer_id);
        contactsInReferrals.add(r.referred_id);
      });

      // Transform to visualization nodes (only include contacts that are in referrals, or all if no referrals)
      const vizNodes: VisualizationNode[] = (contacts || [])
        .filter((c) => referrals?.length === 0 || contactsInReferrals.has(c.id))
        .filter((c) => {
          if (filters.search) {
            const name = getFullName(c.first_name, c.last_name).toLowerCase();
            return name.includes(filters.search.toLowerCase());
          }
          return true;
        })
        .map((c) => ({
          id: c.id,
          label: getFullName(c.first_name, c.last_name),
          firstName: c.first_name,
          lastName: c.last_name,
          email: c.email,
          company: (c.company as { name: string } | null)?.name || null,
          industry: c.industry,
          relationshipType: c.relationship_type,
          referralScore: c.referral_score,
          lifetimeReferralValue: c.lifetime_referral_value,
          dealValue: dealValueMap.get(c.id) || 0,
          referralCount: referralCountMap.get(c.id) || 0,
          profilePhotoUrl: c.profile_photo_url,
          rating: c.rating,
          city: c.city,
          country: c.country,
        }));

      // Transform to visualization edges
      const nodeIds = new Set(vizNodes.map((n) => n.id));
      const vizEdges: VisualizationEdge[] = (referrals || [])
        .filter((r) => nodeIds.has(r.referrer_id) && nodeIds.has(r.referred_id))
        .map((r) => ({
          id: r.id,
          source: r.referrer_id,
          target: r.referred_id,
          referralType: r.referral_type,
          referralStatus: r.status,
          referralValue: r.referral_value,
          referralDate: r.referral_date,
          dealId: r.deal_id,
          dealValue: (r.deal as { value: number } | null)?.value || null,
        }));

      setNodes(vizNodes);
      setEdges(vizEdges);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch visualization data");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, org, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { nodes, edges, isLoading, error, refresh: fetchData };
}
