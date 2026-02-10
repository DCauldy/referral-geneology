"use client";

import { useState } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/20/solid";
import type { Tag } from "@/types/database";

interface TagInputProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onAddTag: (tag: Tag) => void;
  onRemoveTag: (tagId: string) => void;
  onCreateTag?: (name: string) => void;
  placeholder?: string;
}

export function TagInput({
  availableTags,
  selectedTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  placeholder = "Add tag...",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedIds = new Set(selectedTags.map((t) => t.id));
  const filteredTags = availableTags.filter(
    (t) =>
      !selectedIds.has(t.id) &&
      t.name.toLowerCase().includes(input.toLowerCase())
  );

  function handleAdd(tag: Tag) {
    onAddTag(tag);
    setInput("");
    setShowDropdown(false);
  }

  function handleCreate() {
    if (input.trim() && onCreateTag) {
      onCreateTag(input.trim());
      setInput("");
      setShowDropdown(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: tag.color + "20",
              color: tag.color,
            }}
          >
            {tag.name}
            <button
              onClick={() => onRemoveTag(tag.id)}
              className="hover:opacity-70"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="min-w-[80px] flex-1 border-0 bg-transparent p-0 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none dark:text-white"
        />
      </div>

      {showDropdown && (input || filteredTags.length > 0) && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {filteredTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleAdd(tag)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </button>
          ))}
          {input.trim() &&
            !filteredTags.some(
              (t) => t.name.toLowerCase() === input.toLowerCase()
            ) &&
            onCreateTag && (
              <button
                onClick={handleCreate}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-primary-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <PlusIcon className="h-3 w-3" />
                Create &ldquo;{input.trim()}&rdquo;
              </button>
            )}
        </div>
      )}
    </div>
  );
}

export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: tag.color + "20",
        color: tag.color,
      }}
    >
      {tag.name}
    </span>
  );
}
