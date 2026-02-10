// @ts-nocheck
"use client";

import { useState, useMemo, Fragment } from "react";
import {
  Listbox as HeadlessListbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import {
  CheckIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils/cn";

export interface ListboxOption<T = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

// --- Single select ---
export interface ListboxSingleProps<T = string> {
  options: ListboxOption<T>[];
  value: T;
  onChange: (value: T) => void;
  multiple?: false;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

// --- Multi select ---
export interface ListboxMultiProps<T = string> {
  options: ListboxOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  multiple: true;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export type ListboxProps<T = string> =
  | ListboxSingleProps<T>
  | ListboxMultiProps<T>;

export function Listbox<T = string>({
  options,
  value,
  onChange,
  multiple,
  label,
  placeholder = "Select...",
  error,
  disabled,
  searchable,
  className,
}: ListboxProps<T>) {
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchable || !query) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query, searchable]);

  const displayValue = useMemo(() => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      const labels = value
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter(Boolean);
      return labels.join(", ");
    }
    const opt = options.find((o) => o.value === value);
    return opt?.label || placeholder;
  }, [value, options, multiple, placeholder]);

  // Type-safe props delegation
  const listboxProps = multiple
    ? { value: value as T[], onChange: onChange as (value: T[]) => void, multiple: true as const }
    : { value: value as T, onChange: onChange as (value: T) => void };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
      )}
      <HeadlessListbox
        disabled={disabled}
        {...listboxProps}
      >
        <div className="relative">
          <ListboxButton
            className={cn(
              "relative w-full cursor-pointer rounded-md border bg-white py-2 pl-3 pr-10 text-left text-sm shadow-sm transition-colors duration-150",
              "dark:bg-zinc-900 dark:text-zinc-100",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              error
                ? "border-red-500 focus:ring-red-500/30 dark:border-red-400"
                : "border-zinc-300 focus:border-primary-500 focus:ring-primary-500/30 dark:border-zinc-600 dark:focus:border-primary-400",
              "disabled:cursor-not-allowed disabled:opacity-50",
              (!value || (Array.isArray(value) && value.length === 0)) &&
                "text-zinc-400 dark:text-zinc-500"
            )}
          >
            <span className="block truncate">{displayValue}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-zinc-400"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>

          <ListboxOptions
            anchor="bottom start"
            transition
            className={cn(
              "z-50 mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-md bg-white py-1 text-sm shadow-lg",
              "ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700",
              "transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0",
              "focus:outline-none"
            )}
          >
            {searchable && (
              <div className="sticky top-0 z-10 bg-white px-2 pb-1 pt-1 dark:bg-zinc-800">
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-1.5 pl-8 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    placeholder="Search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <ListboxOption
                  key={String(option.value)}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "relative cursor-pointer select-none py-2 pl-10 pr-4 transition-colors duration-75",
                    "text-zinc-900 dark:text-zinc-100",
                    "data-[focus]:bg-primary-50 data-[focus]:text-primary-900 dark:data-[focus]:bg-primary-900/30 dark:data-[focus]:text-primary-300",
                    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                  )}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={cn(
                          "block truncate",
                          selected ? "font-semibold" : "font-normal"
                        )}
                      >
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {option.description}
                        </span>
                      )}
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                          <CheckIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))
            )}
          </ListboxOptions>
        </div>
      </HeadlessListbox>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
