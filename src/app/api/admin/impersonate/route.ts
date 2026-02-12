import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: Start impersonation — switch admin's active_org_id to target org
export async function POST(request: NextRequest) {
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
      .select("is_platform_admin, active_org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orgId } = await request.json();

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify target org exists
    const { data: targetOrg } = await admin
      .from("organizations")
      .select("id, name")
      .eq("id", orgId)
      .single();

    if (!targetOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Ensure admin is a member of the target org (add as viewer if not)
    const { data: existingMembership } = await admin
      .from("org_members")
      .select("id")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (!existingMembership) {
      await admin.from("org_members").insert({
        org_id: orgId,
        user_id: user.id,
        role: "admin",
      });
    }

    // Switch active org
    await admin
      .from("user_profiles")
      .update({ active_org_id: orgId })
      .eq("id", user.id);

    return NextResponse.json({
      originalOrgId: profile.active_org_id,
      impersonatingOrgId: orgId,
      orgName: targetOrg.name,
    });
  } catch (err) {
    console.error("Impersonate error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Stop impersonation — restore admin's original active_org_id
export async function DELETE(request: NextRequest) {
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

    const { originalOrgId } = await request.json();

    if (!originalOrgId) {
      return NextResponse.json(
        { error: "originalOrgId is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    await admin
      .from("user_profiles")
      .update({ active_org_id: originalOrgId })
      .eq("id", user.id);

    return NextResponse.json({ restored: true, activeOrgId: originalOrgId });
  } catch (err) {
    console.error("Stop impersonation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
