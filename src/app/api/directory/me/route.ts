import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/directory/me — get current user's directory profile
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("directory_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

// PATCH /api/directory/me — create or update current user's directory profile
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    display_name,
    company_name,
    industry,
    location,
    bio,
    avatar_url,
    specialties,
    referral_categories,
    accepts_referrals,
    is_visible,
  } = body;

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("directory_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("directory_profiles")
      .update({
        display_name,
        company_name: company_name || null,
        industry: industry || null,
        location: location || null,
        bio: bio || null,
        avatar_url: avatar_url || null,
        specialties: specialties || [],
        referral_categories: referral_categories || [],
        accepts_referrals: accepts_referrals ?? true,
        is_visible: is_visible ?? false,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } else {
    // Create new
    const { data, error } = await supabase
      .from("directory_profiles")
      .insert({
        user_id: user.id,
        display_name: display_name || user.email?.split("@")[0] || "User",
        company_name: company_name || null,
        industry: industry || null,
        location: location || null,
        bio: bio || null,
        avatar_url: avatar_url || null,
        specialties: specialties || [],
        referral_categories: referral_categories || [],
        accepts_referrals: accepts_referrals ?? true,
        is_visible: is_visible ?? false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data }, { status: 201 });
  }
}
