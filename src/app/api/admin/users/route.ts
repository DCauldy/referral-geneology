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

    // Get users with their org memberships
    let query = admin
      .from("user_profiles")
      .select(
        "id, full_name, avatar_url, phone, job_title, active_org_id, is_platform_admin, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike("full_name", `%${search}%`);
    }

    const { data: users, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each user, get their email from auth and org info
    const enrichedUsers = await Promise.all(
      (users || []).map(async (u) => {
        // Get auth user email
        const { data: authData } =
          await admin.auth.admin.getUserById(u.id);

        // Get org memberships
        const { data: memberships } = await admin
          .from("org_members")
          .select("org_id, role, organizations(name, plan)")
          .eq("user_id", u.id);

        return {
          ...u,
          email: authData?.user?.email ?? null,
          memberships: (memberships || []).map((m) => ({
            org_id: m.org_id,
            role: m.role,
            org_name: (m.organizations as unknown as { name: string })?.name ?? null,
            plan: (m.organizations as unknown as { plan: string })?.plan ?? null,
          })),
        };
      })
    );

    return NextResponse.json({
      users: enrichedUsers,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("Admin users error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
