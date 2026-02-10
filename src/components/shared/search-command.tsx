"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  UsersIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";

interface SearchResult {
  id: string;
  type: "contact" | "company" | "deal";
  title: string;
  subtitle: string;
}

const typeIcons = {
  contact: UsersIcon,
  company: BuildingOffice2Icon,
  deal: CurrencyDollarIcon,
};

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useSupabase();
  const { org } = useOrg();

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim() || !org) {
        setResults([]);
        return;
      }

      setLoading(true);
      const searchResults: SearchResult[] = [];

      // Search contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email")
        .eq("org_id", org.id)
        .or(
          `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`
        )
        .limit(5);

      contacts?.forEach((c) => {
        searchResults.push({
          id: c.id,
          type: "contact",
          title: [c.first_name, c.last_name].filter(Boolean).join(" "),
          subtitle: c.email || "",
        });
      });

      // Search companies
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, industry")
        .eq("org_id", org.id)
        .ilike("name", `%${q}%`)
        .limit(5);

      companies?.forEach((c) => {
        searchResults.push({
          id: c.id,
          type: "company",
          title: c.name,
          subtitle: c.industry || "",
        });
      });

      // Search deals
      const { data: deals } = await supabase
        .from("deals")
        .select("id, name, value")
        .eq("org_id", org.id)
        .ilike("name", `%${q}%`)
        .limit(5);

      deals?.forEach((d) => {
        searchResults.push({
          id: d.id,
          type: "deal",
          title: d.name,
          subtitle: d.value ? `$${d.value.toLocaleString()}` : "",
        });
      });

      setResults(searchResults);
      setLoading(false);
    },
    [supabase, org]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    const routes = {
      contact: `/contacts/${result.id}`,
      company: `/companies/${result.id}`,
      deal: `/deals/${result.id}`,
    };
    router.push(routes[result.type]);
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-y-auto p-4 pt-[20vh]">
        <DialogPanel className="mx-auto max-w-xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-700">
            <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search contacts, companies, deals..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none dark:text-white"
              autoFocus
            />
            <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800">
              ESC
            </kbd>
          </div>

          {query && (
            <div className="max-h-80 overflow-y-auto p-2">
              {loading ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No results found
                </div>
              ) : (
                results.map((result) => {
                  const Icon = typeIcons[result.type];
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Icon className="h-5 w-5 text-zinc-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                          {result.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {result.subtitle}
                        </p>
                      </div>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 capitalize dark:bg-zinc-800">
                        {result.type}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
