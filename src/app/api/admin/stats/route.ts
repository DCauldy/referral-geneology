import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // Verify the caller is a platform admin
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_platform_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client to bypass RLS for platform-wide queries
    const admin = createAdminClient();

    const [
      usersResult,
      orgsResult,
      contactsResult,
      referralsResult,
      dealsResult,
      wonDealsResult,
      recentUsersResult,
      activeOrgsResult,
    ] = await Promise.all([
      admin.from("user_profiles").select("id", { count: "exact", head: true }),
      admin.from("organizations").select("id, plan", { count: "exact" }),
      admin.from("contacts").select("id", { count: "exact", head: true }),
      admin.from("referrals").select("id", { count: "exact", head: true }),
      admin.from("deals").select("value"),
      admin.from("deals").select("value").eq("status", "won"),
      admin
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ),
      admin
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .gte(
          "updated_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

    // Calculate deal values
    const totalDealValue = (dealsResult.data || []).reduce(
      (sum, d) => sum + (d.value || 0),
      0
    );
    const wonRevenue = (wonDealsResult.data || []).reduce(
      (sum, d) => sum + (d.value || 0),
      0
    );

    // Calculate plan distribution
    const planCounts = { free: 0, pro: 0, team: 0 };
    for (const org of orgsResult.data || []) {
      const plan = org.plan as keyof typeof planCounts;
      if (plan in planCounts) planCounts[plan]++;
    }

    return NextResponse.json({
      totalUsers: usersResult.count ?? 0,
      totalOrgs: orgsResult.count ?? 0,
      totalContacts: contactsResult.count ?? 0,
      totalReferrals: referralsResult.count ?? 0,
      totalDeals: dealsResult.data?.length ?? 0,
      totalDealValue,
      wonRevenue,
      newUsersLast30d: recentUsersResult.count ?? 0,
      activeOrgsLast30d: activeOrgsResult.count ?? 0,
      planDistribution: planCounts,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
