"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { DealList } from "@/components/deals/deal-list";
import { DealPipelineBoard } from "@/components/deals/deal-pipeline-board";

type ViewMode = "table" | "pipeline";

export default function DealsPage() {
  const [view, setView] = useState<ViewMode>("table");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Deals
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track and manage your deals and pipeline.
          </p>
        </div>
        <Link
          href="/deals/new"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          Add Deal
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
        <button
          onClick={() => setView("table")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            view === "table"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Table
        </button>
        <button
          onClick={() => setView("pipeline")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            view === "pipeline"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
