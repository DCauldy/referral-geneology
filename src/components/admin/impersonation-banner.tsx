"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useOrg } from "@/components/providers/org-provider";

interface ImpersonationState {
  orgName: string;
  originalOrgId: string;
}

export function ImpersonationBanner() {
  const router = useRouter();
  const { refreshOrg } = useOrg();
  const [state, setState] = useState<ImpersonationState | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("impersonating_org");
    if (stored) {
      try {
        setState(JSON.parse(stored));
      } catch {
        localStorage.removeItem("impersonating_org");
      }
    }
  }, []);

  if (!state) return null;

  async function handleExit() {
    setExiting(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalOrgId: state!.originalOrgId }),
      });

      if (res.ok) {
        localStorage.removeItem("impersonating_org");
        setState(null);
        await refreshOrg();
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to exit impersonation:", err);
    } finally {
      setExiting(false);
    }
  }

  return (
    <div className="border-b border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/50">
      <div className="flex items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Viewing as <span className="font-bold">{state.orgName}</span>
          </p>
        </div>
        <button
          onClick={handleExit}
          disabled={exiting}
          className="flex items-center gap-1 rounded-md bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-300 disabled:opacity-50 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
        >
          <XMarkIcon className="size-4" />
          {exiting ? "Restoring..." : "Exit"}
        </button>
      </div>
    </div>
  );
}
