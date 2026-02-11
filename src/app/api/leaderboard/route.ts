import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/leaderboard?scope=org|directory
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = request.nextUrl.searchParams.get("scope") || "directory";

  // Check plan
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("active_org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.active_org_id) {
    return NextResponse.json({ error: "No active org" }, { status: 400 });
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, plan")
    .eq("id", profile.active_org_id)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  }

  // Paid plan required for leaderboard
  if (org.plan === "free") {
    return NextResponse.json(
      { error: "Upgrade to a paid plan to access the leaderboard" },
      { status: 403 }
    );
  }

  // Team plan required for org scope
  if (scope === "org" && org.plan !== "team") {
    return NextResponse.json(
      { error: "Team plan required for org leaderboard" },
      { status: 403 }
    );
  }

  if (scope === "org") {
    const { data, error } = await supabase.rpc("get_org_leaderboard", {
      target_org_id: org.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      leaderboard: data || [],
      scope: "org",
      current_user_id: user.id,
    });
  }

  // Directory scope
  const { data, error } = await supabase.rpc("get_directory_leaderboard", {
    limit_count: 50,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    leaderboard: data || [],
    scope: "directory",
    current_user_id: user.id,
  });
}
