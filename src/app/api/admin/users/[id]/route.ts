import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const admin = createAdminClient();

    // Fetch all data in parallel
    const [
      profileResult,
      authResult,
      membershipsResult,
      directoryResult,
      trustResult,
    ] = await Promise.all([
      // User profile
      admin
        .from("user_profiles")
        .select(
          "id, full_name, avatar_url, phone, job_title, is_platform_admin, active_org_id, created_at, updated_at"
        )
        .eq("id", id)
        .single(),
      // Auth user (email + last sign in)
      admin.auth.admin.getUserById(id),
      // Org memberships
      admin
        .from("org_members")
        .select("org_id, role, organizations(name, plan, slug)")
        .eq("user_id", id),
      // Directory profile
      admin
        .from("directory_profiles")
        .select(
          "display_name, company_name, industry, location, bio, specialties, referral_categories, accepts_referrals, is_visible, avatar_url"
        )
        .eq("user_id", id)
        .maybeSingle(),
      // Trust score
      admin
        .from("exchange_trust_scores")
        .select(
          "trust_rating, acceptance_rate, conversion_rate, responsiveness, avg_response_hours, total_sent, sent_accepted, sent_declined, sent_converted, total_received, received_accepted, received_declined, received_converted"
        )
        .eq("user_id", id)
        .maybeSingle(),
    ]);

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get org stats for each membership
    const memberships = await Promise.all(
      (membershipsResult.data || []).map(async (m) => {
        const orgId = m.org_id;

        const [contactCount, dealCount, referralCount] = await Promise.all([
          admin
            .from("contacts")
            .select("id", { count: "exact", head: true })
            .eq("org_id", orgId),
          admin
            .from("deals")
            .select("id", { count: "exact", head: true })
            .eq("org_id", orgId),
          admin
            .from("referrals")
            .select("id", { count: "exact", head: true })
            .eq("org_id", orgId),
        ]);

        return {
          org_id: orgId,
          role: m.role,
          org_name:
            (m.organizations as unknown as { name: string })?.name ?? null,
          plan: (m.organizations as unknown as { plan: string })?.plan ?? null,
          slug: (m.organizations as unknown as { slug: string })?.slug ?? null,
          contacts: contactCount.count ?? 0,
          deals: dealCount.count ?? 0,
          referrals: referralCount.count ?? 0,
        };
      })
    );

    const authUser = authResult.data?.user;

    return NextResponse.json({
      ...profileResult.data,
      email: authUser?.email ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      memberships,
      directory_profile: directoryResult.data ?? null,
      trust_score: trustResult.data ?? null,
    });
  } catch (err) {
    console.error("Admin user detail error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
