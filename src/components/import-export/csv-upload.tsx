"use client";

import { useCallback, useState } from "react";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface CsvUploadProps {
  entityType: "contact" | "company" | "deal";
  onComplete?: () => void;
}

export function CsvUpload({ entityType, onComplete }: CsvUploadProps) {
  const { org } = useOrg();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "text/csv" || dropped?.name.endsWith(".csv")) {
      setFile(dropped);
    } else {
      toast.error("Please upload a CSV file");
    }
  }, [toast]);

  async function handleUpload() {
    if (!file || !org) return;

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("orgId", org.id);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Import failed");

      const result = await res.json();
      setProgress(100);

      toast.success(
        `Import complete`,
        `${result.processedRows} ${entityType}s imported, ${result.errorRows} errors`
      );

      setFile(null);
      onComplete?.();
    } catch {
      toast.error("Import failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-8 transition-colors hover:border-primary-500 dark:border-zinc-700 dark:hover:border-primary-500"
      >
        {file ? (
          <>
            <DocumentTextIcon className="mb-2 h-10 w-10 text-primary-500" />
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {file.name}
            </p>
            <p className="text-xs text-zinc-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={() => setFile(null)}
              className="mt-2 text-xs text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <ArrowUpTrayIcon className="mb-2 h-10 w-10 text-zinc-400" />
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Drop your CSV file here or{" "}
              <label className="cursor-pointer font-medium text-primary-600 hover:text-primary-500">
                browse
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              CSV files up to 5MB
            </p>
          </>
        )}
      </div>

      {/* Progress bar */}
      {isUploading && (
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Importing...</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload button */}
      {file && !isUploading && (
        <button
          onClick={handleUpload}
          className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          Import {entityType}s
        </button>
      )}
    </div>
  );
}
