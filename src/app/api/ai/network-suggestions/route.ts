import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCompletion } from "@/lib/ai/client";
import { SYSTEM_PROMPT, networkRecommendationPrompt } from "@/lib/ai/prompts";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check paid plan
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("active_org_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.active_org_id) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id, plan, industry")
      .eq("id", profile.active_org_id)
      .single();

    if (!org || org.plan === "free") {
      return NextResponse.json(
        { error: "Network suggestions require a paid plan" },
        { status: 403 }
      );
    }

    // Fetch user's directory profile
    const { data: dirProfile } = await supabase
      .from("directory_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch exchange history
    const { data: exchanges } = await supabase
      .from("referral_exchanges")
      .select("receiver_email, status, receiver_status, sender_user_id, receiver_user_id")
      .or(`sender_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch directory profiles (exclude self)
    const { data: directoryProfiles } = await supabase
      .from("directory_profiles")
      .select("user_id, display_name, company_name, industry, specialties, referral_categories")
      .eq("is_visible", true)
      .neq("user_id", user.id)
      .limit(50);

    // Fetch trust scores for directory profiles
    const profileUserIds = (directoryProfiles || []).map((p) => p.user_id);
    const trustMap = new Map<string, number>();
    if (profileUserIds.length > 0) {
      const { data: trustScores } = await supabase
        .from("exchange_trust_scores")
        .select("user_id, trust_rating")
        .in("user_id", profileUserIds);

      trustScores?.forEach((s) => {
        trustMap.set(s.user_id, Number(s.trust_rating));
      });
    }

    // Build prompt data
    const userProfileData = {
      name: profile.full_name || "User",
      industry: dirProfile?.industry || org.industry || "Unknown",
      specialties: dirProfile?.specialties || [],
      categories: dirProfile?.referral_categories || [],
    };

    const exchangeHistory = (exchanges || []).map((e) => ({
      partner_name: e.receiver_email || "Unknown",
      industry: "Unknown",
      status: e.status,
      converted: e.receiver_status === "converted",
    }));

    const dirProfilesForAI = (directoryProfiles || []).map((p) => ({
      user_id: p.user_id,
      name: p.display_name,
      company: p.company_name || "",
      industry: p.industry || "Unknown",
      specialties: p.specialties || [],
      categories: p.referral_categories || [],
      trust_rating: trustMap.get(p.user_id) || 0,
    }));

    if (dirProfilesForAI.length === 0) {
      return NextResponse.json({
        recommendations: [],
        network_insight: "The directory is still growing. Check back as more growers list themselves.",
      });
    }

    const prompt = networkRecommendationPrompt({
      userProfile: userProfileData,
      exchangeHistory,
      directoryProfiles: dirProfilesForAI,
    });

    const rawResponse = await generateCompletion({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1024,
      temperature: 0.5,
    });

    // Parse JSON from response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        recommendations: [],
        network_insight: "Unable to generate recommendations at this time.",
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      recommendations: parsed.recommendations || [],
      network_insight: parsed.network_insight || "",
    });
  } catch (err) {
    console.error("Network suggestions error:", err);
    return NextResponse.json(
      { error: "Failed to generate network suggestions" },
      { status: 500 }
    );
  }
}
