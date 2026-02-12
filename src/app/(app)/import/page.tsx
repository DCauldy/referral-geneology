"use client";

import { useState } from "react";
import { CsvUpload } from "@/components/import-export/csv-upload";

const entityTypes = [
  { value: "contact" as const, label: "Contacts" },
  { value: "company" as const, label: "Companies" },
  { value: "deal" as const, label: "Deals" },
];

export default function ImportPage() {
  const [entityType, setEntityType] = useState<"contact" | "company" | "deal">("contact");

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Import Data
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Import contacts, companies, or deals from a CSV file.
      </p>

      <div className="mt-6 max-w-xl">
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            What are you importing?
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as "contact" | "company" | "deal")}
            className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            {entityTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <CsvUpload entityType={entityType} />
      </div>
    </div>
  );
}
