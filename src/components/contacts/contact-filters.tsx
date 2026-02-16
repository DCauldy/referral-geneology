"use client";

import { useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { useTags } from "@/lib/hooks/use-tags";
import { Listbox } from "@/components/catalyst/listbox";

const ACTIVITY_PRESETS = [
  { value: "", label: "Any" },
  { value: "active_within:7", label: "Active in 7 days" },
  { value: "active_within:30", label: "Active in 30 days" },
  { value: "active_within:90", label: "Active in 90 days" },
  { value: "inactive_since:30", label: "Inactive 30d+" },
  { value: "inactive_since:90", label: "Inactive 90d+" },
  { value: "never:0", label: "Never contacted" },
] as const;

const GENERATION_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "Gen 1" },
  { value: "2", label: "Gen 2" },
  { value: "3", label: "Gen 3" },
  { value: "4+", label: "Gen 4+" },
] as const;

interface FilterDraft {
  tags: string[];
  tagMode: "or" | "and";
  activity: string;
  gen: string;
  location: string;
  minScore: string;
  hasEmail: boolean;
  hasPhone: boolean;
}

interface ContactFiltersProps {
  currentParams: URLSearchParams;
  onApply: (updates: Record<string, string>) => void;
  activeCount: number;
}

function buildDraftFromParams(params: URLSearchParams): FilterDraft {
  return {
    tags: params.get("tags") ? params.get("tags")!.split(",") : [],
    tagMode: (params.get("tagMode") as "or" | "and") || "or",
    activity: params.get("activity") ?? "",
    gen: params.get("gen") ?? "",
    location: params.get("location") ?? "",
    minScore: params.get("minScore") ?? "",
    hasEmail: params.get("hasEmail") === "1",
    hasPhone: params.get("hasPhone") === "1",
  };
}

export function ContactFilters({
  currentParams,
  onApply,
  activeCount,
}: ContactFiltersProps) {
  const { tags: availableTags } = useTags("contact");
  const [draft, setDraft] = useState<FilterDraft>(() =>
    buildDraftFromParams(currentParams)
  );

  function handleOpen() {
    // Reset draft to current URL state when opening
    setDraft(buildDraftFromParams(currentParams));
  }

  function handleApply(close: () => void) {
    const updates: Record<string, string> = {
      tags: draft.tags.join(","),
      tagMode: draft.tags.length > 0 ? draft.tagMode : "",
      activity: draft.activity,
      gen: draft.gen,
      location: draft.location,
      minScore: draft.minScore,
      hasEmail: draft.hasEmail ? "1" : "",
      hasPhone: draft.hasPhone ? "1" : "",
    };
    onApply(updates);
    close();
  }

  function handleClear(close: () => void) {
    onApply({
      tags: "",
      tagMode: "",
      activity: "",
      gen: "",
      location: "",
      minScore: "",
      hasEmail: "",
      hasPhone: "",
    });
    close();
  }

  const tagOptions = availableTags.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const inputClass =
    "block w-full rounded-md border border-primary-200 px-3 py-1.5 text-sm text-primary-800 placeholder:text-primary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-primary-700 dark:bg-primary-900/50 dark:text-primary-100 dark:placeholder:text-primary-600";

  const labelClass =
    "block text-xs font-medium text-primary-600 dark:text-primary-400 mb-1";

  return (
    <Popover className="relative">
      {() => (
        <>
          <PopoverButton
            onClick={handleOpen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-800"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-semibold text-white">
                {activeCount}
              </span>
            )}
          </PopoverButton>

          <PopoverPanel
            anchor="bottom end"
            transition
            className="z-50 mt-2 w-80 rounded-lg border border-primary-200 bg-white p-4 shadow-xl dark:border-primary-700 dark:bg-zinc-900 transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            {({ close }) => (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary-800 dark:text-primary-200">
                  Filter Contacts
                </h3>

                {/* Tags */}
                <div>
                  <label className={labelClass}>Tags</label>
                  <Listbox
                    multiple
                    searchable
                    options={tagOptions}
                    value={draft.tags}
                    onChange={(value) =>
                      setDraft((d) => ({ ...d, tags: value }))
                    }
                    placeholder="Select tags..."
                  />
                  {draft.tags.length > 1 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs text-primary-500 dark:text-primary-400">
                        Match:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({ ...d, tagMode: "or" }))
                        }
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          draft.tagMode === "or"
                            ? "bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300"
                            : "text-primary-500 hover:text-primary-700 dark:text-primary-400"
                        }`}
                      >
                        Any
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({ ...d, tagMode: "and" }))
                        }
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          draft.tagMode === "and"
                            ? "bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300"
                            : "text-primary-500 hover:text-primary-700 dark:text-primary-400"
                        }`}
                      >
                        All
                      </button>
                    </div>
                  )}
                </div>

                {/* Last Activity */}
                <div>
                  <label className={labelClass}>Last Activity</label>
                  <select
                    value={draft.activity}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, activity: e.target.value }))
                    }
                    className={inputClass}
                  >
                    {ACTIVITY_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Generation */}
                <div>
                  <label className={labelClass}>Generation</label>
                  <select
                    value={draft.gen}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, gen: e.target.value }))
                    }
                    className={inputClass}
                  >
                    {GENERATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    type="text"
                    value={draft.location}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, location: e.target.value }))
                    }
                    placeholder="City or state..."
                    className={inputClass}
                  />
                </div>

                {/* Min Score */}
                <div>
                  <label className={labelClass}>Min Referral Score</label>
                  <input
                    type="number"
                    min="0"
                    value={draft.minScore}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, minScore: e.target.value }))
                    }
                    placeholder="0"
                    className={inputClass}
                  />
                </div>

                {/* Has Email */}
                <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                  <input
                    type="checkbox"
                    checked={draft.hasEmail}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, hasEmail: e.target.checked }))
                    }
                    className="rounded border-primary-300 text-primary-600 focus:ring-primary-500 dark:border-primary-600"
                  />
                  Has email address
                </label>

                {/* Has Phone */}
                <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                  <input
                    type="checkbox"
                    checked={draft.hasPhone}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, hasPhone: e.target.checked }))
                    }
                    className="rounded border-primary-300 text-primary-600 focus:ring-primary-500 dark:border-primary-600"
                  />
                  Has phone number
                </label>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-primary-100 pt-3 dark:border-primary-800">
                  <button
                    type="button"
                    onClick={() => handleClear(close)}
                    className="text-sm text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApply(close)}
                    className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
