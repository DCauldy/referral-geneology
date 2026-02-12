import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/achievements/check — triggers check_achievements() + update_user_streak()
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("active_org_id, is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.active_org_id) {
    return NextResponse.json({ error: "No active org" }, { status: 400 });
  }

  const orgId = profile.active_org_id;

  // Skip achievement checks for platform admins viewing another org
  // to prevent awarding achievements based on someone else's data
  if (profile.is_platform_admin) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .single();

    // If the admin is only in this org as an impersonation member (admin role
    // injected by the impersonate endpoint), skip the check
    if (!membership || membership.role === "admin") {
      // Verify they were an original member by checking if they're the owner
      const { count } = await supabase
        .from("org_members")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .eq("role", "owner");

      if (!count || count === 0) {
        return NextResponse.json({ newly_unlocked: [], streak_updated: false });
      }
    }
  }

  // Run both RPCs in parallel
  const [achievementRes, streakRes] = await Promise.all([
    supabase.rpc("check_achievements", {
      target_user_id: user.id,
      target_org_id: orgId,
    }),
    supabase.rpc("update_user_streak", {
      target_user_id: user.id,
      target_org_id: orgId,
    }),
  ]);

  if (achievementRes.error) {
    return NextResponse.json(
      { error: achievementRes.error.message },
      { status: 500 }
    );
  }

  // Mark newly unlocked as notified
  const newlyUnlocked = achievementRes.data || [];

  if (Array.isArray(newlyUnlocked) && newlyUnlocked.length > 0) {
    await supabase
      .from("user_achievements")
      .update({ notified: true })
      .eq("user_id", user.id)
      .eq("notified", false);
  }

  return NextResponse.json({
    newly_unlocked: newlyUnlocked,
    streak_updated: !streakRes.error,
  });
}
