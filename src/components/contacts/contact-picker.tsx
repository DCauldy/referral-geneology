"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { Avatar } from "@/components/catalyst/avatar";
import { cn } from "@/lib/utils/cn";
import { getInitials, getFullName } from "@/lib/utils/format";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";

interface ContactResult {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  profile_photo_url: string | null;
}

interface ContactPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  excludeIds?: string[];
  label?: string;
  error?: string;
  placeholder?: string;
}

export function ContactPicker({
  value,
  onChange,
  excludeIds = [],
  label,
  error,
  placeholder = "Search contacts...",
}: ContactPickerProps) {
  const supabase = useSupabase();
  const { org } = useOrg();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactResult[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch selected contact details on mount if value is set
  useEffect(() => {
    if (!value || !org) {
      setSelectedContact(null);
      return;
    }

    const fetchSelected = async () => {
      const { data } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email, profile_photo_url")
        .eq("id", value)
        .single();

      if (data) {
        setSelectedContact(data);
      }
    };

    fetchSelected();
  }, [value, org, supabase]);

  // Search contacts as user types
  const searchContacts = useCallback(
    async (searchQuery: string) => {
      if (!org || searchQuery.length < 1) {
        setResults([]);
        return;
      }

      setIsLoading(true);

      try {
        let q = supabase
          .from("contacts")
          .select("id, first_name, last_name, email, profile_photo_url")
          .eq("org_id", org.id)
          .or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
          )
          .limit(10);

        if (excludeIds.length > 0) {
          q = q.not("id", "in", `(${excludeIds.join(",")})`);
        }

        const { data } = await q;
        setResults(data || []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, org, excludeIds]
  );

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      searchContacts(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, searchContacts, isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectContact = (contact: ContactResult) => {
    setSelectedContact(contact);
    onChange(contact.id);
    setQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const clearSelection = () => {
    setSelectedContact(null);
    onChange(null);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          selectContact(results[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      {selectedContact ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border bg-white px-3 py-2 dark:bg-zinc-900",
            error
              ? "border-red-500 dark:border-red-400"
              : "border-zinc-300 dark:border-zinc-600"
          )}
        >
          <Avatar
            src={selectedContact.profile_photo_url}
            initials={getInitials(
              selectedContact.first_name,
              selectedContact.last_name ?? undefined
            )}
            size="xs"
          />
          <span className="flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">
            {getFullName(
              selectedContact.first_name,
              selectedContact.last_name ?? undefined
            )}
          </span>
          {selectedContact.email && (
            <span className="hidden truncate text-xs text-zinc-500 sm:inline dark:text-zinc-400">
              {selectedContact.email}
            </span>
          )}
          <button
            type="button"
            onClick={clearSelection}
            className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              setIsOpen(true);
              if (query.length >= 1) searchContacts(query);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "block w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 shadow-sm transition-colors duration-150",
              "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
              "dark:bg-zinc-900 dark:text-zinc-100",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              error
                ? "border-red-500 focus:ring-red-500/30 dark:border-red-400"
                : "border-zinc-300 focus:border-primary-500 focus:ring-primary-500/30 dark:border-zinc-600 dark:focus:border-primary-400"
            )}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedContact && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {isLoading ? (
            <div className="px-3 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {query.length < 1
                ? "Type to search contacts"
                : "No contacts found"}
            </div>
          ) : (
            <ul role="listbox" className="max-h-60 overflow-auto py-1">
              {results.map((contact, index) => (
                <li
                  key={contact.id}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm",
                    highlightedIndex === index
                      ? "bg-primary-50 text-primary-900 dark:bg-primary-900/20 dark:text-primary-100"
                      : "text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-700/50"
                  )}
                  onClick={() => selectContact(contact)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <Avatar
                    src={contact.profile_photo_url}
                    initials={getInitials(
                      contact.first_name,
                      contact.last_name ?? undefined
                    )}
                    size="xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {getFullName(
                        contact.first_name,
                        contact.last_name ?? undefined
                      )}
                    </p>
                    {contact.email && (
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {contact.email}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
