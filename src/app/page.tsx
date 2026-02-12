"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQs", href: "#faqs" },
];

const features = [
  {
    name: "Referral Chain Tracking",
    description:
      "Map every referral from source to close. See full chains of who referred whom, with depth tracking and automatic root-referrer attribution.",
    icon: (
      <path
        d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    name: "Three Visualization Modes",
    description:
      "View your network as a hierarchical tree, an interactive force-directed graph, or a galaxy cluster grouped by industry, company, or relationship type.",
    icon: (
      <path
        d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    name: "Revenue-Linked Referrals",
    description:
      "Connect referrals directly to deals and revenue. Know exactly which relationships drive the most value, and track lifetime referral worth per contact.",
    icon: (
      <path
        d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    name: "AI-Powered Insights",
    description:
      "Let AI analyze your referral patterns, predict your top referrers, identify network gaps, and surface growth opportunities you would have missed.",
    icon: (
      <path
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    name: "Full Deal Pipeline",
    description:
      "Manage your entire deal flow with a customizable Kanban board. Drag deals between stages, track probability, and link every deal back to its referral source.",
    icon: (
      <path
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    name: "CSV Import & Export",
    description:
      "Bring your existing contacts, companies, and deals in via CSV with smart field mapping. Export any dataset, any time, with one click.",
    icon: (
      <path
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

const faqs = [
  {
    question: "What types of professionals is this built for?",
    answer:
      "Any professional who grows their business through referrals. Real estate agents, financial advisors, consultants, recruiters, lawyers, insurance agents, SaaS salespeople — if your revenue comes from who knows who, this is for you.",
  },
  {
    question: "How is this different from a CRM?",
    answer:
      "Traditional CRMs track contacts and deals, but they don't show you the interconnected web of how referrals chain through people over time. We visualize that genealogy — who referred whom, how deep the chains go, and which sources drive the most value — through interactive tree, network, and galaxy views.",
  },
  {
    question: "Can I import my existing contacts?",
    answer:
      "Yes. Upload a CSV of your contacts, companies, or deals and our smart field mapper will match your columns automatically. You can review everything before importing, and the system tracks progress in real time.",
  },
  {
    question: "What do the AI insights actually do?",
    answer:
      "Our AI analyzes your referral network to find patterns humans miss: which contacts are likely to become top referrers, where gaps exist in your network, which referral chains convert best, and specific opportunities to grow your pipeline. Insights refresh weekly with a confidence score.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your data is stored in a dedicated Supabase PostgreSQL database with row-level security policies. Every query is scoped to your organization. We never share your data, and you can export or delete everything at any time.",
  },
  {
    question: "Can my team collaborate on the same network?",
    answer:
      "On the Team plan, up to 25 users can share the same referral network with role-based access (owner, admin, member, viewer). Changes sync in real time so everyone sees the latest data.",
  },
];

const tiers = [
  {
    name: "Free",
    id: "tier-free",
    price: "$0",
    interval: "/month",
    description: "Get started with the basics. Perfect for solo professionals exploring their referral network.",
    features: [
      "Up to 50 contacts",
      "Tree visualization",
      "Basic deal tracking",
      "Contact & company management",
    ],
    cta: "Start free",
    href: "/register",
    featured: false,
  },
  {
    name: "Pro",
    id: "tier-pro",
    price: "$29",
    interval: "/month",
    description: "Unlock the full power of your referral network with all views and AI insights.",
    features: [
      "Unlimited contacts",
      "Tree, Network & Galaxy views",
      "Full deal pipeline",
      "AI-powered insights",
      "CSV import & export",
      "Priority support",
    ],
    cta: "Get started",
    href: "/register",
    featured: true,
  },
  {
    name: "Team",
    id: "tier-team",
    price: "$79",
    interval: "/month",
    description: "Collaborate across your entire team with shared networks and real-time sync.",
    features: [
      "Everything in Pro",
      "Up to 25 team members",
      "Role-based access control",
      "Real-time collaboration",
    ],
    cta: "Contact sales",
    href: "/register",
    featured: false,
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-6 first:pt-0 last:pb-0">
      <dt>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-start justify-between text-left text-gray-900 dark:text-white"
        >
          <span className="text-base/7 font-semibold">{question}</span>
          <span className="ml-6 flex h-7 items-center">
            {open ? (
              <MinusIcon className="size-6" />
            ) : (
              <PlusIcon className="size-6" />
            )}
          </span>
        </button>
      </dt>
      {open && (
        <dd className="mt-2 pr-12">
          <p className="text-base/7 text-gray-600 dark:text-gray-400">{answer}</p>
        </dd>
      )}
    </div>
  );
}

function ScreenshotCrossfade() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const windowH = window.innerHeight;
    // Start transition when container top reaches mid-screen,
    // complete when container bottom reaches mid-screen
    const scrollRange = rect.height - windowH;
    if (scrollRange <= 0) return;
    const rawProgress = (-rect.top) / scrollRange;
    setProgress(Math.max(0, Math.min(1, rawProgress)));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Map progress to crossfade: 0-0.3 = dashboard, 0.3-0.7 = transition, 0.7-1 = galaxy
  const fadeStart = 0.3;
  const fadeEnd = 0.7;
  const galaxyOpacity = progress <= fadeStart ? 0 : progress >= fadeEnd ? 1 : (progress - fadeStart) / (fadeEnd - fadeStart);
  const dashboardOpacity = 1 - galaxyOpacity;
  // Subtle scale: dashboard scales down slightly, galaxy scales up
  const dashboardScale = 1 - galaxyOpacity * 0.03;
  const galaxyScale = 0.97 + galaxyOpacity * 0.03;

  return (
    <div ref={containerRef} className="relative pt-16" style={{ height: "180vh" }}>
      <div className="sticky top-16 overflow-hidden sm:top-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative">
            {/* Dashboard screenshot */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              width={2432}
              height={1442}
              src="/hero-screenshot.svg"
              alt="Trellis dashboard view"
              className="w-full rounded-xl shadow-lg ring-1 ring-gray-900/10 dark:ring-white/10"
              style={{
                opacity: dashboardOpacity,
                transform: `scale(${dashboardScale})`,
                transition: "opacity 0.1s, transform 0.1s",
              }}
            />
            {/* Galaxy screenshot (overlaid) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              width={2432}
              height={1442}
              src="/galaxy-screenshot.svg"
              alt="Trellis galaxy visualization view"
              className="absolute inset-0 w-full rounded-xl shadow-lg ring-1 ring-gray-900/10 dark:ring-white/10"
              style={{
                opacity: galaxyOpacity,
                transform: `scale(${galaxyScale})`,
                transition: "opacity 0.1s, transform 0.1s",
              }}
            />
          </div>
          {/* Label indicating current view */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span
              className="text-sm font-medium transition-colors duration-300"
              style={{ color: dashboardOpacity > 0.5 ? "#2f5435" : "#96b593" }}
            >
              Dashboard
            </span>
            <div className="flex gap-1.5">
              <div
                className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                style={{ backgroundColor: progress < 0.5 ? "#2f5435" : "#c1d4bf" }}
              />
              <div
                className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                style={{ backgroundColor: progress >= 0.5 ? "#2f5435" : "#c1d4bf" }}
              />
            </div>
            <span
              className="text-sm font-medium transition-colors duration-300"
              style={{ color: galaxyOpacity > 0.5 ? "#2f5435" : "#96b593" }}
            >
              Galaxy View
            </span>
          </div>
          <div aria-hidden="true" className="relative">
            {/* <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-white from-40% pt-[18%] dark:from-stone-950" /> */}
            {/* Lattice overlay on gradient — uncomment to enable:
            <div
              className="absolute -inset-x-20 bottom-0 pt-[18%]"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, rgba(47,84,53,0.07) 0px, rgba(47,84,53,0.07) 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, rgba(47,84,53,0.07) 0px, rgba(47,84,53,0.07) 1px, transparent 1px, transparent 16px), linear-gradient(to top, white 40%, transparent)`,
              }}
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  function toggleDark() {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  }

  return (
    <div className="bg-white dark:bg-stone-950">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav
          aria-label="Global"
          className="flex items-center justify-between p-6 lg:px-8"
        >
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 flex items-center gap-2 p-1.5">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <line x1="24" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="24" y1="6" x2="36" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="18" x2="8" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="18" x2="24" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="36" y1="18" x2="24" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="36" y1="18" x2="40" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="8" y1="32" x2="16" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="24" y1="32" x2="16" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="24" y1="32" x2="32" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="40" y1="32" x2="32" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="18" x2="36" y2="18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                <line x1="8" y1="32" x2="40" y2="32" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                <circle cx="24" cy="6" r="3.5" fill="#5d8a5a" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="18" r="3" fill="#96b593" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="36" cy="18" r="3" fill="#96b593" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="32" r="2.5" fill="#c4a96a" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="24" cy="32" r="3" fill="#96b593" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="40" cy="32" r="2.5" fill="#c4a96a" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="16" cy="42" r="2.5" fill="#b09352" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="32" cy="42" r="2.5" fill="#b09352" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <span className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                Trellis
              </span>
            </Link>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-500 dark:text-gray-400"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="size-6" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm/6 font-semibold text-gray-900 hover:text-primary-700 dark:text-gray-200 dark:hover:text-primary-400"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-x-4">
            <button
              type="button"
              onClick={toggleDark}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              aria-label="Toggle dark mode"
            >
              {dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
            </button>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="text-sm/6 font-semibold text-gray-900 hover:text-primary-700 dark:text-white dark:hover:text-primary-400"
            >
              {isLoggedIn ? "Dashboard" : "Log in"} <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/20 dark:bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 dark:bg-stone-900 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:sm:ring-white/10">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="-m-1.5 flex items-center gap-2 p-1.5"
                >
                  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-600">
                    <line x1="24" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="24" y1="6" x2="36" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="12" y1="18" x2="8" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="12" y1="18" x2="24" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="36" y1="18" x2="24" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="36" y1="18" x2="40" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="8" y1="32" x2="16" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="24" y1="32" x2="16" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="24" y1="32" x2="32" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="40" y1="32" x2="32" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="12" y1="18" x2="36" y2="18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                    <line x1="8" y1="32" x2="40" y2="32" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                    <circle cx="24" cy="6" r="3.5" fill="#5d8a5a" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="18" r="3" fill="#96b593" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="36" cy="18" r="3" fill="#96b593" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="8" cy="32" r="2.5" fill="#c4a96a" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="24" cy="32" r="3" fill="#96b593" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="40" cy="32" r="2.5" fill="#c4a96a" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="16" cy="42" r="2.5" fill="#b09352" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="32" cy="42" r="2.5" fill="#b09352" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  <span className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                    Trellis
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleDark}
                    className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                    aria-label="Toggle dark mode"
                  >
                    {dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                  >
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon className="size-6" />
                  </button>
                </div>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10 dark:divide-gray-700">
                  <div className="space-y-2 py-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                  <div className="py-6">
                    <Link
                      href={isLoggedIn ? "/dashboard" : "/login"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      {isLoggedIn ? "Dashboard" : "Log in"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero section — matches Tailwind Plus template structure exactly */}
        <div className="relative isolate overflow-hidden pt-14 pb-16 sm:pb-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2830&q=80&blend=fff&sat=-100&exp=15&blend-mode=overlay"
            alt=""
            className="absolute inset-0 -z-10 size-full object-cover opacity-10 dark:opacity-5"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-300 to-primary-500 opacity-20 dark:opacity-15 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
              <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:text-gray-400 dark:ring-white/10 dark:hover:ring-white/20">
                  Now with AI-powered referral insights.{" "}
                  <Link
                    href="#features"
                    className="font-semibold text-primary-600 dark:text-primary-400"
                  >
                    <span aria-hidden="true" className="absolute inset-0" />
                    See what&apos;s new{" "}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 dark:text-white sm:text-7xl">
                  See your referral network{" "}
                  <span className="text-primary-600 dark:text-primary-400">come alive</span>
                </h1>
                <p className="mt-8 text-lg font-medium text-pretty text-gray-600 dark:text-gray-400 sm:text-xl/8">
                  Track who referred whom, visualize referral chains like a
                  family tree, link referrals to real revenue, and let AI
                  surface the insights that grow your network.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    href="/register"
                    className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    Start free
                  </Link>
                  <Link
                    href="#features"
                    className="text-sm/6 font-semibold text-gray-900 hover:text-primary-700 dark:text-gray-200 dark:hover:text-primary-400"
                  >
                    Learn more <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Logo cloud — replace these with your own logos */}
            <div className="mx-auto grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
              {[
                { name: "Partner 1", cols: "col-span-2 lg:col-span-1" },
                { name: "Partner 2", cols: "col-span-2 lg:col-span-1" },
                { name: "Partner 3", cols: "col-span-2 lg:col-span-1" },
                { name: "Partner 4", cols: "col-span-2 sm:col-start-2 lg:col-span-1" },
                { name: "Partner 5", cols: "col-span-2 col-start-2 sm:col-start-auto lg:col-span-1" },
              ].map((partner) => (
                <div
                  key={partner.name}
                  className={`${partner.cols} flex max-h-12 items-center justify-center`}
                >
                  <div className="rounded-lg border border-gray-200 bg-white/60 px-6 py-2.5 text-sm font-medium text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-500">
                    {partner.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary-400 to-primary-300 opacity-20 dark:opacity-15 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            />
          </div>
        </div>

        {/* Feature section — matches Tailwind Plus template: title → screenshot → features grid */}
        <div
          id="features"
          className="relative pt-32 pb-32 sm:pt-56 sm:pb-56"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, rgba(47,84,53,0.07) 0px, rgba(47,84,53,0.07) 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, rgba(47,84,53,0.07) 0px, rgba(47,84,53,0.07) 1px, transparent 1px, transparent 16px)`,
            backgroundAttachment: "fixed",
          }}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl sm:text-center">
              <h2 className="text-base/7 font-semibold text-primary-600 dark:text-primary-400">
                Everything you need
              </h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 dark:text-white sm:text-5xl sm:text-balance">
                Your referral network, finally visible
              </p>
              <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-400">
                Stop guessing which relationships drive your business. See the
                full picture — from first introduction to closed deal — in
                three interactive visualization modes.
              </p>
            </div>
          </div>
          <ScreenshotCrossfade />
          <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24 lg:px-8">
            <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base/7 text-gray-600 dark:text-gray-400 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-9">
                  <dt className="inline font-semibold text-gray-900 dark:text-white">
                    <svg
                      className="absolute top-1 left-1 size-5 text-primary-600 dark:text-primary-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      {feature.icon}
                    </svg>
                    {feature.name}.
                  </dt>{" "}
                  <dd className="inline">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Testimonial section */}
        <div className="relative z-10 mb-20 sm:mb-24 xl:mb-0">
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[calc(50%-36rem)] left-[calc(50%-19rem)] transform-gpu blur-3xl">
              <div
                style={{
                  clipPath:
                    "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                }}
                className="aspect-[1097/1023] w-[68.5625rem] bg-gradient-to-r from-primary-400 to-primary-600 opacity-25"
              />
            </div>
          </div>
          <div className="bg-gray-900 pb-20 sm:pb-24 xl:pb-0">
            <div className="mx-auto flex max-w-7xl flex-col items-center gap-x-8 gap-y-10 px-6 sm:gap-y-8 lg:px-8 xl:flex-row xl:items-stretch">
              <div className="-mt-8 w-full max-w-2xl xl:-mb-8 xl:w-96 xl:flex-none">
                <div className="relative aspect-[2/1] h-full md:-mx-8 xl:mx-0 xl:aspect-auto">
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600/20 to-primary-700/20">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-500/20 ring-1 ring-primary-500/40">
                        <svg
                          className="h-10 w-10 text-primary-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-primary-300/60">
                        Customer spotlight
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-2xl xl:max-w-none xl:flex-auto xl:px-16 xl:py-24">
                <figure className="relative isolate pt-6 sm:pt-12">
                  <svg
                    viewBox="0 0 162 128"
                    fill="none"
                    aria-hidden="true"
                    className="absolute top-0 left-0 -z-10 h-32 stroke-white/20"
                  >
                    <path
                      id="quote-path"
                      d="M65.5697 118.507L65.8918 118.89C68.9503 116.314 71.367 113.253 73.1386 109.71C74.9162 106.155 75.8027 102.28 75.8027 98.0919C75.8027 94.237 75.16 90.6155 73.8708 87.2314C72.5851 83.8565 70.8137 80.9533 68.553 78.5292C66.4529 76.1079 63.9476 74.2482 61.0407 72.9536C58.2795 71.4949 55.276 70.767 52.0386 70.767C48.9935 70.767 46.4686 71.1668 44.4872 71.9924L44.4799 71.9955L44.4726 71.9988C42.7101 72.7999 41.1035 73.6831 39.6544 74.6492C38.2407 75.5916 36.8279 76.455 35.4159 77.2394L35.4047 77.2457L35.3938 77.2525C34.2318 77.9787 32.6713 78.3634 30.6736 78.3634C29.0405 78.3634 27.5131 77.2868 26.1274 74.8257C24.7483 72.2185 24.0519 69.2166 24.0519 65.8071C24.0519 60.0311 25.3782 54.4081 28.0373 48.9335C30.703 43.4454 34.3114 38.345 38.8667 33.6325C43.5812 28.761 49.0045 24.5159 55.1389 20.8979C60.1667 18.0071 65.4966 15.6179 71.1291 13.7305C73.8626 12.8145 75.8027 10.2968 75.8027 7.38572C75.8027 3.6497 72.6341 0.62247 68.8814 1.1527C61.1635 2.2432 53.7398 4.41426 46.6119 7.66522C37.5369 11.6459 29.5729 17.0612 22.7236 23.9105C16.0322 30.6019 10.618 38.4859 6.47981 47.558L6.47976 47.558L6.47682 47.5647C2.4901 56.6544 0.5 66.6148 0.5 77.4391C0.5 84.2996 1.61702 90.7679 3.85425 96.8404L3.8558 96.8445C6.08991 102.749 9.12394 108.02 12.959 112.654L12.959 112.654L12.9646 112.661C16.8027 117.138 21.2829 120.739 26.4034 123.459L26.4033 123.459L26.4144 123.465C31.5505 126.033 37.0873 127.316 43.0178 127.316C47.5035 127.316 51.6783 126.595 55.5376 125.148L55.5376 125.148L55.5477 125.144C59.5516 123.542 63.0052 121.456 65.9019 118.881L65.5697 118.507Z"
                    />
                    <use x="86" href="#quote-path" />
                  </svg>
                  <blockquote className="text-xl/8 font-semibold text-white sm:text-2xl/9">
                    <p>
                      &ldquo;I finally understand where my best deals come
                      from. The tree view showed me a referral chain four
                      people deep that generated over $200K in revenue — I
                      had no idea that connection existed.&rdquo;
                    </p>
                  </blockquote>
                  <figcaption className="mt-8 text-base">
                    <div className="font-semibold text-white">
                      Sarah Mitchell
                    </div>
                    <div className="mt-1 text-gray-400">
                      Commercial Real Estate Broker
                    </div>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing section */}
        <div id="pricing" className="relative isolate mt-32 px-6 sm:mt-56 lg:px-8">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary-300 to-primary-500 opacity-30"
            />
          </div>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base/7 font-semibold text-primary-600 dark:text-primary-400">
              Pricing
            </h2>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-balance text-gray-900 dark:text-white sm:text-5xl">
              Choose the right plan for&nbsp;you
            </p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg/8 text-pretty text-gray-600 dark:text-gray-400">
            Start free with the essentials. Upgrade when you need unlimited
            contacts, all visualization modes, and AI-powered insights.
          </p>
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-5xl lg:grid-cols-3">
            {tiers.map((tier, tierIdx) => (
              <div
                key={tier.id}
                className={
                  tier.featured
                    ? "relative z-10 rounded-3xl bg-gray-900 p-8 shadow-2xl ring-1 ring-gray-900/10 dark:bg-white/5 dark:ring-white/10 sm:p-10"
                    : `rounded-3xl bg-white/60 p-8 ring-1 ring-gray-900/10 dark:bg-stone-900/60 dark:ring-white/10 sm:p-10 ${
                        tierIdx === 0
                          ? "lg:rounded-r-none"
                          : "lg:rounded-l-none"
                      }`
                }
              >
                <h3
                  id={tier.id}
                  className={`text-base/7 font-semibold ${
                    tier.featured ? "text-primary-400" : "text-primary-600 dark:text-primary-400"
                  }`}
                >
                  {tier.name}
                </h3>
                <p className="mt-4 flex items-baseline gap-x-2">
                  <span
                    className={`text-5xl font-semibold tracking-tight ${
                      tier.featured ? "text-white" : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {tier.price}
                  </span>
                  <span
                    className={`text-base ${
                      tier.featured ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {tier.interval}
                  </span>
                </p>
                <p
                  className={`mt-6 text-base/7 ${
                    tier.featured ? "text-gray-300" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {tier.description}
                </p>
                <ul
                  role="list"
                  className={`mt-8 space-y-3 text-sm/6 sm:mt-10 ${
                    tier.featured ? "text-gray-300" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon
                        className={`h-6 w-5 flex-none ${
                          tier.featured
                            ? "text-primary-400"
                            : "text-primary-600 dark:text-primary-400"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  aria-describedby={tier.id}
                  className={`mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold shadow-xs sm:mt-10 ${
                    tier.featured
                      ? "bg-primary-500 text-white hover:bg-primary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                      : "text-primary-600 ring-1 ring-inset ring-primary-200 hover:ring-primary-300 dark:text-primary-400 dark:ring-primary-400/30 dark:hover:ring-primary-400/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ section */}
        <div id="faqs" className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Frequently asked questions
            </h2>
            <dl className="mt-16 divide-y divide-gray-900/10 dark:divide-white/10">
              {faqs.map((faq) => (
                <FAQItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </dl>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 sm:mt-56">
        <div className="mx-auto max-w-7xl border-t border-gray-200 px-6 py-16 dark:border-white/10 sm:py-24 lg:px-8 lg:py-32">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div>
              <div className="flex items-center gap-2">
                <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-600 dark:text-primary-400">
                  <line x1="24" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="24" y1="6" x2="36" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="12" y1="18" x2="8" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="12" y1="18" x2="24" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="36" y1="18" x2="24" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="36" y1="18" x2="40" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="8" y1="32" x2="16" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="24" y1="32" x2="16" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="24" y1="32" x2="32" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="40" y1="32" x2="32" y2="42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="12" y1="18" x2="36" y2="18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                  <line x1="8" y1="32" x2="40" y2="32" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                  <circle cx="24" cy="6" r="3.5" fill="#5d8a5a" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="18" r="3" fill="#96b593" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="36" cy="18" r="3" fill="#96b593" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8" cy="32" r="2.5" fill="#c4a96a" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="24" cy="32" r="3" fill="#96b593" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="40" cy="32" r="2.5" fill="#c4a96a" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="16" cy="42" r="2.5" fill="#b09352" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="32" cy="42" r="2.5" fill="#b09352" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                <span className="font-serif text-xl font-bold text-gray-900 dark:text-white">Trellis</span>
              </div>
              <p className="mt-4 text-sm/6 text-gray-600 dark:text-gray-400">&copy; 2026 Trellis. All rights reserved.</p>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Product</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link href="#features" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Features</Link>
                    </li>
                    <li>
                      <Link href="#pricing" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</Link>
                    </li>
                    <li>
                      <Link href="/register" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Get Started</Link>
                    </li>
                    <li>
                      <Link href="#faqs" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">FAQs</Link>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Support</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link href="/about" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">About</Link>
                    </li>
                    <li>
                      <Link href={isLoggedIn ? "/dashboard" : "/login"} className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{isLoggedIn ? "Dashboard" : "Sign In"}</Link>
                    </li>
                    <li>
                      <span className="text-sm/6 text-gray-600 dark:text-gray-400">Documentation</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Company</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link href="/about" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">About</Link>
                    </li>
                    <li>
                      <Link href="/brand" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Brand</Link>
                    </li>
                    <li>
                      <span className="text-sm/6 text-gray-600 dark:text-gray-400">Blog</span>
                    </li>
                    <li>
                      <span className="text-sm/6 text-gray-600 dark:text-gray-400">Careers</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Legal</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <span className="text-sm/6 text-gray-600 dark:text-gray-400">Terms of service</span>
                    </li>
                    <li>
                      <span className="text-sm/6 text-gray-600 dark:text-gray-400">Privacy policy</span>
                    </li>
                    <li>
                      <span className="text-sm/6 text-gray-600 dark:text-gray-400">License</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
