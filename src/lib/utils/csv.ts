export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function toCSV(
  headers: string[],
  rows: Record<string, unknown>[]
): string {
  const headerLine = headers.map(escapeCSVField).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCSVField(String(row[h] ?? ""))).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function autoDetectFieldMapping(
  csvHeaders: string[],
  entityType: string
): Record<string, string> {
  const mapping: Record<string, string> = {};

  const patterns: Record<string, string[]> = {
    first_name: ["first name", "first_name", "firstname", "given name"],
    last_name: ["last name", "last_name", "lastname", "surname", "family name"],
    email: ["email", "email address", "e-mail"],
    phone: ["phone", "phone number", "telephone", "tel"],
    company: ["company", "company name", "organization", "org"],
    job_title: ["title", "job title", "job_title", "position", "role"],
    industry: ["industry", "sector"],
    city: ["city", "town"],
    state_province: ["state", "province", "state_province", "region"],
    country: ["country", "nation"],
    website: ["website", "url", "web"],
    linkedin_url: ["linkedin", "linkedin url"],
    name: ["name", "company name", "deal name"],
    value: ["value", "amount", "deal value", "revenue"],
    description: ["description", "notes", "details"],
  };

  for (const csvHeader of csvHeaders) {
    const lower = csvHeader.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(patterns)) {
      if (aliases.includes(lower) || lower === field) {
        mapping[csvHeader] = field;
        break;
      }
    }
  }

  return mapping;
}
