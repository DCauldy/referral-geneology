"use client";

import { XMarkIcon } from "@heroicons/react/20/solid";
import type { Tag } from "@/types/database";

interface FilterPill {
  key: string;
  label: string;
  params: string[]; // URL param keys to clear when removed
}

const ACTIVITY_LABELS: Record<string, string> = {
  "active_within:7": "Active 7d",
  "active_within:30": "Active 30d",
  "active_within:90": "Active 90d",
  "inactive_since:30": "Inactive 30d+",
  "inactive_since:90": "Inactive 90d+",
  "never:0": "Never contacted",
};

interface ActiveFilterPillsProps {
  searchParams: URLSearchParams;
  availableTags: Tag[];
  onRemove: (paramsToRemove: string[]) => void;
  onClearAll: () => void;
}

export function ActiveFilterPills({
  searchParams,
  availableTags,
  onRemove,
  onClearAll,
}: ActiveFilterPillsProps) {
  const pills: FilterPill[] = [];

  // Tags
  const tagParam = searchParams.get("tags");
  if (tagParam) {
    const tagIds = tagParam.split(",").filter(Boolean);
    const tagMode = searchParams.get("tagMode") || "or";
    const tagMap = new Map(availableTags.map((t) => [t.id, t.name]));
    const tagNames = tagIds
      .map((id) => tagMap.get(id))
      .filter(Boolean);
    if (tagNames.length > 0) {
      const modeLabel = tagIds.length > 1 ? ` (${tagMode === "and" ? "all" : "any"})` : "";
      pills.push({
        key: "tags",
        label: `Tags: ${tagNames.join(", ")}${modeLabel}`,
        params: ["tags", "tagMode"],
      });
    }
  }

  // Activity
  const activity = searchParams.get("activity");
  if (activity) {
    pills.push({
      key: "activity",
      label: ACTIVITY_LABELS[activity] || activity,
      params: ["activity"],
    });
  }

  // Generation
  const gen = searchParams.get("gen");
  if (gen) {
    pills.push({
      key: "gen",
      label: `Gen ${gen}`,
      params: ["gen"],
    });
  }

  // Location
  const location = searchParams.get("location");
  if (location) {
    pills.push({
      key: "location",
      label: `Location: ${location}`,
      params: ["location"],
    });
  }

  // Min Score
  const minScore = searchParams.get("minScore");
  if (minScore) {
    pills.push({
      key: "minScore",
      label: `Score >= ${minScore}`,
      params: ["minScore"],
    });
  }

  // Has Email
  const hasEmail = searchParams.get("hasEmail");
  if (hasEmail === "1") {
    pills.push({
      key: "hasEmail",
      label: "Has email",
      params: ["hasEmail"],
    });
  }

  // Has Phone
  const hasPhone = searchParams.get("hasPhone");
  if (hasPhone === "1") {
    pills.push({
      key: "hasPhone",
      label: "Has phone",
      params: ["hasPhone"],
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill) => (
        <span
          key={pill.key}
          className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-800 dark:text-primary-300"
        >
          {pill.label}
          <button
            type="button"
            onClick={() => onRemove(pill.params)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary-200 dark:hover:bg-primary-700"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
      {pills.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
