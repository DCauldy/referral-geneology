"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

/* ─────────────────────────────────────────────
   Brand Tokens
   ───────────────────────────────────────────── */
const C = {
  green50: "#f2f5f1",
  green100: "#e0e9df",
  green200: "#c1d4bf",
  green300: "#96b593",
  green400: "#5d8a5a",
  green500: "#2f5435",
  green600: "#284a2e",
  green700: "#213d26",
  green800: "#1a311e",
  green900: "#142617",
  green950: "#0a130c",
  tan50: "#faf8f3",
  tan100: "#f3efe4",
  tan200: "#e6ddc8",
  tan300: "#d4c49f",
  tan400: "#c4a96a",
  tan500: "#b09352",
  tan600: "#96793e",
  tan700: "#7a6133",
  tan800: "#614d2a",
  white: "#ffffff",
};

/* ─────────────────────────────────────────────
   Logo — Network Trellis (chosen mark)
   ───────────────────────────────────────────── */
function Logo({ size = 48, color = C.green500 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Connection lines */}
      <line x1="24" y1="6" x2="12" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="24" y1="6" x2="36" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="18" x2="8" y2="32" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="18" x2="24" y2="32" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="36" y1="18" x2="24" y2="32" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="36" y1="18" x2="40" y2="32" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="32" x2="16" y2="42" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="24" y1="32" x2="16" y2="42" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="24" y1="32" x2="32" y2="42" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="40" y1="32" x2="32" y2="42" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Cross connections */}
      <line x1="12" y1="18" x2="36" y2="18" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <line x1="8" y1="32" x2="40" y2="32" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      {/* Nodes */}
      <circle cx="24" cy="6" r="3.5" fill={C.green400} stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="18" r="3" fill={C.green300} stroke={color} strokeWidth="1.5" />
      <circle cx="36" cy="18" r="3" fill={C.green300} stroke={color} strokeWidth="1.5" />
      <circle cx="8" cy="32" r="2.5" fill={C.tan400} stroke={color} strokeWidth="1.2" />
      <circle cx="24" cy="32" r="3" fill={C.green300} stroke={color} strokeWidth="1.5" />
      <circle cx="40" cy="32" r="2.5" fill={C.tan400} stroke={color} strokeWidth="1.2" />
      <circle cx="16" cy="42" r="2.5" fill={C.tan500} stroke={color} strokeWidth="1.2" />
      <circle cx="32" cy="42" r="2.5" fill={C.tan500} stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Wordmark
   ───────────────────────────────────────────── */
function Wordmark({ color = C.green700, className = "text-3xl" }: { color?: string; className?: string }) {
  return (
    <span className={`font-serif font-bold ${className}`} style={{ color, letterSpacing: "0.02em" }}>
      Trellis
    </span>
  );
}

/* ─────────────────────────────────────────────
   Lockup — icon + wordmark together
   ───────────────────────────────────────────── */
function Lockup({ size = 48, wordmarkClass = "text-4xl", color = C.green500, wordmarkColor = C.green700 }: {
  size?: number;
  wordmarkClass?: string;
  color?: string;
  wordmarkColor?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={size} color={color} />
      <Wordmark color={wordmarkColor} className={wordmarkClass} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Section wrapper
   ───────────────────────────────────────────── */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
        <h2 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">{title}</h2>
        {children}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Duotone Icons (chosen style)
   ───────────────────────────────────────────── */
const duotoneIcons = {
  user: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill={C.green100} stroke={C.green600} strokeWidth="1.8" /><path d="M4 21v-1a6 6 0 0112 0v1" fill={C.green100} stroke={C.green600} strokeWidth="1.8" strokeLinecap="round" /></svg>
  ),
  building: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" fill={C.green100} stroke={C.green600} strokeWidth="1.8" /><circle cx="9" cy="7" r="1" fill={C.green500} /><circle cx="15" cy="7" r="1" fill={C.green500} /><circle cx="9" cy="11" r="1" fill={C.green500} /><circle cx="15" cy="11" r="1" fill={C.green500} /></svg>
  ),
  chart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="1" fill={C.green100} stroke={C.green600} strokeWidth="1.8" /><polyline points="4 16 8 12 12 14 16 10 20 12" stroke={C.green500} strokeWidth="2" fill="none" /></svg>
  ),
  network: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="12" y1="7" x2="6" y2="17" stroke={C.green200} strokeWidth="3" /><line x1="12" y1="7" x2="18" y2="17" stroke={C.green200} strokeWidth="3" /><circle cx="12" cy="5" r="2.5" fill={C.green100} stroke={C.green600} strokeWidth="1.5" /><circle cx="6" cy="19" r="2.5" fill={C.green100} stroke={C.green600} strokeWidth="1.5" /><circle cx="18" cy="19" r="2.5" fill={C.green100} stroke={C.green600} strokeWidth="1.5" /></svg>
  ),
  mail: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" fill={C.green100} stroke={C.green600} strokeWidth="1.8" /><polyline points="3 5 12 13 21 5" stroke={C.green600} strokeWidth="1.8" fill="none" /></svg>
  ),
  settings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill={C.green100} stroke={C.green600} strokeWidth="1.8" /><circle cx="12" cy="12" r="3" fill="none" stroke={C.green600} strokeWidth="1.8" /></svg>
  ),
};

/* ═══════════════════════════════════════════════
   BRAND MEDIA KIT PAGE
   ═══════════════════════════════════════════════ */
const sectionNav = ["Logo", "Typography", "Colors", "Patterns", "Icons", "Components", "Voice", "Pricing"];

export default function BrandPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={`min-h-screen bg-primary-50/50 dark:bg-primary-950 ${inter.className}`}>

      {/* ── NAVIGATION ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md dark:bg-primary-950/90">
        <div className="flex items-center justify-between p-6 lg:px-8">
          {/* Logo + home link */}
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 flex items-center gap-2.5 p-1.5">
              <Logo size={32} />
              <Wordmark className="text-lg" color={C.green800} />
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-primary-500 dark:text-primary-400"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              )}
            </button>
          </div>

          {/* Desktop section links */}
          <div className="hidden lg:flex lg:gap-x-8">
            {sectionNav.map((s) => (
              <a
                key={s}
                href={`#${s.toLowerCase()}`}
                className="text-sm/6 font-semibold text-gray-900 transition hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400"
              >
                {s}
              </a>
            ))}
          </div>

          {/* Right side — CTA */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <Link
              href="/login"
              className="text-sm/6 font-semibold text-gray-900 hover:text-primary-700 dark:text-white dark:hover:text-primary-400"
            >
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-primary-100 bg-white px-6 py-6 lg:hidden dark:border-primary-800 dark:bg-primary-950">
            <div className="space-y-2">
              {sectionNav.map((s) => (
                <a
                  key={s}
                  href={`#${s.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  {s}
                </a>
              ))}
            </div>
            <div className="mt-6 border-t border-primary-100 pt-6 dark:border-primary-800">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
              >
                Log in
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <header className="relative overflow-hidden border-b border-primary-200 bg-white dark:border-primary-800 dark:bg-primary-900">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${C.green500} 0px, ${C.green500} 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, ${C.green500} 0px, ${C.green500} 1px, transparent 1px, transparent 16px)`,
        }} />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="flex justify-center">
            <Lockup size={64} wordmarkClass="text-6xl sm:text-7xl" />
          </div>
          <p className="mt-4 font-serif text-xl italic text-primary-500 dark:text-primary-400">
            Every connection grows.
          </p>
          <p className="mt-2 text-sm text-primary-400">
            growyourtrellis.com &middot; Brand Media Kit
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-16">

        {/* ── 1. LOGO ── */}
        <Section id="logo" title="Logo">
          <p className="mt-2 text-sm text-primary-500">
            The Network Trellis mark — a cascading network graph representing how referral connections grow outward. Always pair the icon with the wordmark at large sizes; icon-only is acceptable at 32px and below.
          </p>

          {/* Primary lockup on 3 backgrounds */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {([
              { bg: "bg-white", label: "On light", color: C.green500, wordColor: C.green700 },
              { bg: "bg-primary-950", label: "On dark", color: C.green300, wordColor: C.green100 },
              { bg: "bg-primary-600", label: "On brand", color: C.white, wordColor: C.white },
            ] as const).map((v) => (
              <div key={v.label} className={`flex flex-col items-center justify-center rounded-xl ${v.bg} border border-primary-200 py-10 dark:border-primary-700`}>
                <Lockup size={48} color={v.color} wordmarkColor={v.wordColor} wordmarkClass="text-3xl" />
                <p className={`mt-3 text-[10px] uppercase tracking-widest ${v.bg === "bg-white" ? "text-primary-400" : "text-white/50"}`}>{v.label}</p>
              </div>
            ))}
          </div>

          {/* Size scale */}
          <p className="mt-8 text-xs font-bold uppercase tracking-widest text-tan-500">Icon sizes</p>
          <div className="mt-3 flex items-end gap-6">
            {[{ px: 16, label: "Favicon" }, { px: 24, label: "Tab" }, { px: 32, label: "Nav" }, { px: 48, label: "Standard" }, { px: 64, label: "App icon" }, { px: 96, label: "Hero" }].map((s) => (
              <div key={s.px} className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center rounded-lg bg-primary-50 shadow-sm dark:bg-primary-800" style={{ width: s.px + 16, height: s.px + 16 }}>
                  <Logo size={s.px} />
                </div>
                <span className="text-[10px] font-medium text-primary-400">{s.px}px</span>
                <span className="text-[9px] text-primary-300">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Clear space */}
          <p className="mt-8 text-xs font-bold uppercase tracking-widest text-tan-500">Clear space</p>
          <p className="mt-1 text-xs text-primary-400">Maintain a minimum clear space equal to the height of one node around all sides of the logo.</p>
        </Section>

        {/* ── 2. TYPOGRAPHY ── */}
        <Section id="typography" title="Typography">
          <p className="mt-2 text-sm text-primary-500">
            Two-font system: Libre Baskerville for display and headings, Inter for body text and UI.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-6 dark:border-primary-800 dark:bg-primary-950/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-tan-500">Display — Libre Baskerville</p>
              <p className="mt-3 font-serif text-4xl font-bold text-primary-800 dark:text-primary-100">Trellis</p>
              <p className="mt-1 font-serif text-lg italic text-primary-500">Every connection grows.</p>
              <div className="mt-4 space-y-1 border-t border-primary-100 pt-3 dark:border-primary-800">
                <p className="text-[11px] text-primary-400"><strong>Use for:</strong> Page titles, section headers, KPI values, hero text</p>
                <p className="text-[11px] text-primary-400"><strong>Weights:</strong> 400 (body italic), 700 (bold)</p>
              </div>
            </div>
            <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-6 dark:border-primary-800 dark:bg-primary-950/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-tan-500">Body — Inter</p>
              <p className={`mt-3 text-2xl font-bold text-primary-800 dark:text-primary-100 ${inter.className}`}>Grow Your Trellis</p>
              <p className={`mt-1 text-sm leading-relaxed text-primary-500 ${inter.className}`}>Track, visualize, and grow your business referral network with a platform built for relationship-driven growth.</p>
              <div className="mt-4 space-y-1 border-t border-primary-100 pt-3 dark:border-primary-800">
                <p className="text-[11px] text-primary-400"><strong>Use for:</strong> Body copy, buttons, labels, navigation, form fields</p>
                <p className="text-[11px] text-primary-400"><strong>Weights:</strong> 400, 500, 600, 700</p>
              </div>
            </div>
          </div>

          {/* Type scale */}
          <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-tan-500">Type scale</p>
          <div className="mt-3 space-y-2">
            {[
              { label: "H1", cls: "font-serif text-4xl font-bold", text: "Page Title" },
              { label: "H2", cls: "font-serif text-2xl font-bold", text: "Section Header" },
              { label: "H3", cls: "font-serif text-lg font-bold", text: "Card Title" },
              { label: "Body", cls: `text-sm ${inter.className}`, text: "Body text in Inter at 14px for optimal readability across screens." },
              { label: "Caption", cls: `text-xs text-primary-400 ${inter.className}`, text: "Caption and helper text at 12px" },
              { label: "Overline", cls: `text-[10px] font-bold uppercase tracking-widest text-tan-500 ${inter.className}`, text: "OVERLINE LABEL" },
            ].map((t) => (
              <div key={t.label} className="flex items-baseline gap-4">
                <span className="w-16 flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-primary-300">{t.label}</span>
                <span className={`text-primary-800 dark:text-primary-100 ${t.cls}`}>{t.text}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 3. COLORS ── */}
        <Section id="colors" title="Colors">
          <p className="mt-2 text-sm text-primary-500">
            Hunter Green primary palette with Warm Tan accent. Green conveys growth and trust; tan adds warmth and premium feel.
          </p>

          {([
            { label: "Primary — Hunter Green", colors: [
              { n: "50", hex: C.green50 }, { n: "100", hex: C.green100 }, { n: "200", hex: C.green200 },
              { n: "300", hex: C.green300 }, { n: "400", hex: C.green400 }, { n: "500", hex: C.green500 },
              { n: "600", hex: C.green600 }, { n: "700", hex: C.green700 }, { n: "800", hex: C.green800 },
              { n: "900", hex: C.green900 }, { n: "950", hex: C.green950 },
            ]},
            { label: "Accent — Warm Tan", colors: [
              { n: "50", hex: C.tan50 }, { n: "100", hex: C.tan100 }, { n: "200", hex: C.tan200 },
              { n: "300", hex: C.tan300 }, { n: "400", hex: C.tan400 }, { n: "500", hex: C.tan500 },
              { n: "600", hex: C.tan600 }, { n: "700", hex: C.tan700 }, { n: "800", hex: C.tan800 },
            ]},
          ]).map((palette) => (
            <div key={palette.label} className="mt-6">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary-400">{palette.label}</p>
              <div className="flex gap-1">
                {palette.colors.map((c) => (
                  <div key={c.n} className="flex flex-1 flex-col items-center gap-1">
                    <div className="h-12 w-full rounded-lg shadow-sm" style={{ backgroundColor: c.hex }} />
                    <span className="text-[9px] font-medium text-primary-400">{c.n}</span>
                    <span className="text-[8px] text-primary-300">{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Section>

        {/* ── 4. PATTERNS ── */}
        <Section id="patterns" title="Patterns">
          <p className="mt-2 text-sm text-primary-500">
            Two approved background patterns for section textures, card backgrounds, and hero areas.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {([
              {
                name: "Trellis Lattice",
                description: "The signature pattern. 45° crosshatch evoking a diamond trellis. Use at 3-5% opacity on light surfaces, 6-10% on dark.",
                css: {
                  backgroundImage: `repeating-linear-gradient(45deg, ${C.green500} 0px, ${C.green500} 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, ${C.green500} 0px, ${C.green500} 1px, transparent 1px, transparent 16px)`,
                } as React.CSSProperties,
              },
              {
                name: "Dot Grid",
                description: "Evenly spaced dots like seeds planted in a grid. Use at 4-8% opacity. Good for lighter, more minimal sections.",
                css: {
                  backgroundImage: `radial-gradient(circle, ${C.green500} 1px, transparent 1px)`,
                  backgroundSize: "16px 16px",
                } as React.CSSProperties,
              },
            ]).map((pattern) => (
              <div key={pattern.name} className="rounded-xl border border-primary-100 dark:border-primary-800">
                {/* Pattern on white */}
                <div className="relative flex h-32 items-center justify-center rounded-t-xl bg-white">
                  <div className="absolute inset-0 rounded-t-xl" style={{ ...pattern.css, opacity: 0.08 }} />
                  <Lockup size={36} wordmarkClass="text-2xl" />
                </div>
                {/* Pattern on dark */}
                <div className="relative flex h-24 items-center justify-center bg-primary-900">
                  <div className="absolute inset-0" style={{ ...pattern.css, opacity: 0.15 }} />
                  <Lockup size={28} wordmarkClass="text-xl" color={C.green300} wordmarkColor={C.green100} />
                </div>
                {/* Raw pattern strip */}
                <div className="relative h-10 rounded-b-xl bg-white">
                  <div className="absolute inset-0 rounded-b-xl" style={{ ...pattern.css, opacity: 0.3 }} />
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-primary-800 dark:text-primary-100">{pattern.name}</p>
                  <p className="mt-1 text-xs text-primary-400">{pattern.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 5. ICONS ── */}
        <Section id="icons" title="Icons">
          <p className="mt-2 text-sm text-primary-500">
            Duotone style — outlined stroke with a light green-100 fill accent. Combines clarity with visual richness.
          </p>

          <div className="mt-6 flex items-center gap-5">
            {Object.entries(duotoneIcons).map(([name, icon]) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 shadow-sm dark:bg-primary-800">
                  {icon}
                </div>
                <span className="text-[10px] capitalize text-primary-400">{name}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1 text-xs text-primary-400">
            <p><strong>Stroke:</strong> 1.8px, round caps, primary-600</p>
            <p><strong>Fill:</strong> primary-100 (light green tint)</p>
            <p><strong>Accent dots:</strong> primary-500 for inner details</p>
          </div>
        </Section>

        {/* ── 6. COMPONENTS ── */}
        <Section id="components" title="Components">
          <p className="mt-2 text-sm text-primary-500">
            Core UI elements. Section titles use standard business terms; brand vocabulary appears in descriptions, toasts, and empty states.
          </p>

          {/* Buttons */}
          <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-tan-500">Buttons</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">Primary</button>
            <button className="rounded-lg border-2 border-primary-500 px-5 py-2.5 text-sm font-semibold text-primary-600">Secondary</button>
            <button className="rounded-lg px-5 py-2.5 text-sm font-semibold text-primary-500">Ghost</button>
            <button className="rounded-lg bg-tan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">Accent</button>
            <button className="rounded-lg bg-red-500/90 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">Destructive</button>
            <button className="cursor-not-allowed rounded-lg bg-primary-200 px-5 py-2.5 text-sm font-semibold text-primary-400">Disabled</button>
          </div>

          {/* Badges */}
          <p className="mt-8 text-[10px] font-bold uppercase tracking-widest text-tan-500">Badges</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">New Referral</span>
            <span className="rounded-full bg-tan-100 px-3 py-1 text-xs font-semibold text-tan-700">Pending</span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Won</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">In Progress</span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Lost</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">Inactive</span>
          </div>

          {/* KPI Cards */}
          <p className="mt-8 text-[10px] font-bold uppercase tracking-widest text-tan-500">KPI Cards</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-primary-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">Revenue Won</p>
              <p className="mt-1 font-serif text-2xl font-bold text-primary-800">$48,200</p>
              <p className="mt-0.5 text-xs text-primary-400">+12% from last month</p>
            </div>
            <div className="rounded-xl border border-primary-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">Conversion Rate</p>
              <p className="mt-1 font-serif text-2xl font-bold text-primary-800">34.2%</p>
              <p className="mt-0.5 text-xs text-primary-400">Across 67 contacts</p>
            </div>
            <div className="rounded-xl border border-primary-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">Referrals</p>
              <p className="mt-1 font-serif text-2xl font-bold text-primary-800">23</p>
              <p className="mt-0.5 text-xs text-primary-400">This quarter</p>
            </div>
          </div>

          {/* Toasts — brand language here */}
          <p className="mt-8 text-[10px] font-bold uppercase tracking-widest text-tan-500">Toasts <span className="normal-case font-normal tracking-normal text-primary-300">(brand vocabulary used here)</span></p>
          <div className="mt-3 space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <span className="mt-0.5 text-green-500">&#10003;</span>
              <div>
                <p className="text-sm font-semibold text-green-800">New vine planted!</p>
                <p className="text-xs text-green-600">Jane Doe has been added to your trellis.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <span className="mt-0.5 text-red-500">&#10005;</span>
              <div>
                <p className="text-sm font-semibold text-red-800">Vine pruned</p>
                <p className="text-xs text-red-600">The contact has been removed from your network.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-tan-200 bg-tan-50 px-4 py-3">
              <span className="mt-0.5 text-tan-500">&#9672;</span>
              <div>
                <p className="text-sm font-semibold text-tan-800">New fruit!</p>
                <p className="text-xs text-tan-600">A deal worth $5,400 has been added to your garden.</p>
              </div>
            </div>
          </div>

          {/* Form inputs */}
          <p className="mt-8 text-[10px] font-bold uppercase tracking-widest text-tan-500">Form inputs</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-primary-600">Contact Name</label>
              <input type="text" placeholder="Jane Doe" readOnly className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm text-primary-800 placeholder-primary-300 shadow-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-primary-600">Company</label>
              <input type="text" placeholder="Acme Corp" readOnly className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm text-primary-800 placeholder-primary-300 shadow-sm outline-none" />
            </div>
          </div>
        </Section>

        {/* ── 7. VOICE ── */}
        <Section id="voice" title="Tone of Voice">
          <p className="mt-2 text-sm text-primary-500">
            Warm, confident, concise. Vine/trellis vocabulary in descriptions, toasts, and empty states — business terms for titles, nav, and table headers.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {([
              { title: "Warm, not cute", doEx: "Add your first contact to start growing your trellis.", dontEx: "Plant your first seedling in the digital soil of success!" },
              { title: "Confident, not pushy", doEx: "Your referral network is ready to explore.", dontEx: "WOW! You're going to LOVE what your network can do!!!" },
              { title: "Concise, not cold", doEx: "No vines yet. Add your first contact to get started.", dontEx: "There are currently no contacts in your database." },
              { title: "Helpful, not hand-holding", doEx: "Fruit borne from this vine will appear here.", dontEx: "This is where you'll see deals! Deals are when someone buys something." },
            ]).map((p) => (
              <div key={p.title} className="rounded-xl border border-primary-100 bg-primary-50/30 p-5 dark:border-primary-800 dark:bg-primary-950/30">
                <p className="font-serif text-sm font-bold text-primary-800 dark:text-primary-100">{p.title}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 font-bold text-green-600">DO</span>
                    <span className="italic text-primary-600">&ldquo;{p.doEx}&rdquo;</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 font-bold text-red-500">DON&apos;T</span>
                    <span className="italic text-primary-400 line-through">&ldquo;{p.dontEx}&rdquo;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vocabulary */}
          <p className="mt-8 text-[10px] font-bold uppercase tracking-widest text-tan-500">Brand vocabulary</p>
          <p className="mt-1 text-xs text-primary-400">Used in descriptions, toasts, empty states, KPI subtitles. NOT in nav, table headers, or button text.</p>
          <div className="mt-3 overflow-hidden rounded-lg border border-primary-100 dark:border-primary-800">
            <div className="grid grid-cols-3 bg-primary-100/50 px-4 py-2 dark:bg-primary-800/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-500">Business term</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-tan-600">Brand term</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-400">Where used</span>
            </div>
            {([
              { biz: "Contact(s)", brand: "Vine(s)", where: "Descriptions, toasts" },
              { biz: "Company", brand: "Root(s)", where: "Descriptions" },
              { biz: "Deal(s)", brand: "Fruit", where: "Toasts, empty states" },
              { biz: "Referral(s)", brand: "New Growth", where: "Descriptions" },
              { biz: "Pipeline", brand: "Garden", where: "Descriptions" },
              { biz: "Revenue Won", brand: "Harvest", where: "KPI subtitles" },
              { biz: "Conversion Rate", brand: "Yield Rate", where: "KPI subtitles" },
              { biz: "Delete contact", brand: "Prune a vine", where: "Confirmation dialogs" },
              { biz: "Activity", brand: "Growth Log", where: "Tab labels (descriptive)" },
            ]).map((v, i) => (
              <div key={v.biz} className={`grid grid-cols-3 px-4 py-2 text-sm ${i % 2 === 0 ? "bg-white dark:bg-primary-950/30" : "bg-primary-50/50 dark:bg-primary-900/50"}`}>
                <span className="text-primary-600 dark:text-primary-300">{v.biz}</span>
                <span className="font-medium text-primary-800 dark:text-primary-100">{v.brand}</span>
                <span className="text-xs text-primary-400">{v.where}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 8. PRICING ── */}
        <Section id="pricing" title="Pricing">
          <p className="mt-2 text-sm text-primary-500">
            Four tiers based on competitive analysis of 13+ platforms. Contacts as the primary value metric. Visualization is the upgrade hook.
          </p>

          {/* Billing toggle */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${billing === "monthly" ? "text-primary-800" : "text-primary-400"}`}>Monthly</span>
            <button onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")} className={`relative h-7 w-12 rounded-full transition ${billing === "annual" ? "bg-tan-500" : "bg-primary-300"}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${billing === "annual" ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className={`text-sm font-semibold ${billing === "annual" ? "text-primary-800" : "text-primary-400"}`}>Annual</span>
            {billing === "annual" && <span className="rounded-full bg-tan-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tan-700">2 months free</span>}
          </div>

          {/* Tier cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { name: "Free", price: 0, annual: 0, tagline: "See your network come alive", seats: "1 user", addon: null, highlight: false, features: ["100 contacts", "5 companies", "20 referrals", "Basic tree view", "30-day history", "Community support"] },
              { name: "Pro", price: 29, annual: 24, tagline: "For solo professionals", seats: "1 user", addon: "+$15/seat", highlight: false, features: ["500 contacts", "Unlimited companies", "Unlimited referrals", "Interactive tree + filters", "CSV export", "Email support", "Basic AI insights"] },
              { name: "Team", price: 79, annual: 66, tagline: "For growing teams", seats: "5 users included", addon: "+$12/seat", highlight: true, features: ["2,500 contacts", "Full D3.js + React Flow", "CSV + PDF export", "Zapier + webhooks", "Team roles & permissions", "Priority support", "Full AI insights"] },
              { name: "Enterprise", price: 199, annual: 166, tagline: "For organizations at scale", seats: "15 users included", addon: "+$10/seat", highlight: false, features: ["Unlimited contacts", "Custom viz + white-label", "Full API access", "SSO/SAML + audit logs", "Custom integrations", "Dedicated CSM", "Custom AI models"] },
            ]).map((tier) => (
              <div key={tier.name} className={`relative flex flex-col rounded-xl border p-5 ${tier.highlight ? "border-tan-400 bg-tan-50/50 shadow-md" : "border-primary-200 bg-white"}`}>
                {tier.highlight && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-tan-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Most Popular</span>}
                <p className="text-xs font-bold uppercase tracking-widest text-primary-400">{tier.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-serif text-3xl font-bold text-primary-800">${billing === "monthly" ? tier.price : tier.annual}</span>
                  {tier.price > 0 && <span className="text-sm text-primary-400">/mo</span>}
                </div>
                {billing === "annual" && tier.price > 0 && <p className="text-[11px] text-tan-600">Save ${(tier.price - tier.annual) * 12}/yr</p>}
                <p className="mt-1 text-xs italic text-primary-500">{tier.tagline}</p>
                <div className="mt-4 rounded-lg bg-primary-100/50 px-3 py-2">
                  <p className="text-xs font-semibold text-primary-700">{tier.seats}</p>
                  {tier.addon && <p className="text-[10px] text-primary-500">{tier.addon} add-on</p>}
                </div>
                <ul className="mt-4 flex-1 space-y-1.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-primary-700">
                      <span className="mt-0.5 flex-shrink-0 text-green-500">&#10003;</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 9. SOCIAL PREVIEW ── */}
        <Section id="social" title="Social Preview">
          <p className="mt-2 text-sm text-primary-500">How shared links appear across platforms.</p>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* LinkedIn */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary-400">LinkedIn / Slack</p>
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <div className="relative flex h-44 items-center justify-center bg-primary-600">
                  <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 1px, transparent 16px)` }} />
                  <div className="relative text-center">
                    <div className="flex justify-center"><Lockup size={36} wordmarkClass="text-3xl" color="#fff" wordmarkColor="#fff" /></div>
                    <p className="mt-2 text-sm font-medium text-primary-100">Every connection grows.</p>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs uppercase text-zinc-400">growyourtrellis.com</p>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-800">Trellis — Grow Your Referral Network</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Track, visualize, and grow your business referral network.</p>
                </div>
              </div>
            </div>
            {/* Twitter */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary-400">Twitter / X</p>
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="relative flex h-36 items-center justify-center bg-primary-800">
                  <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${C.tan500} 0px, ${C.tan500} 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, ${C.tan500} 0px, ${C.tan500} 1px, transparent 1px, transparent 16px)` }} />
                  <div className="relative flex justify-center"><Lockup size={32} wordmarkClass="text-2xl" color="#fff" wordmarkColor="#fff" /></div>
                </div>
                <div className="px-4 py-2.5">
                  <p className="text-sm font-semibold text-zinc-800">Trellis — Grow Your Referral Network</p>
                  <p className="text-xs text-zinc-500">growyourtrellis.com</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 10. DOMAIN ── */}
        <section className="rounded-2xl border-2 border-tan-300 bg-tan-50/50 p-8 shadow-sm dark:border-tan-600 dark:bg-tan-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-tan-500">Primary Domain</p>
              <p className="mt-1 font-serif text-2xl font-bold text-primary-800">growyourtrellis.com</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400">Secondary / Redirect</p>
              <p className="mt-1 text-sm font-medium text-primary-500">trackwithtrellis.com</p>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-primary-200 dark:border-primary-800">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            {/* Brand column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <Logo size={28} />
                <Wordmark className="text-xl" />
              </div>
              <p className="mt-3 font-serif text-sm italic text-primary-400">Every connection grows.</p>
              <p className="mt-4 text-xs text-primary-300">&copy; 2026 Trellis. All rights reserved.</p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary-500">Product</h3>
              <ul className="mt-4 space-y-3">
                <li><Link href="/#features" className="text-sm text-primary-500 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200">Features</Link></li>
                <li><Link href="/#pricing" className="text-sm text-primary-500 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200">Pricing</Link></li>
                <li><Link href="/register" className="text-sm text-primary-500 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200">Get Started</Link></li>
                <li><Link href="/#faqs" className="text-sm text-primary-500 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200">FAQs</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary-500">Company</h3>
              <ul className="mt-4 space-y-3">
                <li><Link href="/about" className="text-sm text-primary-500 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200">About</Link></li>
                <li><Link href="/brand" className="text-sm font-medium text-tan-600 transition hover:text-tan-700 dark:text-tan-400 dark:hover:text-tan-300">Brand Kit</Link></li>
                <li><span className="text-sm text-primary-300 dark:text-primary-600">Blog</span></li>
                <li><span className="text-sm text-primary-300 dark:text-primary-600">Careers</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary-500">Legal</h3>
              <ul className="mt-4 space-y-3">
                <li><span className="text-sm text-primary-300 dark:text-primary-600">Terms of Service</span></li>
                <li><span className="text-sm text-primary-300 dark:text-primary-600">Privacy Policy</span></li>
                <li><span className="text-sm text-primary-300 dark:text-primary-600">License</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-100 pt-8 sm:flex-row dark:border-primary-800">
            <p className="text-xs text-primary-300">growyourtrellis.com</p>
            <p className="text-xs text-primary-300">Brand Media Kit &middot; 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
