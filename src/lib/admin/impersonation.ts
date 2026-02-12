import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side check: returns true if the current user is a platform admin
 * viewing an org they don't own (i.e. impersonating).
 *
 * Use this to block writes that shouldn't happen during impersonation:
 * - External emails (exchange, automations)
 * - User-scoped awards (achievements, streaks)
 * - Bulk imports
 * - Directory profile changes
 */
export async function isImpersonating(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<boolean> {
  // Check if user is a platform admin
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_platform_admin")
    .eq("id", userId)
    .single();

  if (!profile?.is_platform_admin) return false;

  // Platform admin — check if they're the owner of this org
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle();

  // If they're not the owner, they're impersonating
  return !membership;
}
