"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  UsersIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useOrg } from "@/components/providers/org-provider";
import { formatPhone, formatDate } from "@/lib/utils/format";

/* ───────── types ───────── */

interface SearchResult {
  id: string;
  type: "contact" | "company" | "deal";
  title: string;
  subtitle: string;
  data: Record<string, unknown>;
}

export interface SearchCommandRef {
  open: () => void;
}

/* ───────── icons per type ───────── */

const typeIcons = {
  contact: UsersIcon,
  company: BuildingOffice2Icon,
  deal: CurrencyDollarIcon,
};

const typeBadgeColors: Record<string, string> = {
  contact:
    "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300",
  company:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  deal: "bg-tan-100 text-tan-700 dark:bg-tan-900 dark:text-tan-300",
};

/* ───────── recent searches (localStorage) ───────── */

const RECENT_KEY = "trellis:recent-searches";
const MAX_RECENT = 5;

function getRecentSearches(): SearchResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(result: SearchResult) {
  const recent = getRecentSearches().filter(
    (r) => !(r.type === result.type && r.id === result.id)
  );
  recent.unshift(result);
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

/* ───────── component ───────── */

export const SearchCommand = forwardRef<SearchCommandRef>(
  function SearchCommand(_props, ref) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = useSupabase();
    const { org } = useOrg();

    useImperativeHandle(ref, () => ({ open: () => setOpen(true) }), []);

    // Load recent searches when opening
    useEffect(() => {
      if (open) {
        setRecentSearches(getRecentSearches());
        setQuery("");
        setResults([]);
        setActiveIndex(0);
      }
    }, [open]);

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

    /* ── search logic ── */
    const search = useCallback(
      async (q: string) => {
        if (!q.trim() || !org) {
          setResults([]);
          return;
        }

        setLoading(true);
        const all: SearchResult[] = [];

        // Contacts
        const { data: contacts } = await supabase
          .from("contacts")
          .select(
            "id, first_name, last_name, email, phone, job_title, company_id, linkedin_url, city, state_province, profile_photo_url, company:companies(name)"
          )
          .eq("org_id", org.id)
          .or(
            `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`
          )
          .limit(8);

        contacts?.forEach((c) => {
          all.push({
            id: c.id,
            type: "contact",
            title: [c.first_name, c.last_name].filter(Boolean).join(" "),
            subtitle: c.email || c.job_title || "",
            data: c as unknown as Record<string, unknown>,
          });
        });

        // Companies
        const { data: companies } = await supabase
          .from("companies")
          .select(
            "id, name, industry, website, phone, email, city, state_province, employee_count"
          )
          .eq("org_id", org.id)
          .ilike("name", `%${q}%`)
          .limit(8);

        companies?.forEach((c) => {
          all.push({
            id: c.id,
            type: "company",
            title: c.name,
            subtitle: c.industry || "",
            data: c as unknown as Record<string, unknown>,
          });
        });

        // Deals
        const { data: deals } = await supabase
          .from("deals")
          .select("id, name, value, status, deal_type, expected_close_date")
          .eq("org_id", org.id)
          .ilike("name", `%${q}%`)
          .limit(8);

        deals?.forEach((d) => {
          all.push({
            id: d.id,
            type: "deal",
            title: d.name,
            subtitle: d.value ? `$${Number(d.value).toLocaleString()}` : "",
            data: d as unknown as Record<string, unknown>,
          });
        });

        setResults(all);
        setActiveIndex(0);
        setLoading(false);
      },
      [supabase, org]
    );

    // Debounced search
    useEffect(() => {
      const timer = setTimeout(() => search(query), 250);
      return () => clearTimeout(timer);
    }, [query, search]);

    /* ── what to show in the list ── */
    const displayItems = useMemo(() => {
      if (query.trim()) return results;
      return recentSearches;
    }, [query, results, recentSearches]);

    const activeItem = displayItems[activeIndex] ?? null;

    /* ── navigation ── */
    function handleSelect(result: SearchResult) {
      saveRecentSearch(result);
      setOpen(false);
      setQuery("");
      const routes: Record<string, string> = {
        contact: `/contacts/${result.id}`,
        company: `/companies/${result.id}`,
        deal: `/deals/${result.id}`,
      };
      router.push(routes[result.type]);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < displayItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : displayItems.length - 1
        );
      } else if (e.key === "Enter" && activeItem) {
        e.preventDefault();
        handleSelect(activeItem);
      }
    }

    // Scroll active item into view
    useEffect(() => {
      const el = listRef.current?.querySelector(
        `[data-index="${activeIndex}"]`
      );
      el?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    return (
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-zinc-900/25 backdrop-blur-sm transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[enter]:ease-out data-[leave]:duration-200 data-[leave]:ease-in"
        />

        <div
          tabIndex={0}
          className="fixed inset-0 w-screen overflow-y-auto p-4 focus:outline-none sm:p-6 md:p-20"
        >
          <DialogPanel
            transition
            className="mx-auto max-w-3xl transform overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-300 data-[enter]:ease-out data-[leave]:duration-200 data-[leave]:ease-in dark:bg-zinc-900 dark:ring-white/10"
          >
            {/* Search input */}
            <div className="grid grid-cols-1">
              <input
                ref={inputRef}
                type="text"
                autoFocus
                placeholder="Search contacts, companies, deals..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="col-start-1 row-start-1 h-12 w-full border-0 bg-transparent pr-4 pl-11 text-base text-zinc-900 outline-hidden placeholder:text-zinc-400 focus:ring-0 sm:text-sm dark:text-white dark:placeholder:text-zinc-500"
              />
              <MagnifyingGlassIcon className="pointer-events-none col-start-1 row-start-1 ml-4 size-5 self-center text-zinc-400" />
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            {/* Body: list + preview */}
            <div className="flex divide-x divide-zinc-100 dark:divide-zinc-800">
              {/* Results list */}
              <div
                ref={listRef}
                className="max-h-96 min-w-0 flex-auto scroll-py-4 overflow-y-auto px-6 py-4"
              >
                {loading ? (
                  <div className="px-4 py-14 text-center text-sm text-zinc-500">
                    Searching...
                  </div>
                ) : displayItems.length === 0 && query.trim() ? (
                  <div className="px-4 py-14 text-center text-sm">
                    <UsersIcon className="mx-auto size-6 text-zinc-400" />
                    <p className="mt-4 font-semibold text-zinc-900 dark:text-white">
                      No results found
                    </p>
                    <p className="mt-2 text-zinc-500">
                      Try a different search term.
                    </p>
                  </div>
                ) : displayItems.length === 0 && !query.trim() ? (
                  <div className="px-4 py-14 text-center text-sm text-zinc-500">
                    Type to search contacts, companies, and deals.
                  </div>
                ) : (
                  <div className="-mx-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <h2 className="mx-2 mt-2 mb-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {query.trim() ? "Results" : "Recent"}
                    </h2>
                    {displayItems.map((item, index) => {
                      const Icon = typeIcons[item.type];
                      const isActive = index === activeIndex;
                      const photoUrl =
                        item.type === "contact"
                          ? (item.data.profile_photo_url as string | null)
                          : null;
                      const initials =
                        item.type === "contact"
                          ? [
                              s(item.data.first_name).charAt(0),
                              s(item.data.last_name).charAt(0),
                            ]
                              .filter(Boolean)
                              .join("")
                              .toUpperCase() || "?"
                          : null;
                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          data-index={index}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`group flex w-full cursor-default items-center rounded-md p-2 text-left select-none ${
                            isActive
                              ? "bg-primary-50 text-zinc-900 dark:bg-primary-950 dark:text-white"
                              : ""
                          }`}
                        >
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt=""
                              className="size-8 shrink-0 rounded-full object-cover ring-1 ring-black/5"
                            />
                          ) : initials ? (
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                isActive
                                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                              }`}
                            >
                              {initials}
                            </span>
                          ) : (
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                                isActive
                                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                              }`}
                            >
                              <Icon className="size-4" />
                            </span>
                          )}
                          <span className="ml-3 flex-auto truncate">
                            {item.title}
                          </span>
                          <span
                            className={`ml-3 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${typeBadgeColors[item.type]}`}
                          >
                            {item.type}
                          </span>
                          <ArrowsRightLeftIcon
                            className={`ml-2 size-4 flex-none text-zinc-400 ${
                              isActive ? "block" : "hidden"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Preview panel (sm+) */}
              {activeItem && (
                <div className="hidden h-96 w-1/2 flex-none flex-col divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800 sm:flex">
                  <PreviewPanel item={activeItem} onNavigate={handleSelect} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 border-t border-zinc-100 bg-zinc-50/80 px-6 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-300 bg-white px-1 py-0.5 font-mono text-[10px] dark:border-zinc-600 dark:bg-zinc-800">
                  &uarr;
                </kbd>
                <kbd className="rounded border border-zinc-300 bg-white px-1 py-0.5 font-mono text-[10px] dark:border-zinc-600 dark:bg-zinc-800">
                  &darr;
                </kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-600 dark:bg-zinc-800">
                  &crarr;
                </kbd>
                to open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-600 dark:bg-zinc-800">
                  esc
                </kbd>
                to close
              </span>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    );
  }
);

/* ───────── preview panel ───────── */

/** Safely cast unknown to string for rendering */
const s = (v: unknown): string => (v ? String(v) : "");

function PreviewPanel({
  item,
  onNavigate,
}: {
  item: SearchResult;
  onNavigate: (item: SearchResult) => void;
}) {
  const d = item.data;

  if (item.type === "contact") {
    const fullName = [d.first_name, d.last_name].filter(Boolean).join(" ");
    const initials = [s(d.first_name).charAt(0), s(d.last_name).charAt(0)]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";
    const location = [d.city, d.state_province].filter(Boolean).join(", ");
    const company = d.company as { name: string } | null;
    const companyName = company?.name || "";
    return (
      <>
        <div className="flex-none p-6 text-center">
          {d.profile_photo_url ? (
            <img
              src={s(d.profile_photo_url)}
              alt={fullName}
              className="mx-auto size-16 rounded-full object-cover ring-1 ring-black/5"
            />
          ) : (
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {initials}
            </div>
          )}
          <h2 className="mt-3 font-semibold text-zinc-900 dark:text-white">
            {fullName}
          </h2>
          {(d.job_title || companyName) ? (
            <p className="text-sm/6 text-zinc-500 dark:text-zinc-400">
              {[s(d.job_title), companyName].filter(Boolean).join(" at ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-auto flex-col justify-between p-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            {d.email ? (
              <>
                <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                  <EnvelopeIcon className="inline size-4 mr-1 -mt-0.5" />
                  Email
                </dt>
                <dd className="truncate">{s(d.email)}</dd>
              </>
            ) : null}
            {d.phone ? (
              <>
                <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                  <PhoneIcon className="inline size-4 mr-1 -mt-0.5" />
                  Phone
                </dt>
                <dd>{formatPhone(s(d.phone))}</dd>
              </>
            ) : null}
            {d.linkedin_url ? (
              <>
                <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                  <GlobeAltIcon className="inline size-4 mr-1 -mt-0.5" />
                  LinkedIn
                </dt>
                <dd className="truncate text-primary-600 dark:text-primary-400">
                  {s(d.linkedin_url)}
                </dd>
              </>
            ) : null}
            {location ? (
              <>
                <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                  <MapPinIcon className="inline size-4 mr-1 -mt-0.5" />
                  Location
                </dt>
                <dd>{location}</dd>
              </>
            ) : null}
          </dl>
          <button
            type="button"
            onClick={() => onNavigate(item)}
            className="mt-6 w-full rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            View Contact
          </button>
        </div>
      </>
    );
  }

  if (item.type === "company") {
    const location = [d.city, d.state_province].filter(Boolean).join(", ");
    return (
      <>
        <div className="flex-none p-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <BuildingOffice2Icon className="size-8" />
          </div>
          <h2 className="mt-3 font-semibold text-zinc-900 dark:text-white">
            {s(d.name)}
          </h2>
          {d.industry ? (
            <p className="text-sm/6 text-zinc-500 dark:text-zinc-400">
              {s(d.industry)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-auto flex-col justify-between p-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            {d.website ? (
              <>
                <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                  <GlobeAltIcon className="inline size-4 mr-1 -mt-0.5" />
                  Website
                </dt>
                <dd className="truncate text-primary-600 dark:text-primary-400">
                  {s(d.website)}
                </dd>
              </>
            ) : null}
            {d.phone ? (
              <>
                <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                  <PhoneIcon className="inline size-4 mr-1 -mt-0.5" />
                  Phone
                </dt>
                <dd>{formatPhone(s(d.phone))}</dd>
              </>
            ) : null}
            {d.email ? (
              <>
                <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                  <EnvelopeIcon className="inline size-4 mr-1 -mt-0.5" />
                  Email
                </dt>
                <dd className="truncate">{s(d.email)}</dd>
              </>
            ) : null}
            {location ? (
              <>
                <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                  <MapPinIcon className="inline size-4 mr-1 -mt-0.5" />
                  Location
                </dt>
                <dd>{location}</dd>
              </>
            ) : null}
            {d.employee_count ? (
              <>
                <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                  Employees
                </dt>
                <dd>{Number(d.employee_count).toLocaleString()}</dd>
              </>
            ) : null}
          </dl>
          <button
            type="button"
            onClick={() => onNavigate(item)}
            className="mt-6 w-full rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            View Company
          </button>
        </div>
      </>
    );
  }

  // Deal
  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    won: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    lost: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    abandoned:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };
  const status = s(d.status) || "open";

  return (
    <>
      <div className="flex-none p-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-tan-100 text-tan-700 dark:bg-tan-900 dark:text-tan-300">
          <CurrencyDollarIcon className="size-8" />
        </div>
        <h2 className="mt-3 font-semibold text-zinc-900 dark:text-white">
          {s(d.name)}
        </h2>
        <span
          className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[status] || statusColors.open}`}
        >
          {status}
        </span>
      </div>
      <div className="flex flex-auto flex-col justify-between p-6">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          {d.value ? (
            <>
              <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                Value
              </dt>
              <dd>${Number(d.value).toLocaleString()}</dd>
            </>
          ) : null}
          {d.deal_type ? (
            <>
              <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                Type
              </dt>
              <dd className="capitalize">
                {s(d.deal_type).replace("_", " ")}
              </dd>
            </>
          ) : null}
          {d.expected_close_date ? (
            <>
              <dt className="col-end-1 font-semibold text-zinc-900 dark:text-white">
                Expected Close
              </dt>
              <dd>
                {formatDate(s(d.expected_close_date))}
              </dd>
            </>
          ) : null}
        </dl>
        <button
          type="button"
          onClick={() => onNavigate(item)}
          className="mt-6 w-full rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          View Deal
        </button>
      </div>
    </>
  );
}
