import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/trust-score?userId=xxx — get trust score for a user
// GET /api/trust-score?userIds=id1,id2,id3 — batch get trust scores
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");
  const userIds = searchParams.get("userIds");

  // Single user lookup
  if (userId) {
    const { data, error } = await supabase
      .from("exchange_trust_scores")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ score: data });
  }

  // Batch lookup
  if (userIds) {
    const ids = userIds.split(",").filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ scores: [] });
    }

    const { data, error } = await supabase
      .from("exchange_trust_scores")
      .select("*")
      .in("user_id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ scores: data || [] });
  }

  return NextResponse.json(
    { error: "Provide userId or userIds parameter" },
    { status: 400 }
  );
}
