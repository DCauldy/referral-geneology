import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isImpersonating } from "@/lib/admin/impersonation";
import type { EntityType } from "@/types/database";

interface CsvRow {
  [key: string]: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: CsvRow = {};

    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = values[j]?.trim() || "";
    }

    rows.push(row);
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  values.push(current);
  return values;
}

function mapContactRow(row: CsvRow) {
  return {
    first_name: row.first_name || row.firstName || row["First Name"] || "",
    last_name: row.last_name || row.lastName || row["Last Name"] || null,
    email: row.email || row.Email || null,
    phone: row.phone || row.Phone || null,
    job_title: row.job_title || row.jobTitle || row["Job Title"] || null,
    industry: row.industry || row.Industry || null,
    city: row.city || row.City || null,
    state_province: row.state || row.state_province || row.State || null,
    country: row.country || row.Country || null,
    linkedin_url: row.linkedin || row.linkedin_url || row.LinkedIn || null,
    website_url: row.website || row.website_url || row.Website || null,
    relationship_type: row.relationship_type || row.type || "contact",
    notes: row.notes || row.Notes || null,
  };
}

function mapCompanyRow(row: CsvRow) {
  return {
    name: row.name || row.Name || row.company || row.Company || "",
    industry: row.industry || row.Industry || null,
    website: row.website || row.Website || null,
    phone: row.phone || row.Phone || null,
    email: row.email || row.Email || null,
    city: row.city || row.City || null,
    state_province: row.state || row.state_province || row.State || null,
    country: row.country || row.Country || null,
    employee_count: row.employee_count
      ? parseInt(row.employee_count, 10) || null
      : null,
    description: row.description || row.Description || null,
  };
}

function mapDealRow(row: CsvRow) {
  return {
    name: row.name || row.Name || row.deal || row.Deal || "",
    value: row.value || row.Value ? parseFloat(row.value || row.Value) || null : null,
    currency: row.currency || row.Currency || "USD",
    deal_type: row.deal_type || row.type || "one_time",
    status: row.status || row.Status || "open",
    description: row.description || row.Description || null,
    expected_close_date:
      row.expected_close_date || row.close_date || row["Close Date"] || null,
  };
}

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

    // Block bulk imports during impersonation
    if (await isImpersonating(supabase, user.id, orgId)) {
      return NextResponse.json(
        { error: "Cannot import data while impersonating an organization" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = (formData.get("entity_type") as EntityType) || "contact";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are supported" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty or has no data rows" },
        { status: 400 }
      );
    }

    // Create import job record
    const { data: importJob, error: jobError } = await supabase
      .from("import_jobs")
      .insert({
        org_id: orgId,
        user_id: user.id,
        file_name: file.name,
        entity_type: entityType,
        status: "processing",
        total_rows: rows.length,
        processed_rows: 0,
        error_rows: 0,
        errors: [],
        field_mapping: {},
      })
      .select()
      .single();

    if (jobError || !importJob) {
      console.error("Failed to create import job:", jobError);
      return NextResponse.json(
        { error: "Failed to create import job" },
        { status: 500 }
      );
    }

    // Process rows in batches
    const BATCH_SIZE = 50;
    let processedRows = 0;
    let errorRows = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      try {
        let tableName: string;
        let mappedBatch: Record<string, unknown>[];

        switch (entityType) {
          case "contact":
            tableName = "contacts";
            mappedBatch = batch.map((row) => ({
              ...mapContactRow(row),
              org_id: orgId,
            }));
            // Filter out rows without first_name
            mappedBatch = mappedBatch.filter((r) => {
              if (!r.first_name) {
                errorRows++;
                errors.push({
                  row: i + mappedBatch.indexOf(r) + 2,
                  error: "Missing first_name",
                });
                return false;
              }
              return true;
            });
            break;

          case "company":
            tableName = "companies";
            mappedBatch = batch.map((row) => ({
              ...mapCompanyRow(row),
              org_id: orgId,
            }));
            // Filter out rows without name
            mappedBatch = mappedBatch.filter((r) => {
              if (!r.name) {
                errorRows++;
                errors.push({
                  row: i + mappedBatch.indexOf(r) + 2,
                  error: "Missing company name",
                });
                return false;
              }
              return true;
            });
            break;

          case "deal":
            tableName = "deals";
            mappedBatch = batch.map((row) => ({
              ...mapDealRow(row),
              org_id: orgId,
            }));
            // Filter out rows without name
            mappedBatch = mappedBatch.filter((r) => {
              if (!r.name) {
                errorRows++;
                errors.push({
                  row: i + mappedBatch.indexOf(r) + 2,
                  error: "Missing deal name",
                });
                return false;
              }
              return true;
            });
            break;

          default:
            return NextResponse.json(
              { error: `Unsupported entity type: ${entityType}` },
              { status: 400 }
            );
        }

        if (mappedBatch.length > 0) {
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(mappedBatch);

          if (insertError) {
            // If batch insert fails, try individual inserts
            for (let j = 0; j < mappedBatch.length; j++) {
              const { error: singleError } = await supabase
                .from(tableName)
                .insert(mappedBatch[j]);

              if (singleError) {
                errorRows++;
                errors.push({
                  row: i + j + 2,
                  error: singleError.message,
                });
              } else {
                processedRows++;
              }
            }
          } else {
            processedRows += mappedBatch.length;
          }
        }
      } catch (batchErr) {
        const batchCount = Math.min(BATCH_SIZE, rows.length - i);
        errorRows += batchCount;
        errors.push({
          row: i + 2,
          error: `Batch failed: ${batchErr instanceof Error ? batchErr.message : "Unknown error"}`,
        });
      }

      // Update import job progress
      await supabase
        .from("import_jobs")
        .update({
          processed_rows: processedRows,
          error_rows: errorRows,
          errors: errors.slice(-50), // Keep last 50 errors
          updated_at: new Date().toISOString(),
        })
        .eq("id", importJob.id);
    }

    // Finalize import job
    const finalStatus = errorRows === rows.length ? "failed" : "completed";

    await supabase
      .from("import_jobs")
      .update({
        status: finalStatus,
        processed_rows: processedRows,
        error_rows: errorRows,
        errors: errors.slice(-100),
        updated_at: new Date().toISOString(),
      })
      .eq("id", importJob.id);

    return NextResponse.json({
      job_id: importJob.id,
      status: finalStatus,
      total_rows: rows.length,
      processed_rows: processedRows,
      error_rows: errorRows,
      errors: errors.slice(0, 20),
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
