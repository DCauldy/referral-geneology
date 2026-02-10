"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

const entityTypes = [
  { value: "contact", label: "Contacts" },
  { value: "company", label: "Companies" },
  { value: "deal", label: "Deals" },
  { value: "referral", label: "Referrals" },
];

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const { org } = useOrg();
  const toast = useToast();
  const [entityType, setEntityType] = useState("contact");
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (!org) return;

    setIsExporting(true);

    try {
      const res = await fetch(
        `/api/export?entityType=${entityType}&orgId=${org.id}`
      );

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entityType}s_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Export complete");
      onClose();
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
            Export Data
          </DialogTitle>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                What to export
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {entityTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
