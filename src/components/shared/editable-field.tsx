"use client";

import { useState, useRef, useEffect } from "react";
import { PencilIcon } from "@heroicons/react/20/solid";
import { formatPhone } from "@/lib/utils/format";

interface EditableFieldProps {
  label: string;
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  type?: "text" | "email" | "tel" | "date" | "url" | "textarea" | "select";
  options?: { value: string; label: string }[];
  isLink?: boolean;
  tooltip?: string;
  readOnly?: boolean;
  placeholder?: string;
  formatDisplay?: (value: string) => string;
}

export function EditableField({
  label,
  value,
  onSave,
  type = "text",
  options,
  isLink = false,
  tooltip,
  readOnly = false,
  placeholder = "Click to add",
  formatDisplay,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement && type !== "date") {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  // Sync external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value ?? "");
    }
  }, [value, isEditing]);

  async function save() {
    const trimmed = editValue.trim();
    const newVal = trimmed || null;

    // Skip save if unchanged
    if (newVal === (value ?? null)) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newVal);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }

  function cancel() {
    setEditValue(value ?? "");
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault();
      save();
    }
  }

  // Resolve the stored value to its display representation
  const displayValue = (() => {
    if (!value) return null;
    if (type === "select" && options) {
      const match = options.find((o) => o.value === value);
      return match ? match.label : value;
    }
    if (type === "tel") {
      return formatPhone(value);
    }
    if (formatDisplay) {
      return formatDisplay(value);
    }
    return value;
  })();

  // --- Read-only mode ---
  if (readOnly) {
    return (
      <div className="flex items-center justify-between py-1">
        <dt className="flex items-center gap-1 text-sm text-primary-500 dark:text-primary-400">
          {label}
          {tooltip && <Tooltip text={tooltip} show={showTip} onToggle={setShowTip} label={label} />}
        </dt>
        <dd className="text-sm font-medium text-primary-800 dark:text-primary-100">
          {displayValue ?? <span className="text-primary-300 dark:text-primary-700">--</span>}
        </dd>
      </div>
    );
  }

  // --- Edit mode ---
  if (isEditing) {
    const inputClassName =
      "block w-full rounded-md border border-primary-400 bg-white px-2.5 py-1.5 text-sm text-primary-800 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-primary-600 dark:bg-primary-900/50 dark:text-primary-100";

    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <dt className="shrink-0 text-sm text-primary-500 dark:text-primary-400">
          {label}
        </dt>
        <dd className="relative min-w-0 flex-1 text-right">
          {type === "textarea" ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={save}
              onKeyDown={handleKeyDown}
              rows={3}
              className={inputClassName + " text-left"}
              disabled={isSaving}
            />
          ) : type === "select" && options ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                // Auto-save on select change
                const trimmed = e.target.value.trim();
                const newVal = trimmed || null;
                if (newVal !== (value ?? null)) {
                  setIsSaving(true);
                  onSave(newVal).finally(() => {
                    setIsSaving(false);
                    setIsEditing(false);
                  });
                } else {
                  setIsEditing(false);
                }
              }}
              onBlur={() => {
                // Small delay to let onChange fire first
                setTimeout(() => setIsEditing(false), 150);
              }}
              onKeyDown={handleKeyDown}
              className={inputClassName + " text-right"}
              disabled={isSaving}
            >
              <option value="">None</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={save}
              onKeyDown={handleKeyDown}
              className={inputClassName + " text-right"}
              disabled={isSaving}
            />
          )}
          {isSaving && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
            </div>
          )}
        </dd>
      </div>
    );
  }

  // --- Display mode ---
  return (
    <div
      className="group flex cursor-pointer items-center justify-between rounded-md py-1 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/30"
      onClick={() => setIsEditing(true)}
    >
      <dt className="flex items-center gap-1 text-sm text-primary-500 dark:text-primary-400">
        {label}
        {tooltip && <Tooltip text={tooltip} show={showTip} onToggle={setShowTip} label={label} />}
      </dt>
      <dd className="flex items-center gap-1.5 text-sm font-medium text-primary-800 dark:text-primary-100">
        {displayValue ? (
          isLink ? (
            <a
              href={displayValue}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-500 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {displayValue.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          ) : (
            displayValue
          )
        ) : (
          <span className="text-primary-300 dark:text-primary-700">{placeholder}</span>
        )}
        <PencilIcon className="h-3 w-3 shrink-0 text-primary-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-primary-700" />
      </dd>
    </div>
  );
}

function Tooltip({
  text,
  show,
  onToggle,
  label,
}: {
  text: string;
  show: boolean;
  onToggle: (v: boolean) => void;
  label: string;
}) {
  return (
    <span className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(!show); }}
        onMouseEnter={() => onToggle(true)}
        onMouseLeave={() => onToggle(false)}
        className="inline-flex cursor-help translate-y-px"
        aria-label={`Info: ${label}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" fill="#e0e9df" stroke="#284a2e" strokeWidth="1.8" />
          <line x1="12" y1="11" x2="12" y2="17" stroke="#2f5435" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="7.5" r="1.2" fill="#2f5435" />
        </svg>
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 z-50 mb-1.5 w-56 -translate-x-1/2 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs text-primary-700 shadow-lg dark:border-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
          {text}
        </div>
      )}
    </span>
  );
}
