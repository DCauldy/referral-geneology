import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isImpersonating } from "@/lib/admin/impersonation";

// GET /api/achievements — returns user's earned achievements, progress counts, and streak
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get active org
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("active_org_id, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.active_org_id) {
    return NextResponse.json({ error: "No active org" }, { status: 400 });
  }

  const orgId = profile.active_org_id;

  // When impersonating, show the org owner's achievements instead of the admin's
  // Use admin client to bypass RLS for reading another user's data
  let targetUserId = user.id;
  let targetOnboarding = profile.onboarding_completed;
  const impersonating = await isImpersonating(supabase, user.id, orgId);
  const queryClient = impersonating ? createAdminClient() : supabase;

  if (impersonating) {
    const { data: ownerMembership } = await queryClient
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("role", "owner")
      .single();

    if (ownerMembership) {
      targetUserId = ownerMembership.user_id;
      const { data: ownerProfile } = await queryClient
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("id", targetUserId)
        .single();
      targetOnboarding = ownerProfile?.onboarding_completed ?? false;
    }
  }

  // Parallel queries: achievements, streak, and progress counts
  const [achievementsRes, streakRes, ...countResults] = await Promise.all([
    queryClient
      .from("user_achievements")
      .select("*")
      .eq("user_id", targetUserId)
      .order("unlocked_at", { ascending: false }),
    queryClient
      .from("user_streaks")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("org_id", orgId)
      .maybeSingle(),
    // Progress counts for the UI
    queryClient.from("contacts").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    queryClient.from("companies").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    queryClient.from("deals").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    queryClient.from("deals").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "won"),
    queryClient.from("referrals").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    queryClient.from("referrals").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "converted"),
    queryClient.from("activities").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    queryClient.from("automations").select("id", { count: "exact", head: true }).eq("org_id", orgId).neq("status", "draft"),
    queryClient.from("ai_insights").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("is_dismissed", false),
    queryClient.from("exchange_trust_scores").select("trust_rating").eq("user_id", targetUserId).maybeSingle(),
  ]);

  const [
    contactsRes,
    companiesRes,
    dealsRes,
    wonDealsRes,
    referralsRes,
    convertedReferralsRes,
    activitiesRes,
    automationsRes,
    insightsRes,
    trustRes,
  ] = countResults;

  // Sum won revenue
  const { data: wonDealsData } = await queryClient
    .from("deals")
    .select("value")
    .eq("org_id", orgId)
    .eq("status", "won");

  const wonRevenue = (wonDealsData || []).reduce(
    (sum: number, d: { value: number | null }) => sum + (d.value || 0),
    0
  );

  const progress = {
    contacts: contactsRes.count || 0,
    companies: companiesRes.count || 0,
    deals: dealsRes.count || 0,
    won_deals: wonDealsRes.count || 0,
    won_revenue: wonRevenue,
    referrals: referralsRes.count || 0,
    converted_referrals: convertedReferralsRes.count || 0,
    activities: activitiesRes.count || 0,
    automations: automationsRes.count || 0,
    insights: insightsRes.count || 0,
    trust_rating: trustRes.data?.trust_rating || 0,
    onboarding_completed: targetOnboarding || false,
  };

  return NextResponse.json({
    achievements: achievementsRes.data || [],
    streak: streakRes.data || null,
    progress,
  });
}
