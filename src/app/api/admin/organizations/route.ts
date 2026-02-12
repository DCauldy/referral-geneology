import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = (page - 1) * limit;

    const admin = createAdminClient();

    let query = admin
      .from("organizations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: orgs, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich each org with stats
    const enrichedOrgs = await Promise.all(
      (orgs || []).map(async (org) => {
        const [memberResult, contactResult, dealResult] = await Promise.all([
          admin
            .from("org_members")
            .select("user_id, role", { count: "exact" })
            .eq("org_id", org.id),
          admin
            .from("contacts")
            .select("id", { count: "exact", head: true })
            .eq("org_id", org.id),
          admin.from("deals").select("value, status").eq("org_id", org.id),
        ]);

        const owner = (memberResult.data || []).find(
          (m) => m.role === "owner"
        );

        // Get owner profile name
        let ownerName: string | null = null;
        if (owner) {
          const { data: ownerProfile } = await admin
            .from("user_profiles")
            .select("full_name")
            .eq("id", owner.user_id)
            .single();
          ownerName = ownerProfile?.full_name ?? null;
        }

        const totalRevenue = (dealResult.data || [])
          .filter((d) => d.status === "won")
          .reduce((sum, d) => sum + (d.value || 0), 0);

        return {
          ...org,
          memberCount: memberResult.count ?? 0,
          contactCount: contactResult.count ?? 0,
          dealCount: dealResult.data?.length ?? 0,
          totalRevenue,
          ownerName,
        };
      })
    );

    return NextResponse.json({
      organizations: enrichedOrgs,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("Admin organizations error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
