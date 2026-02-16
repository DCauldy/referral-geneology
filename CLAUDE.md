# Trellis - Brand Guide

## Brand Identity

Full media kit lives at `/brand`. These are the finalized decisions:

| Decision    | Value                                                        |
|-------------|--------------------------------------------------------------|
| Logo        | Network Trellis — cascading network graph SVG                |
| Tagline     | "Every connection grows."                                    |
| Typography  | **Libre Baskerville** (display/headings) + **Inter** (body/UI) |
| Colors      | Hunter Green primary (`#2f5435`) + Warm Tan accent (`#b09352`) |
| Patterns    | Trellis Lattice (45° crosshatch) + Dot Grid                 |
| Icons       | Duotone — `primary-600` stroke, `primary-100` fill           |
| Domain      | growyourtrellis.com (primary), trackwithtrellis.com (secondary) |
| Pricing     | Free $0 / Pro $29 / Team $79 / Enterprise $199              |

### Pattern CSS (reusable)

Trellis Lattice — use at 3–5% opacity on light, 6–10% on dark:
```css
background-image: repeating-linear-gradient(
  45deg, #2f5435 0px, #2f5435 1px, transparent 1px, transparent 16px
), repeating-linear-gradient(
  -45deg, #2f5435 0px, #2f5435 1px, transparent 1px, transparent 16px
);
```

Dot Grid — use at 4–8% opacity:
```css
background-image: radial-gradient(circle, #2f5435 1px, transparent 1px);
background-size: 16px 16px;
```

---

## Copy Guidelines

All user-facing copy in the **logged-in app** (`src/app/(app)/` and its components) should use clear, professional business language.

### Tone

- Keep descriptions concise and action-oriented.
- Use plain business terms (contacts, companies, deals, referrals, pipeline, network).
- Page descriptions should briefly explain what the page does.
- Toast messages should confirm what happened clearly.
- Empty states should guide the user toward their next action.

### Formatting Standards

- **Phone numbers**: Always use `formatPhone()` from `src/lib/utils/format.ts` when displaying phone numbers. Format: `(000) 000-0000` for US numbers. Never display raw/unformatted phone strings.
