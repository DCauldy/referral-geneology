"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CsvUpload } from "@/components/import-export/csv-upload";
import { ExportDialog } from "@/components/import-export/export-dialog";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function ImportExportSettingsPage() {
  const [showExport, setShowExport] = useState(false);
  const [entityType, setEntityType] = useState<"contact" | "company" | "deal">("contact");

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings/profile" },
          { label: "Import / Export" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Import / Export
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Import data from CSV files or export your data.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Import
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Upload a CSV file to import data.
          </p>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Entity type
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as "contact" | "company" | "deal")}
              className="mb-4 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="contact">Contacts</option>
              <option value="company">Companies</option>
              <option value="deal">Deals</option>
            </select>
            <CsvUpload entityType={entityType} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Export
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Download your data as CSV files.
          </p>
          <button
            onClick={() => setShowExport(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
