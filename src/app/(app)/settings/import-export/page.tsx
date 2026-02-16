"use client";

import { useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";
import { CsvUpload } from "@/components/import-export/csv-upload";
import { ExportDialog } from "@/components/import-export/export-dialog";
import { useImpersonation } from "@/lib/hooks/use-impersonation";
import { ArrowDownTrayIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function ImportExportSettingsPage() {
  const [showExport, setShowExport] = useState(false);
  const [entityType, setEntityType] = useState<
    "contact" | "company" | "deal"
  >("contact");
  const { isImpersonating } = useImpersonation();

  if (isImpersonating) {
    return (
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        <SettingsSection
          title="Import / Export"
          description="Data import and export tools."
        >
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
            <ExclamationTriangleIcon className="size-5 shrink-0" />
            <p>Import and export are disabled during impersonation to protect organization data.</p>
          </div>
        </SettingsSection>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      <SettingsSection
        title="Import Data"
        description="Upload a CSV file to transplant data into your network."
      >
        <div className="grid max-w-lg gap-4">
          <div>
            <label htmlFor="entity_type" className={labelClassName}>
              Entity type
            </label>
            <select
              id="entity_type"
              value={entityType}
              onChange={(e) =>
                setEntityType(
                  e.target.value as "contact" | "company" | "deal"
                )
              }
              className={inputClassName}
            >
              <option value="contact">Contacts</option>
              <option value="company">Companies</option>
              <option value="deal">Deals</option>
            </select>
          </div>
          <CsvUpload entityType={entityType} />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Export Data"
        description="Download your data as CSV files for backup or analysis."
      >
        <div>
          <button
            onClick={() => setShowExport(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </SettingsSection>

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
