import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Parallel queries: achievements, streak, and progress counts
  const [achievementsRes, streakRes, ...countResults] = await Promise.all([
    supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false }),
    supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .maybeSingle(),
    // Progress counts for the UI
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("deals").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("deals").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "won"),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "converted"),
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("exchange_trust_scores").select("trust_rating").eq("user_id", user.id).maybeSingle(),
  ]);

  const [
    contactsRes,
    companiesRes,
    dealsRes,
    wonDealsRes,
    referralsRes,
    convertedReferralsRes,
    activitiesRes,
    trustRes,
  ] = countResults;

  // Sum won revenue
  const { data: wonDealsData } = await supabase
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
    trust_rating: trustRes.data?.trust_rating || 0,
    onboarding_completed: profile.onboarding_completed || false,
  };

  return NextResponse.json({
    achievements: achievementsRes.data || [],
    streak: streakRes.data || null,
    progress,
  });
}
