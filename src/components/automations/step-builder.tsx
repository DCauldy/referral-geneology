"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { useToast } from "@/components/providers/toast-provider";
import { DELAY_UNITS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import type { AutomationStep } from "@/types/database";
import {
  EnvelopeIcon,
  ClockIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface StepBuilderProps {
  automationId: string;
  steps: AutomationStep[];
  onRefresh: () => void;
}

function formatDelayUnit(unit: string): string {
  return unit.charAt(0).toUpperCase() + unit.slice(1);
}

export function StepBuilder({
  automationId,
  steps,
  onRefresh,
}: StepBuilderProps) {
  const supabase = useSupabase();
  const { org } = useOrg();
  const toast = useToast();
  const [templates, setTemplates] = useState<
    { id: string; name: string; subject: string }[]
  >([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadTemplates() {
      if (!org) return;
      const { data } = await supabase
        .from("email_templates")
        .select("id, name, subject")
        .eq("org_id", org.id)
        .eq("is_archived", false)
        .order("name");
      setTemplates(data ?? []);
    }
    loadTemplates();
  }, [supabase, org]);

  async function addStep(type: "email" | "delay") {
    setIsSaving(true);
    setShowAddMenu(false);

    try {
      const newOrder = steps.length > 0 ? steps[steps.length - 1].step_order + 1 : 1;

      const payload: Record<string, unknown> = {
        automation_id: automationId,
        step_order: newOrder,
        step_type: type,
      };

      if (type === "delay") {
        payload.delay_amount = 1;
        payload.delay_unit = "days";
      }

      const { error } = await supabase
        .from("automation_steps")
        .insert(payload);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      toast.error(
        "Failed to add step",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStep(stepId: string, updates: Record<string, unknown>) {
    try {
      const { error } = await supabase
        .from("automation_steps")
        .update(updates)
        .eq("id", stepId);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      toast.error(
        "Failed to update step",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  async function deleteStep(stepId: string) {
    try {
      const { error } = await supabase
        .from("automation_steps")
        .delete()
        .eq("id", stepId);

      if (error) throw error;
      toast.success("Step removed", "The step has been removed from this sequence.");
      onRefresh();
    } catch (err) {
      toast.error(
        "Failed to delete step",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  async function moveStep(stepId: string, direction: "up" | "down") {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    if (stepIndex < 0) return;

    const swapIndex = direction === "up" ? stepIndex - 1 : stepIndex + 1;
    if (swapIndex < 0 || swapIndex >= steps.length) return;

    const currentStep = steps[stepIndex];
    const swapStep = steps[swapIndex];

    try {
      // Swap step_order values
      const { error: err1 } = await supabase
        .from("automation_steps")
        .update({ step_order: swapStep.step_order })
        .eq("id", currentStep.id);

      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from("automation_steps")
        .update({ step_order: currentStep.step_order })
        .eq("id", swapStep.id);

      if (err2) throw err2;

      onRefresh();
    } catch (err) {
      toast.error(
        "Failed to reorder steps",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  return (
    <div className="space-y-3">
      {steps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No steps yet. Add your first step to build this nurture sequence.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-start gap-3">
                {/* Step number + icon */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                    {index + 1}
                  </span>
                  {step.step_type === "email" ? (
                    <EnvelopeIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-amber-500" />
                  )}
                </div>

                {/* Step content */}
                <div className="min-w-0 flex-1">
                  {step.step_type === "email" ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        Send Email
                      </p>
                      <select
                        value={step.template_id || ""}
                        onChange={(e) =>
                          updateStep(step.id, {
                            template_id: e.target.value || null,
                          })
                        }
                        className="block w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                      >
                        <option value="">Select template...</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} — {t.subject}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Subject override (optional)"
                        value={step.subject_override || ""}
                        onChange={(e) =>
                          updateStep(step.id, {
                            subject_override: e.target.value || null,
                          })
                        }
                        className="block w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        Wait
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={step.delay_amount}
                          onChange={(e) =>
                            updateStep(step.id, {
                              delay_amount: parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-20 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                        />
                        <select
                          value={step.delay_unit}
                          onChange={(e) =>
                            updateStep(step.id, {
                              delay_unit: e.target.value,
                            })
                          }
                          className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                        >
                          {DELAY_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {formatDelayUnit(u)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => moveStep(step.id, "up")}
                    disabled={index === 0}
                    className={cn(
                      "rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
                      index === 0 && "cursor-not-allowed opacity-30"
                    )}
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveStep(step.id, "down")}
                    disabled={index === steps.length - 1}
                    className={cn(
                      "rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
                      index === steps.length - 1 &&
                        "cursor-not-allowed opacity-30"
                    )}
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteStep(step.id)}
                    className="rounded p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add step button */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
        >
          <PlusIcon className="h-4 w-4" />
          Add Step
        </button>

        {showAddMenu && (
          <div className="absolute left-0 z-10 mt-1 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            <button
              onClick={() => addStep("email")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <EnvelopeIcon className="h-4 w-4 text-blue-500" />
              Send Email
            </button>
            <button
              onClick={() => addStep("delay")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <ClockIcon className="h-4 w-4 text-amber-500" />
              Wait
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
