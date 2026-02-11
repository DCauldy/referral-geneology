import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/directory — list visible directory profiles with search/filter
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const industry = searchParams.get("industry") || "";
  const location = searchParams.get("location") || "";
  const specialty = searchParams.get("specialty") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = 24;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("directory_profiles")
    .select("*", { count: "exact" })
    .eq("is_visible", true)
    .order("display_name", { ascending: true })
    .range(offset, offset + perPage - 1);

  // Text search
  if (search) {
    query = query.or(
      `display_name.ilike.%${search}%,company_name.ilike.%${search}%`
    );
  }

  // Industry filter
  if (industry) {
    query = query.eq("industry", industry);
  }

  // Location filter
  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  // Specialty filter (array contains)
  if (specialty) {
    query = query.contains("specialties", [specialty]);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profiles: data || [],
    total: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage),
  });
}
