import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isImpersonating } from "@/lib/admin/impersonation";

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
    .select("active_org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.active_org_id) {
    return NextResponse.json({ error: "No active org" }, { status: 400 });
  }

  const orgId = profile.active_org_id;

  // Skip achievement checks during impersonation to prevent
  // awarding achievements based on another org's data
  if (await isImpersonating(supabase, user.id, orgId)) {
    return NextResponse.json({ newly_unlocked: [], streak_updated: false });
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
