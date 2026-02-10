import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EntityType } from "@/types/database";

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  const str = String(value);

  // If the value contains commas, quotes, or newlines, wrap it in quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function toCsv(
  headers: string[],
  rows: Array<Record<string, unknown>>
): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvValue(row[h])).join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}

export async function GET(request: NextRequest) {
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

    // Get user's active org
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("active_org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.active_org_id) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 400 }
      );
    }

    const orgId = profile.active_org_id;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const entityType = (searchParams.get("entity_type") as EntityType) || "contact";
    const format = searchParams.get("format") || "csv";

    if (format !== "csv") {
      return NextResponse.json(
        { error: "Only CSV format is supported" },
        { status: 400 }
      );
    }

    let csvContent: string;
    let fileName: string;

    switch (entityType) {
      case "contact": {
        const { data: contacts, error: fetchError } = await supabase
          .from("contacts")
          .select(
            "first_name, last_name, email, phone, mobile_phone, job_title, industry, city, state_province, country, linkedin_url, website_url, relationship_type, referral_score, lifetime_referral_value, notes, created_at"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false });

        if (fetchError) {
          return NextResponse.json(
            { error: "Failed to fetch contacts" },
            { status: 500 }
          );
        }

        const headers = [
          "first_name",
          "last_name",
          "email",
          "phone",
          "mobile_phone",
          "job_title",
          "industry",
          "city",
          "state_province",
          "country",
          "linkedin_url",
          "website_url",
          "relationship_type",
          "referral_score",
          "lifetime_referral_value",
          "notes",
          "created_at",
        ];

        csvContent = toCsv(headers, contacts || []);
        fileName = `contacts-export-${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }

      case "company": {
        const { data: companies, error: fetchError } = await supabase
          .from("companies")
          .select(
            "name, industry, website, phone, email, city, state_province, country, employee_count, annual_revenue, description, created_at"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false });

        if (fetchError) {
          return NextResponse.json(
            { error: "Failed to fetch companies" },
            { status: 500 }
          );
        }

        const headers = [
          "name",
          "industry",
          "website",
          "phone",
          "email",
          "city",
          "state_province",
          "country",
          "employee_count",
          "annual_revenue",
          "description",
          "created_at",
        ];

        csvContent = toCsv(headers, companies || []);
        fileName = `companies-export-${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }

      case "deal": {
        const { data: deals, error: fetchError } = await supabase
          .from("deals")
          .select(
            "name, value, currency, deal_type, status, probability, expected_close_date, actual_close_date, description, notes, created_at"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false });

        if (fetchError) {
          return NextResponse.json(
            { error: "Failed to fetch deals" },
            { status: 500 }
          );
        }

        const headers = [
          "name",
          "value",
          "currency",
          "deal_type",
          "status",
          "probability",
          "expected_close_date",
          "actual_close_date",
          "description",
          "notes",
          "created_at",
        ];

        csvContent = toCsv(headers, deals || []);
        fileName = `deals-export-${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported entity type: ${entityType}` },
          { status: 400 }
        );
    }

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
