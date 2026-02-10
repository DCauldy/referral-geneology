import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCompletion } from "@/lib/ai/client";
import {
  SYSTEM_PROMPT,
  referralPatternPrompt,
} from "@/lib/ai/prompts";
import type { InsightType } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { org_id } = body;

    if (!org_id) {
      return NextResponse.json(
        { error: "org_id is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this org
    const { data: membership } = await supabase
      .from("org_members")
      .select("id")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch contacts for the org
    const { data: contacts } = await supabase
      .from("contacts")
      .select(
        "first_name, last_name, referral_score, lifetime_referral_value, industry"
      )
      .eq("org_id", org_id)
      .limit(100);

    // Fetch referrals for the org
    const { data: referrals } = await supabase
      .from("referrals")
      .select(
        "referrer:contacts!referrals_referrer_id_fkey(first_name, last_name), referred:contacts!referrals_referred_id_fkey(first_name, last_name), referral_value, referral_date, referral_type"
      )
      .eq("org_id", org_id)
      .limit(100);

    // Fetch deals for the org
    const { data: deals } = await supabase
      .from("deals")
      .select("name, value, status, contact:contacts(first_name, last_name)")
      .eq("org_id", org_id)
      .limit(100);

    // Format data for the AI prompt
    const formattedContacts = (contacts || []).map((c) => ({
      name: [c.first_name, c.last_name].filter(Boolean).join(" "),
      referralCount: c.referral_score || 0,
      referralValue: c.lifetime_referral_value || 0,
      industry: c.industry || "Unknown",
    }));

    const formattedReferrals = (referrals || []).map((r) => {
      const referrer = r.referrer as unknown as { first_name: string; last_name: string | null } | null;
      const referred = r.referred as unknown as { first_name: string; last_name: string | null } | null;
      return {
        from: referrer
          ? [referrer.first_name, referrer.last_name].filter(Boolean).join(" ")
          : "Unknown",
        to: referred
          ? [referred.first_name, referred.last_name].filter(Boolean).join(" ")
          : "Unknown",
        value: r.referral_value || 0,
        date: r.referral_date || "",
        type: r.referral_type || "",
      };
    });

    const formattedDeals = (deals || []).map((d) => {
      const contact = d.contact as unknown as { first_name: string; last_name: string | null } | null;
      return {
        name: d.name,
        value: d.value || 0,
        status: d.status,
        referralSource: contact
          ? [contact.first_name, contact.last_name].filter(Boolean).join(" ")
          : "Unknown",
      };
    });

    // Generate AI insights
    const prompt = referralPatternPrompt({
      contacts: formattedContacts,
      referrals: formattedReferrals,
      deals: formattedDeals,
    });

    const response = await generateCompletion({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2048,
      temperature: 0.5,
    });

    // Parse the AI response
    let parsedInsights: {
      patterns?: Array<{ title: string; description: string; confidence: number }>;
      topReferrers?: Array<{ name: string; reason: string; projectedValue: number }>;
      networkGaps?: Array<{ description: string; recommendation: string }>;
      growthOpportunities?: Array<{ title: string; description: string; estimatedImpact: string }>;
    };

    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }
      parsedInsights = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Store insights in the database
    const insightsToStore: Array<{
      org_id: string;
      insight_type: InsightType;
      title: string;
      summary: string;
      details: Record<string, unknown>;
      confidence: number | null;
      is_dismissed: boolean;
      expires_at: string;
    }> = [];

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    if (parsedInsights.patterns) {
      for (const pattern of parsedInsights.patterns) {
        insightsToStore.push({
          org_id,
          insight_type: "referral_pattern",
          title: pattern.title,
          summary: pattern.description,
          details: { source: "ai_analysis", raw: pattern },
          confidence: pattern.confidence,
          is_dismissed: false,
          expires_at: expiresAt,
        });
      }
    }

    if (parsedInsights.topReferrers) {
      for (const referrer of parsedInsights.topReferrers) {
        insightsToStore.push({
          org_id,
          insight_type: "top_referrers",
          title: `Top Referrer: ${referrer.name}`,
          summary: referrer.reason,
          details: {
            source: "ai_analysis",
            projectedValue: referrer.projectedValue,
            raw: referrer,
          },
          confidence: null,
          is_dismissed: false,
          expires_at: expiresAt,
        });
      }
    }

    if (parsedInsights.networkGaps) {
      for (const gap of parsedInsights.networkGaps) {
        insightsToStore.push({
          org_id,
          insight_type: "network_gap",
          title: "Network Gap Identified",
          summary: gap.description,
          details: {
            source: "ai_analysis",
            recommendation: gap.recommendation,
            raw: gap,
          },
          confidence: null,
          is_dismissed: false,
          expires_at: expiresAt,
        });
      }
    }

    if (parsedInsights.growthOpportunities) {
      for (const opp of parsedInsights.growthOpportunities) {
        insightsToStore.push({
          org_id,
          insight_type: "growth_opportunity",
          title: opp.title,
          summary: opp.description,
          details: {
            source: "ai_analysis",
            estimatedImpact: opp.estimatedImpact,
            raw: opp,
          },
          confidence: null,
          is_dismissed: false,
          expires_at: expiresAt,
        });
      }
    }

    // Insert insights
    if (insightsToStore.length > 0) {
      const { error: insertError } = await supabase
        .from("ai_insights")
        .insert(insightsToStore);

      if (insertError) {
        console.error("Failed to store insights:", insertError);
        // Return insights even if storage fails
      }
    }

    return NextResponse.json({
      insights: insightsToStore,
      raw: parsedInsights,
    });
  } catch (err) {
    console.error("AI insights error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
