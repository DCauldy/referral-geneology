"use client";

import { Suspense, useState } from "react";
import { DealList } from "@/components/deals/deal-list";
import { DealPipelineBoard } from "@/components/deals/deal-pipeline-board";

type ViewMode = "table" | "pipeline";

export default function DealsPage() {
  const [view, setView] = useState<ViewMode>("table");

  return (
    <div>
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
          Deals
        </h1>
        <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
          Track your deals and pipeline progress.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 p-1 dark:border-primary-700 dark:bg-primary-900/50">
        <button
          onClick={() => setView("table")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            view === "table"
              ? "bg-white text-primary-800 shadow-sm dark:bg-primary-800 dark:text-primary-100"
              : "text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200"
          }`}
        >
          Table
        </button>
        <button
          onClick={() => setView("pipeline")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            view === "pipeline"
              ? "bg-white text-primary-800 shadow-sm dark:bg-primary-800 dark:text-primary-100"
              : "text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200"
          }`}
        >
          Pipeline Board
        </button>
      </div>

      <div className="mt-6">
        <Suspense>
          {view === "table" ? <DealList /> : <DealPipelineBoard />}
        </Suspense>
      </div>
    </div>
  );
}
