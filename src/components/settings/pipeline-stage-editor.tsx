"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import type { PipelineStage } from "@/types/database";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/utils/constants";

export function PipelineStageEditor() {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStages = useCallback(async () => {
    if (!org) return;

    const { data } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("org_id", org.id)
      .order("display_order");

    if (data && data.length > 0) {
      setStages(data);
    }
    setIsLoading(false);
  }, [supabase, org]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  async function initializeDefaults() {
    if (!org) return;

    setIsSaving(true);
    for (const stage of DEFAULT_PIPELINE_STAGES) {
      await supabase.from("pipeline_stages").insert({
        org_id: org.id,
        ...stage,
      });
    }
    await fetchStages();
    toast.success("Default pipeline stages created");
    setIsSaving(false);
  }

  function updateStage(index: number, updates: Partial<PipelineStage>) {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  }

  function moveStage(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stages.length) return;

    setStages((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy.map((s, i) => ({ ...s, display_order: i }));
    });
  }

  function addStage() {
    setStages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        org_id: org?.id || "",
        name: "New Stage",
        display_order: prev.length,
        color: "#94a3b8",
        is_won: false,
        is_lost: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  function removeStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveStages() {
    if (!org) return;

    setIsSaving(true);
    try {
      // Delete existing stages
      await supabase
        .from("pipeline_stages")
        .delete()
        .eq("org_id", org.id);

      // Insert updated stages
      for (let i = 0; i < stages.length; i++) {
        await supabase.from("pipeline_stages").insert({
          org_id: org.id,
          name: stages[i].name,
          display_order: i,
          color: stages[i].color,
          is_won: stages[i].is_won,
          is_lost: stages[i].is_lost,
        });
      }

      await fetchStages();
      toast.success("Pipeline stages saved");
    } catch {
      toast.error("Failed to save stages");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </div>;
  }

  if (stages.length === 0) {
    return (
      <div className="text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No pipeline stages configured yet.
        </p>
        <button
          onClick={initializeDefaults}
          disabled={isSaving}
          className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isSaving ? "Creating..." : "Create Default Stages"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <input
              type="color"
              value={stage.color}
              onChange={(e) => updateStage(index, { color: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border border-zinc-200"
            />
            <input
              type="text"
              value={stage.name}
              onChange={(e) => updateStage(index, { name: e.target.value })}
              className="flex-1 rounded-md border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
            />
            <label className="flex items-center gap-1 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={stage.is_won}
                onChange={(e) =>
                  updateStage(index, { is_won: e.target.checked, is_lost: false })
                }
                className="h-3 w-3 rounded border-zinc-300"
              />
              Won
            </label>
            <label className="flex items-center gap-1 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={stage.is_lost}
                onChange={(e) =>
                  updateStage(index, { is_lost: e.target.checked, is_won: false })
                }
                className="h-3 w-3 rounded border-zinc-300"
              />
              Lost
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveStage(index, -1)}
                disabled={index === 0}
                className="rounded p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
              >
                <ArrowUpIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => moveStage(index, 1)}
                disabled={index === stages.length - 1}
                className="rounded p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
              >
                <ArrowDownIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => removeStage(index)}
              className="rounded p-1 text-zinc-400 hover:text-red-500"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={addStage}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          <PlusIcon className="h-4 w-4" />
          Add Stage
        </button>
        <button
          onClick={saveStages}
          disabled={isSaving}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
