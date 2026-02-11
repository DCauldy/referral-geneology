"use client";

import { useState } from "react";
import {
  Inter,
  DM_Sans,
  Plus_Jakarta_Sans,
  Outfit,
  Manrope,
  Source_Sans_3,
  Lato,
  Raleway,
} from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"] });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "600", "700"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "700"] });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "600", "700"] });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"] });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"] });
const raleway = Raleway({ subsets: ["latin"], weight: ["400", "600", "700"] });

/* ─────────────────────────────────────────────
   Color tokens (mirroring globals.css @theme)
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
   LOGO 1 — Classic Lattice Trellis
   Diamond lattice pattern evoking a garden trellis
   ───────────────────────────────────────────── */
function LogoLattice({ size = 48, color = C.green500 }: { size?: number; color?: string }) {
  /* Clean diamond lattice bounded within two vertical posts.
     Grid: posts at x=12 and x=36, horizontal bars every 8px,
     diagonals connect intersections in a regular pattern. */
  const L = 12; // left post x
  const R = 36; // right post x
  const M = 24; // midpoint x
  const top = 4;
  const bot = 44;
  // Horizontal bar y-positions (every 8px)
  const rows = [8, 16, 24, 32, 40];

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Two vertical posts */}
      <rect x={L - 1.25} y={top} width="2.5" height={bot - top} rx="1.25" fill={color} />
      <rect x={R - 1.25} y={top} width="2.5" height={bot - top} rx="1.25" fill={color} />

      {/* Horizontal bars */}
      {rows.map((y) => (
        <line key={`h${y}`} x1={L} y1={y} x2={R} y2={y} stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      ))}

      {/* Diagonals — left-leaning (top-left to bottom-right) */}
      <line x1={L} y1={rows[0]} x2={M} y2={rows[1]} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={M} y1={rows[1]} x2={R} y2={rows[2]} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={L} y1={rows[2]} x2={M} y2={rows[3]} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={M} y1={rows[3]} x2={R} y2={rows[4]} stroke={color} strokeWidth="1.8" strokeLinecap="round" />

      {/* Diagonals — right-leaning (top-right to bottom-left) */}
      <line x1={R} y1={rows[0]} x2={M} y2={rows[1]} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={M} y1={rows[1]} x2={L} y2={rows[2]} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={R} y1={rows[2]} x2={M} y2={rows[3]} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={M} y1={rows[3]} x2={L} y2={rows[4]} stroke={color} strokeWidth="1.8" strokeLinecap="round" />

      {/* Leaf accents at diamond centers */}
      <circle cx={M} cy={rows[1]} r="2.5" fill={C.green300} opacity="0.7" />
      <circle cx={M} cy={rows[3]} r="2.5" fill={C.green300} opacity="0.7" />
      <circle cx={L + 1} cy={rows[2]} r="2" fill={C.green400} opacity="0.5" />
      <circle cx={R - 1} cy={rows[2]} r="2" fill={C.green400} opacity="0.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   LOGO 2 — Vine & Trellis
   A trellis frame with a vine growing upward
   ───────────────────────────────────────────── */
function LogoVine({ size = 48, color = C.green500 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trellis frame */}
      <rect x="8" y="6" width="2" height="38" rx="1" fill={color} opacity="0.4" />
      <rect x="38" y="6" width="2" height="38" rx="1" fill={color} opacity="0.4" />
      <rect x="8" y="14" width="32" height="1.5" rx="0.75" fill={color} opacity="0.25" />
      <rect x="8" y="24" width="32" height="1.5" rx="0.75" fill={color} opacity="0.25" />
      <rect x="8" y="34" width="32" height="1.5" rx="0.75" fill={color} opacity="0.25" />
      {/* Main vine stem */}
      <path
        d="M24 44 C24 36, 18 32, 18 26 C18 20, 28 18, 28 12 C28 8, 24 4, 24 4"
        stroke={C.green400}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaves */}
      <path d="M18 26 C14 24, 12 20, 14 18 C16 20, 18 22, 18 26Z" fill={C.green300} />
      <path d="M28 12 C32 10, 34 6, 32 4 C30 6, 28 9, 28 12Z" fill={C.green300} />
      <path d="M22 38 C18 38, 14 36, 15 33 C17 35, 20 37, 22 38Z" fill={C.green400} opacity="0.7" />
      <path d="M26 18 C30 17, 34 14, 33 12 C31 14, 28 16, 26 18Z" fill={C.green400} opacity="0.7" />
      {/* Small fruit/flower accents */}
      <circle cx="14" cy="17.5" r="2" fill={C.tan400} />
      <circle cx="33" cy="11.5" r="2" fill={C.tan400} />
      <circle cx="15" cy="32.5" r="1.5" fill={C.tan500} opacity="0.8" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   LOGO 3 — Abstract T-Trellis
   Letter T formed by trellis lattice bars
   ───────────────────────────────────────────── */
function LogoAbstractT({ size = 48, color = C.green500 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top horizontal bar of T */}
      <rect x="6" y="6" width="36" height="4" rx="2" fill={color} />
      {/* Vertical stem of T */}
      <rect x="21" y="6" width="6" height="36" rx="2" fill={color} />
      {/* Lattice cross-bars on the stem */}
      <line x1="16" y1="16" x2="32" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="18" y1="24" x2="30" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="16" y1="32" x2="32" y2="32" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Diagonal lattice accents */}
      <line x1="16" y1="16" x2="21" y2="24" stroke={C.green300} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="32" y1="16" x2="27" y2="24" stroke={C.green300} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="24" x2="21" y2="32" stroke={C.green300} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="30" y1="24" x2="27" y2="32" stroke={C.green300} strokeWidth="1.2" strokeLinecap="round" />
      {/* Small leaf accents */}
      <path d="M8 6 C6 4, 4 6, 6 8 C7 7, 8 6, 8 6Z" fill={C.green300} />
      <path d="M40 6 C42 4, 44 6, 42 8 C41 7, 40 6, 40 6Z" fill={C.green300} />
      <circle cx="24" cy="40" r="2" fill={C.tan500} opacity="0.6" />
    </svg>
  );
}

/* Replaced by LogoAbstractTv2 below */
function LogoAbstractTv2({ size = 48, color = C.green500 }: { size?: number; color?: string }) {
  /* T-shaped trellis: the letter T built from thin parallel rails
     with diamond cross-bracing between them, like a real wooden trellis. */
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── Top bar of T (double rail) ── */}
      <rect x="6" y="5" width="36" height="2" rx="1" fill={color} />
      <rect x="6" y="11" width="36" height="2" rx="1" fill={color} />
      {/* Top bar lattice — X braces between the two rails */}
      {[8, 16, 24, 32].map((x) => (
        <g key={`tx${x}`}>
          <line x1={x} y1="7" x2={x + 8} y2="11" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
          <line x1={x + 8} y1="7" x2={x} y2="11" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
        </g>
      ))}

      {/* ── Vertical stem of T (double rail) ── */}
      <rect x="20" y="11" width="2" height="33" rx="1" fill={color} />
      <rect x="26" y="11" width="2" height="33" rx="1" fill={color} />
      {/* Stem lattice — X braces down the stem */}
      {[14, 22, 30, 38].map((y) => (
        <g key={`sy${y}`}>
          <line x1="22" y1={y} x2="26" y2={y + 6} stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
          <line x1="26" y1={y} x2="22" y2={y + 6} stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
        </g>
      ))}

      {/* Leaf accents at brace intersections */}
      <circle cx="24" cy="17" r="1.8" fill={C.green300} opacity="0.7" />
      <circle cx="24" cy="33" r="1.8" fill={C.green300} opacity="0.7" />
      <circle cx="24" cy="25" r="1.5" fill={C.tan400} opacity="0.6" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   LOGO 4 — Leaf Trellis
   A stylized leaf whose veins form a lattice pattern
   ───────────────────────────────────────────── */
function LogoArch({ size = 48, color = C.green500 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── Leaf outline ── */}
      <path
        d="M24 4 C10 12, 6 24, 10 36 C14 44, 22 46, 24 46 C26 46, 34 44, 38 36 C42 24, 38 12, 24 4Z"
        fill={C.green100}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* ── Central vein (stem) ── */}
      <line x1="24" y1="8" x2="24" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round" />

      {/* ── Diamond lattice inside the leaf ──
           True criss-cross: lines go BOTH directions between
           the same points, forming X diamonds, not tree branches. */}

      {/* Row 1 diamonds (y 12–20) */}
      <line x1="16" y1="16" x2="24" y2="12" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="24" y1="12" x2="32" y2="16" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="16" y1="16" x2="24" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="24" y1="20" x2="32" y2="16" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />

      {/* Row 2 diamonds (y 20–28) */}
      <line x1="14" y1="24" x2="24" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="24" y1="20" x2="34" y2="24" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="14" y1="24" x2="24" y2="28" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="24" y1="28" x2="34" y2="24" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />

      {/* Row 3 diamonds (y 28–36) */}
      <line x1="14" y1="32" x2="24" y2="28" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="24" y1="28" x2="34" y2="32" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="14" y1="32" x2="24" y2="36" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="24" y1="36" x2="34" y2="32" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />

      {/* Bottom partial diamond (y 36–42) */}
      <line x1="17" y1="39" x2="24" y2="36" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
      <line x1="24" y1="36" x2="31" y2="39" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />

      {/* ── Small accent at leaf tip ── */}
      <circle cx="24" cy="9" r="1.5" fill={C.tan400} opacity="0.8" />

      {/* ── Stem at bottom ── */}
      <line x1="24" y1="44" x2="24" y2="47" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   LOGO 5 — Network Trellis
   Nodes connected like a trellis network graph
   ───────────────────────────────────────────── */
function LogoNetwork({ size = 48, color = C.green500 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Connection lines forming trellis pattern */}
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
   LOGO 6 — Woven Trellis
   Interwoven bands forming a trellis weave
   ───────────────────────────────────────────── */
function LogoWoven({ size = 48, color = C.green500 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background subtle shape */}
      <rect x="8" y="4" width="32" height="40" rx="4" fill={C.green50} opacity="0.5" />
      {/* Horizontal weave bands */}
      <rect x="8" y="8" width="32" height="3" rx="1.5" fill={color} opacity="0.7" />
      <rect x="8" y="18" width="32" height="3" rx="1.5" fill={color} opacity="0.7" />
      <rect x="8" y="28" width="32" height="3" rx="1.5" fill={color} opacity="0.7" />
      <rect x="8" y="38" width="32" height="3" rx="1.5" fill={color} opacity="0.7" />
      {/* Vertical weave bands (alternating over/under) */}
      {/* Band 1 */}
      <rect x="12" y="4" width="3" height="6" rx="1" fill={C.green400} />
      <rect x="12" y="11" width="3" height="7" rx="1" fill={C.green600} />
      <rect x="12" y="21" width="3" height="7" rx="1" fill={C.green400} />
      <rect x="12" y="31" width="3" height="7" rx="1" fill={C.green600} />
      {/* Band 2 */}
      <rect x="22" y="4" width="3" height="4" rx="1" fill={C.green600} />
      <rect x="22" y="11" width="3" height="7" rx="1" fill={C.green400} />
      <rect x="22" y="21" width="3" height="7" rx="1" fill={C.green600} />
      <rect x="22" y="31" width="3" height="7" rx="1" fill={C.green400} />
      {/* Band 3 */}
      <rect x="32" y="4" width="3" height="6" rx="1" fill={C.green400} />
      <rect x="32" y="11" width="3" height="7" rx="1" fill={C.green600} />
      <rect x="32" y="21" width="3" height="7" rx="1" fill={C.green400} />
      <rect x="32" y="31" width="3" height="7" rx="1" fill={C.green600} />
      {/* Accent dots at weave intersections */}
      <circle cx="13.5" cy="9.5" r="1" fill={C.tan400} opacity="0.6" />
      <circle cx="23.5" cy="19.5" r="1" fill={C.tan400} opacity="0.6" />
      <circle cx="33.5" cy="29.5" r="1" fill={C.tan400} opacity="0.6" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Wordmark component
   ───────────────────────────────────────────── */
function Wordmark({
  color = C.green700,
  size = "text-3xl",
  font = "serif",
}: {
  color?: string;
  size?: string;
  font?: "serif" | "sans";
}) {
  const fontFamily =
    font === "serif"
      ? '"Libre Baskerville", "Georgia", serif'
      : '"Nunito", system-ui, sans-serif';
  return (
    <span className={size} style={{ color, fontFamily, fontWeight: 700, letterSpacing: "0.02em" }}>
      Trellis
    </span>
  );
}

/* ─────────────────────────────────────────────
   Logo Card — wraps icon + wordmark in a
   presentation card with variant controls
   ───────────────────────────────────────────── */
function LogoCard({
  title,
  description,
  icon: Icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  index: number;
}) {
  const [bg, setBg] = useState<"light" | "dark" | "brand">("light");
  const bgClasses = {
    light: "bg-white",
    dark: "bg-primary-950",
    brand: "bg-primary-600",
  };
  const wordmarkColor = {
    light: C.green700,
    dark: C.green100,
    brand: C.white,
  };
  const iconColor = {
    light: C.green500,
    dark: C.green300,
    brand: C.white,
  };

  return (
    <div className="group rounded-2xl border border-primary-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-primary-800 dark:bg-primary-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-primary-100 px-6 py-4 dark:border-primary-800">
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-tan-500">
            Concept {index}
          </p>
          <h3 className="mt-0.5 font-serif text-lg font-bold text-primary-800 dark:text-primary-100">
            {title}
          </h3>
        </div>
        {/* BG toggle */}
        <div className="flex gap-1.5">
          {(["light", "dark", "brand"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setBg(v)}
              className={`h-6 w-6 rounded-full border-2 transition ${
                bg === v ? "border-tan-500 ring-2 ring-tan-300" : "border-primary-200 dark:border-primary-700"
              } ${v === "light" ? "bg-white" : v === "dark" ? "bg-primary-950" : "bg-primary-600"}`}
              title={`${v} background`}
            />
          ))}
        </div>
      </div>

      {/* Logo display area */}
      <div
        className={`flex items-center justify-center gap-4 py-14 transition-colors ${bgClasses[bg]} rounded-none`}
      >
        <Icon size={56} color={iconColor[bg]} />
        <Wordmark color={wordmarkColor[bg]} size="text-4xl" font="serif" />
      </div>

      {/* Compact row */}
      <div className={`flex items-center justify-center gap-3 border-t border-primary-100 py-6 dark:border-primary-800 ${bgClasses[bg]}`}>
        <Icon size={28} color={iconColor[bg]} />
        <Wordmark color={wordmarkColor[bg]} size="text-xl" font="sans" />
      </div>

      {/* Icon-only row */}
      <div className={`flex items-center justify-center gap-6 border-t border-primary-100 py-6 dark:border-primary-800 ${bgClasses[bg]} rounded-b-2xl`}>
        <Icon size={40} color={iconColor[bg]} />
        <Icon size={28} color={iconColor[bg]} />
        <Icon size={20} color={iconColor[bg]} />
      </div>

      {/* Description */}
      <div className="px-6 py-4 border-t border-primary-100 dark:border-primary-800">
        <p className="text-sm text-primary-600 dark:text-primary-400">{description}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Domain Suggestions
   ───────────────────────────────────────────── */
function DomainSuggestions() {
  const finalists = [
    {
      name: "growyourtrellis.com",
      note: "Recommended",
      why: "Doubles as a tagline. Aspirational, warm, and perfectly aligned with the vine/trellis brand metaphor. Feels personal with \"your.\"",
    },
    {
      name: "trackwithtrellis.com",
      note: "Strong alternative",
      why: "Functional and descriptive. Emphasizes the tracking/CRM side of the platform. Great as a redirect or secondary domain.",
    },
  ];

  const unavailable = [
    { name: "usetrellis.com", status: "Taken" },
    { name: "trelliscrm.com", status: "Taken" },
    { name: "gotrellis.com", status: "Taken" },
    { name: "trellis.app", status: "Taken" },
    { name: "growtrellis.com", status: "Taken" },
    { name: "trellishq.com", status: "Too expensive" },
    { name: "jointrellis.com", status: "Too expensive" },
  ];

  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
        Domain Finalists
      </h3>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        Two available domains for the Trellis platform
      </p>

      <div className="mt-6 space-y-4">
        {finalists.map((d, i) => (
          <div
            key={d.name}
            className={`relative rounded-xl border-2 px-6 py-5 ${
              i === 0
                ? "border-tan-400 bg-tan-50 dark:border-tan-600 dark:bg-tan-950/30"
                : "border-primary-200 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-950/50"
            }`}
          >
            {i === 0 && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-tan-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Top Pick
              </span>
            )}
            <div className="flex items-center justify-between">
              <code className="text-lg font-bold text-primary-800 dark:text-primary-100">
                {d.name}
              </code>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                i === 0
                  ? "bg-tan-200 text-tan-800 dark:bg-tan-800 dark:text-tan-100"
                  : "bg-primary-200 text-primary-700 dark:bg-primary-800 dark:text-primary-200"
              }`}>
                {d.note}
              </span>
            </div>
            <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">{d.why}</p>
          </div>
        ))}
      </div>

      <details className="mt-6">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-primary-400 hover:text-primary-600 dark:hover:text-primary-300">
          Unavailable domains considered
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {unavailable.map((d) => (
            <div
              key={d.name}
              className="flex items-center justify-between rounded-lg border border-primary-100 bg-primary-50/30 px-4 py-2.5 opacity-60 dark:border-primary-800 dark:bg-primary-950/30"
            >
              <code className="text-sm text-primary-500 line-through">{d.name}</code>
              <span className="text-[11px] text-primary-400">{d.status}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Patterns & Backdrops
   ───────────────────────────────────────────── */
const patterns: {
  name: string;
  description: string;
  css: React.CSSProperties;
}[] = [
  {
    name: "Trellis Lattice",
    description: "45° crosshatch evoking a classic diamond trellis. The signature brand pattern.",
    css: {
      backgroundImage: `repeating-linear-gradient(
        45deg, ${C.green500} 0px, ${C.green500} 1px, transparent 1px, transparent 16px
      ), repeating-linear-gradient(
        -45deg, ${C.green500} 0px, ${C.green500} 1px, transparent 1px, transparent 16px
      )`,
    },
  },
  {
    name: "Garden Rows",
    description: "Soft horizontal lines like tilled garden rows. Great for section dividers and card backgrounds.",
    css: {
      backgroundImage: `repeating-linear-gradient(
        0deg, ${C.green500} 0px, ${C.green500} 1px, transparent 1px, transparent 14px
      )`,
    },
  },
  {
    name: "Vine Diagonal",
    description: "Single-direction 45° stripes — a simpler, lighter alternative to the full lattice.",
    css: {
      backgroundImage: `repeating-linear-gradient(
        45deg, ${C.green500} 0px, ${C.green500} 1px, transparent 1px, transparent 12px
      )`,
    },
  },
  {
    name: "Dot Grid",
    description: "Evenly spaced dots like seeds planted in a grid. Clean and minimal.",
    css: {
      backgroundImage: `radial-gradient(circle, ${C.green500} 1px, transparent 1px)`,
      backgroundSize: "16px 16px",
    },
  },
  {
    name: "Diamond Fence",
    description: "Larger diamond shapes formed by thick crosshatch. Bold and structural.",
    css: {
      backgroundImage: `repeating-linear-gradient(
        45deg, ${C.green500} 0px, ${C.green500} 1.5px, transparent 1.5px, transparent 24px
      ), repeating-linear-gradient(
        -45deg, ${C.green500} 0px, ${C.green500} 1.5px, transparent 1.5px, transparent 24px
      )`,
    },
  },
  {
    name: "Fine Mesh",
    description: "Tight vertical + horizontal grid like wire mesh or fine garden netting.",
    css: {
      backgroundImage: `repeating-linear-gradient(
        0deg, ${C.green500} 0px, ${C.green500} 1px, transparent 1px, transparent 10px
      ), repeating-linear-gradient(
        90deg, ${C.green500} 0px, ${C.green500} 1px, transparent 1px, transparent 10px
      )`,
    },
  },
  {
    name: "Woven Basket",
    description: "Alternating short dashes at 45° and -45° suggesting a woven texture.",
    css: {
      backgroundImage: `repeating-linear-gradient(
        45deg, ${C.green500} 0px, ${C.green500} 4px, transparent 4px, transparent 8px
      ), repeating-linear-gradient(
        -45deg, ${C.green500} 0px, ${C.green500} 4px, transparent 4px, transparent 8px
      )`,
      backgroundSize: "16px 16px",
    },
  },
  {
    name: "Tan Lattice",
    description: "The signature lattice in warm tan instead of green. Use on dark or brand surfaces.",
    css: {
      backgroundImage: `repeating-linear-gradient(
        45deg, ${C.tan500} 0px, ${C.tan500} 1px, transparent 1px, transparent 16px
      ), repeating-linear-gradient(
        -45deg, ${C.tan500} 0px, ${C.tan500} 1px, transparent 1px, transparent 16px
      )`,
    },
  },
];

function PatternCard({
  pattern,
}: {
  pattern: (typeof patterns)[number];
}) {
  const [bg, setBg] = useState<"light" | "dark" | "brand">("light");
  const bgClass = {
    light: "bg-white",
    dark: "bg-primary-950",
    brand: "bg-primary-600",
  };
  const opacity = {
    light: 0.12,
    dark: 0.2,
    brand: 0.2,
  };

  return (
    <div className="rounded-xl border border-primary-200 bg-white shadow-sm dark:border-primary-800 dark:bg-primary-900">
      {/* Pattern preview */}
      <div className={`relative h-32 overflow-hidden rounded-t-xl ${bgClass[bg]}`}>
        <div className="absolute inset-0" style={{ ...pattern.css, opacity: opacity[bg] }} />
        {/* Sample content overlay to show pattern in context */}
        <div className="relative flex h-full items-center justify-center">
          <span
            className={`font-serif text-lg font-bold ${
              bg === "light" ? "text-primary-700" : "text-white"
            }`}
          >
            Trellis
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h4 className="font-sans text-sm font-bold text-primary-800 dark:text-primary-100">
            {pattern.name}
          </h4>
          <div className="flex gap-1">
            {(["light", "dark", "brand"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setBg(v)}
                className={`h-5 w-5 rounded-full border-2 transition ${
                  bg === v ? "border-tan-500 ring-1 ring-tan-300" : "border-primary-200 dark:border-primary-700"
                } ${v === "light" ? "bg-white" : v === "dark" ? "bg-primary-950" : "bg-primary-600"}`}
              />
            ))}
          </div>
        </div>
        <p className="mt-1.5 text-xs text-primary-500 dark:text-primary-400">
          {pattern.description}
        </p>
      </div>

      {/* Higher-opacity strip to show the raw pattern */}
      <div className={`relative h-10 overflow-hidden border-t border-primary-100 dark:border-primary-800 rounded-b-xl ${bgClass[bg]}`}>
        <div className="absolute inset-0" style={{ ...pattern.css, opacity: Math.min(opacity[bg] * 3, 0.5) }} />
      </div>
    </div>
  );
}

function PatternsSection() {
  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
        Patterns &amp; Backdrops
      </h3>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        Subtle textures for section backgrounds, cards, and hero areas. Toggle backgrounds to preview. Shown at low opacity (3-10%) for production use; bottom strip shows the pattern at higher intensity.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {patterns.map((p) => (
          <PatternCard key={p.name} pattern={p} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Color Palette Preview
   ───────────────────────────────────────────── */
function ColorPalette() {
  const greens = [
    { label: "50", hex: C.green50 },
    { label: "100", hex: C.green100 },
    { label: "200", hex: C.green200 },
    { label: "300", hex: C.green300 },
    { label: "400", hex: C.green400 },
    { label: "500", hex: C.green500 },
    { label: "600", hex: C.green600 },
    { label: "700", hex: C.green700 },
    { label: "800", hex: C.green800 },
    { label: "900", hex: C.green900 },
    { label: "950", hex: C.green950 },
  ];
  const tans = [
    { label: "50", hex: C.tan50 },
    { label: "100", hex: C.tan100 },
    { label: "200", hex: C.tan200 },
    { label: "300", hex: C.tan300 },
    { label: "400", hex: C.tan400 },
    { label: "500", hex: C.tan500 },
    { label: "600", hex: C.tan600 },
    { label: "700", hex: C.tan700 },
    { label: "800", hex: C.tan800 },
  ];

  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
        Brand Palette
      </h3>

      <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-widest text-primary-500">
        Primary &mdash; Hunter Green
      </p>
      <div className="flex gap-1">
        {greens.map((c) => (
          <div key={c.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="h-10 w-full rounded" style={{ backgroundColor: c.hex }} />
            <span className="text-[10px] text-primary-500">{c.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-widest text-tan-600">
        Accent &mdash; Warm Tan
      </p>
      <div className="flex gap-1">
        {tans.map((c) => (
          <div key={c.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="h-10 w-full rounded" style={{ backgroundColor: c.hex }} />
            <span className="text-[10px] text-tan-600">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Typography Preview
   ───────────────────────────────────────────── */
const bodyFontOptions = [
  {
    name: "Inter",
    className: inter.className,
    vibe: "The modern SaaS standard. Razor-sharp, highly legible, neutral.",
    recommendation: true,
  },
  {
    name: "DM Sans",
    className: dmSans.className,
    vibe: "Geometric with soft curves. Friendly and warm without being childish.",
    recommendation: false,
  },
  {
    name: "Plus Jakarta Sans",
    className: plusJakarta.className,
    vibe: "Modern geometric with a premium, polished feel. Slightly wider letterforms.",
    recommendation: true,
  },
  {
    name: "Outfit",
    className: outfit.className,
    vibe: "Clean and contemporary. High x-height makes it very readable at small sizes.",
    recommendation: false,
  },
  {
    name: "Manrope",
    className: manrope.className,
    vibe: "Semi-rounded geometric. Techy but approachable — great for dashboards.",
    recommendation: false,
  },
  {
    name: "Source Sans 3",
    className: sourceSans.className,
    vibe: "Adobe's workhorse. Neutral, professional, disappears into the content.",
    recommendation: false,
  },
  {
    name: "Lato",
    className: lato.className,
    vibe: "Warm semi-rounded forms. Very readable, feels trustworthy and stable.",
    recommendation: false,
  },
  {
    name: "Raleway",
    className: raleway.className,
    vibe: "Elegant thin-to-bold range. Sophisticated, pairs naturally with serifs.",
    recommendation: false,
  },
];

const sampleHeading = "Grow Your Trellis";
const sampleBody = "Track, visualize, and grow your business referral network with a platform built for relationship-driven growth. Every vine tells a story — follow the new growth extending from every connection.";

function TypographyPreview() {
  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
        Typography
      </h3>

      {/* Display font — keeping Libre Baskerville */}
      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-tan-500">
          Display &mdash; Libre Baskerville (keeping)
        </p>
        <p className="mt-2 font-serif text-5xl font-bold text-primary-800 dark:text-primary-100">
          Trellis
        </p>
        <p className="mt-1 font-serif text-xl italic text-primary-500">
          Growing referral networks, one connection at a time.
        </p>
      </div>

      {/* Current body font */}
      <div className="mt-8 mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-primary-400">
          Current body &mdash; Nunito
        </p>
        <div className="mt-3 rounded-xl border border-primary-100 bg-primary-50/50 px-6 py-5 dark:border-primary-800 dark:bg-primary-950/50">
          <p className="font-sans text-2xl font-bold text-primary-800 dark:text-primary-100">
            {sampleHeading}
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-primary-600 dark:text-primary-400">
            {sampleBody}
          </p>
        </div>
      </div>

      {/* Alternative body fonts */}
      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-tan-500">
          Body font alternatives
        </p>
        <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
          Each card pairs the candidate with Libre Baskerville headings. All render live.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {bodyFontOptions.map((font) => (
            <div
              key={font.name}
              className={`relative rounded-xl border px-6 py-5 ${
                font.recommendation
                  ? "border-tan-300 bg-tan-50/50 dark:border-tan-700 dark:bg-tan-950/20"
                  : "border-primary-100 bg-white dark:border-primary-800 dark:bg-primary-950/50"
              }`}
            >
              {font.recommendation && (
                <span className="absolute -top-2 right-4 rounded-full bg-tan-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Strong pick
                </span>
              )}
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary-400 dark:text-primary-500">
                {font.name}
              </p>
              {/* Heading in serif + body in candidate font */}
              <p className="mt-2 font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
                {sampleHeading}
              </p>
              <p
                className={`mt-1.5 text-sm leading-relaxed text-primary-600 dark:text-primary-400 ${font.className}`}
              >
                {sampleBody}
              </p>
              <p className="mt-3 text-xs italic text-primary-400 dark:text-primary-500">
                {font.vibe}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tagline Options
   ───────────────────────────────────────────── */
const taglines = [
  {
    line: "Where referrals take root.",
    tone: "Grounded, organic",
    use: "Hero headline, email signature",
    top: true,
  },
  {
    line: "Structure your growth.",
    tone: "Strategic, confident",
    use: "Hero headline, pitch decks",
    top: true,
  },
  {
    line: "Every connection grows.",
    tone: "Warm, optimistic",
    use: "Tagline under logo, social bios",
    top: false,
  },
  {
    line: "Your network, cultivated.",
    tone: "Premium, refined",
    use: "Marketing headers, about page",
    top: false,
  },
  {
    line: "Grow relationships. Harvest results.",
    tone: "Action-oriented, dual-beat",
    use: "Landing page CTA, ads",
    top: false,
  },
  {
    line: "The referral network that grows with you.",
    tone: "Conversational, SaaS-friendly",
    use: "Explainer sections, onboarding",
    top: false,
  },
  {
    line: "From seed to signed.",
    tone: "Punchy, journey-driven",
    use: "Subheadline, social ads",
    top: true,
  },
  {
    line: "Built for how business really grows.",
    tone: "Credible, knowing",
    use: "Hero secondary line, testimonials header",
    top: false,
  },
];

function TaglineSection() {
  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
        Tagline Options
      </h3>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        Candidate taglines for hero sections, social bios, email footers, and marketing copy.
      </p>

      <div className="mt-6 space-y-3">
        {taglines.map((t) => (
          <div
            key={t.line}
            className={`relative flex items-start gap-4 rounded-xl border px-6 py-4 ${
              t.top
                ? "border-tan-300 bg-tan-50/50 dark:border-tan-700 dark:bg-tan-950/20"
                : "border-primary-100 bg-white dark:border-primary-800 dark:bg-primary-950/50"
            }`}
          >
            {t.top && (
              <span className="absolute -top-2 right-4 rounded-full bg-tan-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Top pick
              </span>
            )}
            <div className="flex-1">
              <p className="font-serif text-lg font-bold italic text-primary-800 dark:text-primary-100">
                &ldquo;{t.line}&rdquo;
              </p>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-primary-500 dark:text-primary-400">
                <span><strong className="text-primary-600 dark:text-primary-300">Tone:</strong> {t.tone}</span>
                <span><strong className="text-primary-600 dark:text-primary-300">Best for:</strong> {t.use}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Favicon & App Icon
   ───────────────────────────────────────────── */
function FaviconSection() {
  const sizes = [
    { label: "Favicon", px: 16 },
    { label: "Tab", px: 24 },
    { label: "Small", px: 32 },
    { label: "Touch", px: 48 },
    { label: "App Icon", px: 64 },
    { label: "Large", px: 96 },
  ];

  const iconCandidates: { name: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
    { name: "Classic Lattice", icon: LogoLattice },
    { name: "Vine & Trellis", icon: LogoVine },
    { name: "Abstract T", icon: LogoAbstractTv2 },
    { name: "Leaf Trellis", icon: LogoArch },
    { name: "Network Trellis", icon: LogoNetwork },
    { name: "Woven Trellis", icon: LogoWoven },
  ];

  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
        Favicon &amp; App Icon
      </h3>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        How each logo concept survives at small sizes. Icons that turn to mush below 32px are poor favicon candidates.
      </p>

      <div className="mt-6 space-y-6">
        {iconCandidates.map((candidate) => (
          <div key={candidate.name} className="rounded-xl border border-primary-100 bg-primary-50/30 p-5 dark:border-primary-800 dark:bg-primary-950/30">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-500 dark:text-primary-400">
              {candidate.name}
            </p>
            <div className="mt-3 flex items-end gap-6">
              {sizes.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2">
                  <div
                    className="flex items-center justify-center rounded bg-white shadow-sm dark:bg-primary-900"
                    style={{ width: Math.max(s.px + 8, 28), height: Math.max(s.px + 8, 28) }}
                  >
                    <candidate.icon size={s.px} color={C.green500} />
                  </div>
                  <span className="text-[10px] text-primary-400">{s.px}px</span>
                  <span className="text-[9px] text-primary-300">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Button & Component Styles
   ───────────────────────────────────────────── */
function ComponentStyles() {
  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
        Button &amp; Component Styles
      </h3>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        Core UI elements with brand colors and typography applied.
      </p>

      {/* Buttons */}
      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-tan-500">Buttons</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600">
            Primary Action
          </button>
          <button className="rounded-lg border-2 border-primary-500 px-5 py-2.5 text-sm font-semibold text-primary-600 transition hover:bg-primary-50">
            Secondary
          </button>
          <button className="rounded-lg px-5 py-2.5 text-sm font-semibold text-primary-500 transition hover:bg-primary-100">
            Ghost
          </button>
          <button className="rounded-lg bg-tan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-tan-600">
            Accent CTA
          </button>
          <button className="rounded-lg bg-red-500/90 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600">
            Destructive
          </button>
          <button className="cursor-not-allowed rounded-lg bg-primary-200 px-5 py-2.5 text-sm font-semibold text-primary-400">
            Disabled
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-tan-500">Badges &amp; Status</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">New Growth</span>
          <span className="rounded-full bg-tan-100 px-3 py-1 text-xs font-semibold text-tan-700">Pending</span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Harvested</span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">In Progress</span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Pruned</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">Inactive</span>
        </div>
      </div>

      {/* Form Inputs */}
      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-tan-500">Form Inputs</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-primary-600">Contact Name</label>
            <input
              type="text"
              placeholder="Jane Doe"
              className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm text-primary-800 placeholder-primary-300 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
              readOnly
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-primary-600">Company</label>
            <input
              type="text"
              placeholder="Acme Corp"
              className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm text-primary-800 placeholder-primary-300 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-tan-500">Cards</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-primary-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">Harvest</p>
            <p className="mt-1 font-serif text-2xl font-bold text-primary-800">$48,200</p>
            <p className="mt-0.5 text-xs text-primary-400">+12% from last month</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">Yield Rate</p>
            <p className="mt-1 font-serif text-2xl font-bold text-primary-800">34.2%</p>
            <p className="mt-0.5 text-xs text-primary-400">Across 67 vines</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-tan-500">New Growth</p>
            <p className="mt-1 font-serif text-2xl font-bold text-primary-800">23</p>
            <p className="mt-0.5 text-xs text-primary-400">This quarter</p>
          </div>
        </div>
      </div>

      {/* Notification / Toast */}
      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-tan-500">Toasts &amp; Alerts</p>
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
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Social Preview / OG Image
   ───────────────────────────────────────────── */
function SocialPreview() {
  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
        Social Preview &amp; OG Image
      </h3>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        How shared links appear on LinkedIn, Slack, and Twitter/X.
      </p>

      <div className="mt-6 space-y-6">
        {/* LinkedIn-style preview */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">LinkedIn / Slack</p>
          <div className="max-w-lg overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            {/* OG Image area */}
            <div className="relative flex h-52 items-center justify-center overflow-hidden bg-primary-600">
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: `repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 1px, transparent 16px)`,
              }} />
              <div className="relative text-center">
                <p className="font-serif text-4xl font-bold text-white">Trellis</p>
                <p className="mt-1 text-sm font-medium text-primary-100">Where referrals take root.</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs uppercase text-zinc-400">growyourtrellis.com</p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-800">Trellis — Grow Your Referral Network</p>
              <p className="mt-0.5 text-xs text-zinc-500">Track, visualize, and grow your business referral network with a platform built for relationship-driven growth.</p>
            </div>
          </div>
        </div>

        {/* Twitter-style preview */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">Twitter / X</p>
          <div className="max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="relative flex h-40 items-center justify-center overflow-hidden bg-primary-800">
              <div className="absolute inset-0 opacity-[0.05]" style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${C.tan500} 0px, ${C.tan500} 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, ${C.tan500} 0px, ${C.tan500} 1px, transparent 1px, transparent 16px)`,
              }} />
              <div className="relative flex items-center gap-3">
                <LogoNetwork size={36} color="#fff" />
                <p className="font-serif text-3xl font-bold text-white">Trellis</p>
              </div>
            </div>
            <div className="px-4 py-2.5">
              <p className="text-sm font-semibold text-zinc-800">Trellis — Grow Your Referral Network</p>
              <p className="text-xs text-zinc-500">growyourtrellis.com</p>
            </div>
          </div>
        </div>

        {/* Compact (messaging apps) */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">Compact (iMessage, Discord)</p>
          <div className="flex max-w-sm items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
              <LogoNetwork size={28} color={C.green500} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800">Trellis</p>
              <p className="text-xs text-zinc-500">growyourtrellis.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Icon Style Guide
   ───────────────────────────────────────────── */
function IconStyleGuide() {
  /* Simple SVG icons in 3 styles to show the difference */
  const styles: {
    name: string;
    description: string;
    recommended: boolean;
    icons: React.ReactNode[];
  }[] = [
    {
      name: "Outlined",
      description: "Clean line icons with 1.5–2px stroke. Airy and modern, pairs well with the serif headings without competing. Best for navigation and toolbars.",
      recommended: true,
      icons: [
        /* User outline */
        <svg key="u" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green600} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>,
        /* Building */
        <svg key="b" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green600} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><line x1="9" y1="7" x2="9" y2="7.01"/><line x1="15" y1="7" x2="15" y2="7.01"/><line x1="9" y1="11" x2="9" y2="11.01"/><line x1="15" y1="11" x2="15" y2="11.01"/><line x1="9" y1="15" x2="9" y2="15.01"/><line x1="15" y1="15" x2="15" y2="15.01"/></svg>,
        /* Chart */
        <svg key="c" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green600} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 16 8 12 12 14 16 10 20 12"/><rect x="4" y="4" width="16" height="16" rx="1"/></svg>,
        /* Network */
        <svg key="n" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green600} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><line x1="12" y1="7" x2="6" y2="17"/><line x1="12" y1="7" x2="18" y2="17"/></svg>,
        /* Mail */
        <svg key="m" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green600} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 5 12 13 21 5"/></svg>,
        /* Settings */
        <svg key="s" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green600} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></svg>,
      ],
    },
    {
      name: "Filled",
      description: "Solid filled shapes. Bolder visual weight, good for active states and emphasis. Can feel heavier in dense layouts.",
      recommended: false,
      icons: [
        <svg key="u" width="24" height="24" viewBox="0 0 24 24" fill={C.green600}><circle cx="12" cy="8" r="4.5"/><path d="M3.5 21.5c0-4.42 3.58-7.5 8.5-7.5s8.5 3.08 8.5 7.5H3.5z"/></svg>,
        <svg key="b" width="24" height="24" viewBox="0 0 24 24" fill={C.green600}><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="9" cy="7" r="1" fill="white"/><circle cx="15" cy="7" r="1" fill="white"/><circle cx="9" cy="11" r="1" fill="white"/><circle cx="15" cy="11" r="1" fill="white"/><circle cx="9" cy="15" r="1" fill="white"/><circle cx="15" cy="15" r="1" fill="white"/></svg>,
        <svg key="c" width="24" height="24" viewBox="0 0 24 24" fill={C.green600}><rect x="4" y="4" width="16" height="16" rx="2"/><polyline points="4 16 8 12 12 14 16 10 20 12" fill="none" stroke="white" strokeWidth="2"/></svg>,
        <svg key="n" width="24" height="24" viewBox="0 0 24 24" fill={C.green600}><circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="19" r="2.5"/><line x1="12" y1="7" x2="6" y2="17" stroke={C.green600} strokeWidth="2"/><line x1="12" y1="7" x2="18" y2="17" stroke={C.green600} strokeWidth="2"/></svg>,
        <svg key="m" width="24" height="24" viewBox="0 0 24 24" fill={C.green600}><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 5 12 13 21 5" fill="none" stroke="white" strokeWidth="2"/></svg>,
        <svg key="s" width="24" height="24" viewBox="0 0 24 24" fill={C.green600}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="white"/></svg>,
      ],
    },
    {
      name: "Duotone",
      description: "Outlined stroke with a light fill accent. Combines the clarity of outlined icons with a touch of visual richness. Good middle ground.",
      recommended: false,
      icons: [
        <svg key="u" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill={C.green100} stroke={C.green600} strokeWidth="1.8"/><path d="M4 21v-1a6 6 0 0112 0v1" fill={C.green100} stroke={C.green600} strokeWidth="1.8" strokeLinecap="round"/></svg>,
        <svg key="b" width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" fill={C.green100} stroke={C.green600} strokeWidth="1.8"/><circle cx="9" cy="7" r="1" fill={C.green500}/><circle cx="15" cy="7" r="1" fill={C.green500}/><circle cx="9" cy="11" r="1" fill={C.green500}/><circle cx="15" cy="11" r="1" fill={C.green500}/></svg>,
        <svg key="c" width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="1" fill={C.green100} stroke={C.green600} strokeWidth="1.8"/><polyline points="4 16 8 12 12 14 16 10 20 12" stroke={C.green500} strokeWidth="2" fill="none"/></svg>,
        <svg key="n" width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="12" y1="7" x2="6" y2="17" stroke={C.green200} strokeWidth="3"/><line x1="12" y1="7" x2="18" y2="17" stroke={C.green200} strokeWidth="3"/><circle cx="12" cy="5" r="2.5" fill={C.green100} stroke={C.green600} strokeWidth="1.5"/><circle cx="6" cy="19" r="2.5" fill={C.green100} stroke={C.green600} strokeWidth="1.5"/><circle cx="18" cy="19" r="2.5" fill={C.green100} stroke={C.green600} strokeWidth="1.5"/></svg>,
        <svg key="m" width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" fill={C.green100} stroke={C.green600} strokeWidth="1.8"/><polyline points="3 5 12 13 21 5" stroke={C.green600} strokeWidth="1.8" fill="none"/></svg>,
        <svg key="s" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill={C.green100} stroke={C.green600} strokeWidth="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke={C.green600} strokeWidth="1.8"/></svg>,
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
        Icon Style
      </h3>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        The icon style sets the visual density of the entire product. Showing user, building, chart, network, mail, and settings across three styles.
      </p>

      <div className="mt-6 space-y-4">
        {styles.map((style) => (
          <div
            key={style.name}
            className={`relative rounded-xl border px-6 py-5 ${
              style.recommended
                ? "border-tan-300 bg-tan-50/50 dark:border-tan-700 dark:bg-tan-950/20"
                : "border-primary-100 bg-white dark:border-primary-800 dark:bg-primary-950/50"
            }`}
          >
            {style.recommended && (
              <span className="absolute -top-2 right-4 rounded-full bg-tan-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Recommended
              </span>
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-primary-500">
              {style.name}
            </p>
            <div className="mt-3 flex items-center gap-5">
              {style.icons.map((icon, i) => (
                <div key={i} className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900">
                  {icon}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-primary-500 dark:text-primary-400">
              {style.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tone of Voice Card
   ───────────────────────────────────────────── */
function ToneOfVoice() {
  const principles = [
    {
      title: "Warm, not cute",
      description: "Use the vine/trellis metaphor naturally. It should feel like a consistent theme, not a puzzle users have to decode.",
      doExample: "Add your first contact to start growing your trellis.",
      dontExample: "Plant your first seedling in the digital soil of success!",
    },
    {
      title: "Confident, not pushy",
      description: "Guide users with clarity. State what things do, don't oversell or use exclamation marks excessively.",
      doExample: "Your referral network is ready to explore.",
      dontExample: "WOW! You're going to LOVE what your network can do!!!",
    },
    {
      title: "Concise, not cold",
      description: "Keep copy short and scannable but maintain a human tone. Contractions are fine.",
      doExample: "No vines yet. Add your first contact to get started.",
      dontExample: "There are currently no contacts in your database. Please navigate to the contact creation form.",
    },
    {
      title: "Helpful, not hand-holding",
      description: "Provide guidance when needed, but respect that users are professionals running real businesses.",
      doExample: "Fruit borne from this vine will appear here.",
      dontExample: "This is where you'll see deals! Deals are when someone agrees to buy something from you.",
    },
  ];

  const vocabulary = [
    { business: "Contact(s)", brand: "Vine(s)" },
    { business: "Company", brand: "Root(s)" },
    { business: "Deal(s)", brand: "Fruit" },
    { business: "Referral(s)", brand: "New Growth" },
    { business: "Pipeline", brand: "Garden" },
    { business: "Won Revenue", brand: "Harvest" },
    { business: "Conversion Rate", brand: "Yield Rate" },
    { business: "Delete contact", brand: "Prune a vine" },
    { business: "Activity", brand: "Growth Log" },
  ];

  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-sm dark:border-primary-800 dark:bg-primary-900">
      <h3 className="font-serif text-xl font-bold text-primary-800 dark:text-primary-100">
        Tone of Voice
      </h3>
      <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
        How Trellis speaks — guiding principles, vocabulary mapping, and do/don&apos;t examples.
      </p>

      {/* Principles */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {principles.map((p) => (
          <div key={p.title} className="rounded-xl border border-primary-100 bg-primary-50/30 p-5 dark:border-primary-800 dark:bg-primary-950/30">
            <p className="font-serif text-sm font-bold text-primary-800 dark:text-primary-100">{p.title}</p>
            <p className="mt-1 text-xs text-primary-500 dark:text-primary-400">{p.description}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 font-bold text-green-600">DO</span>
                <span className="italic text-primary-600 dark:text-primary-300">&ldquo;{p.doExample}&rdquo;</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 font-bold text-red-500">DON&apos;T</span>
                <span className="italic text-primary-400 line-through">&ldquo;{p.dontExample}&rdquo;</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vocabulary mapping */}
      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-tan-500">Brand Vocabulary</p>
        <p className="mt-1 text-xs text-primary-400">Used in descriptions, toasts, empty states, and KPI titles. NOT in nav labels, table headers, or button text.</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-primary-100 dark:border-primary-800">
          <div className="grid grid-cols-2 bg-primary-100/50 px-4 py-2 dark:bg-primary-800/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary-500">Business Term</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-tan-600">Trellis Term</span>
          </div>
          {vocabulary.map((v, i) => (
            <div key={v.business} className={`grid grid-cols-2 px-4 py-2 text-sm ${i % 2 === 0 ? "bg-white dark:bg-primary-950/30" : "bg-primary-50/50 dark:bg-primary-900/50"}`}>
              <span className="text-primary-600 dark:text-primary-300">{v.business}</span>
              <span className="font-medium text-primary-800 dark:text-primary-100">{v.brand}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Brand Page
   ───────────────────────────────────────────── */
const logos = [
  {
    title: "Classic Lattice",
    description:
      "A traditional diamond lattice evoking a garden trellis structure. Clean geometric lines with organic leaf accents at the intersections. Works well at all sizes.",
    icon: LogoLattice,
  },
  {
    title: "Vine & Trellis",
    description:
      "A vine climbing up a trellis frame, blending structure with organic growth. The warm tan accents suggest blooming flowers. Tells a story of growth.",
    icon: LogoVine,
  },
  {
    title: "Abstract T",
    description:
      "The letter T constructed from trellis-like lattice bars with diagonal cross-bracing. Strongly identifies the brand initial while keeping the trellis metaphor.",
    icon: LogoAbstractTv2,
  },
  {
    title: "Leaf Trellis",
    description:
      "A stylized leaf whose veins form a lattice pattern — the trellis is literally built into nature. Merges organic growth with geometric structure in a single iconic mark.",
    icon: LogoArch,
  },
  {
    title: "Network Trellis",
    description:
      "A trellis reimagined as a network graph. Nodes cascade downward like branches growing from a central root. Perfectly bridges the referral network concept with the trellis form.",
    icon: LogoNetwork,
  },
  {
    title: "Woven Trellis",
    description:
      "Interwoven horizontal and vertical bands in an over-under pattern. Abstract and modern, it suggests interconnection and the weaving together of relationships.",
    icon: LogoWoven,
  },
];

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-primary-50/50 dark:bg-primary-950">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-primary-200 bg-white dark:border-primary-800 dark:bg-primary-900">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            ${C.green500} 0px,
            ${C.green500} 1px,
            transparent 1px,
            transparent 16px
          ), repeating-linear-gradient(
            -45deg,
            ${C.green500} 0px,
            ${C.green500} 1px,
            transparent 1px,
            transparent 16px
          )`,
        }} />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-tan-500">
            Brand Exploration
          </p>
          <h1 className="mt-4 font-serif text-6xl font-bold text-primary-800 dark:text-primary-100 sm:text-7xl">
            Trellis
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-sans text-lg text-primary-500 dark:text-primary-400">
            Logo concepts and brand identity for a referral network platform that helps businesses
            grow through structured, relationship-driven connections.
          </p>
        </div>
      </header>

      {/* Logo Concepts Grid */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-serif text-2xl font-bold text-primary-800 dark:text-primary-100">
          Logo Concepts
        </h2>
        <p className="mt-2 text-sm text-primary-500 dark:text-primary-400">
          Six directions exploring the trellis metaphor. Toggle backgrounds to preview on light, dark, and brand surfaces.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {logos.map((logo, i) => (
            <LogoCard key={logo.title} title={logo.title} description={logo.description} icon={logo.icon} index={i + 1} />
          ))}
        </div>

        {/* Supporting Sections */}
        <div className="mt-16 space-y-8">
          <TaglineSection />
          <TypographyPreview />
          <PatternsSection />
          <ComponentStyles />
          <IconStyleGuide />
          <FaviconSection />
          <SocialPreview />
          <ToneOfVoice />
          <ColorPalette />
          <DomainSuggestions />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-200 py-8 text-center dark:border-primary-800">
        <p className="text-xs text-primary-400">
          Trellis &mdash; Brand Identity Exploration
        </p>
      </footer>
    </div>
  );
}
