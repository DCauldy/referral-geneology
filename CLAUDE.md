# Trellis - Brand Language Guide

## Vine & Trellis Vocabulary

All user-facing copy in the **logged-in app** (`src/app/(app)/` and its components) must use vine/trellis metaphors. This reinforces the "Trellis" brand identity.

### Vocabulary Mapping

| Business Term       | Brand Term     | Example Usage                                    |
|---------------------|----------------|--------------------------------------------------|
| Contact(s)          | Vine(s)        | "Add a new vine to your trellis."                |
| Company / Companies | Root(s)        | "Plant new roots in your network."               |
| Deal(s)             | Fruit          | "New fruit has been added to your garden."       |
| Referral(s)         | New Growth     | "Follow the new growth extending from every vine." |
| Pipeline            | Garden         | "Track the fruit growing across your garden."    |
| Won Revenue         | Harvest        | KPI title: "Harvest"                             |
| Conversion Rate     | Yield Rate     | KPI title: "Yield Rate"                          |
| Delete contact      | Prune a vine   | "Are you sure you want to prune this vine?"      |
| Activity            | Growth Log     | "This vine's growth log will appear here."       |

### Where to Apply Brand Language

- Page **descriptions** (the `<p>` below `<h1>` titles)
- KPI card **titles** on the dashboard
- **Empty-state** messages (e.g., "No vines yet.")
- **Toast** messages (success titles and descriptions after CRUD operations)
- **Confirmation dialogs** (e.g., delete prompts)
- **Placeholder text** in tab panels (e.g., "Fruit borne from this vine will appear here.")

### Where NOT to Apply Brand Language

- **Navigation labels** (sidebar, mobile nav)
- **Page `<h1>` titles** and breadcrumbs
- **Form field labels** and placeholders (e.g., "First Name", "Email")
- **Table headers** (e.g., "Name", "Email", "Status")
- **Button text** (e.g., "Add Contact", "Create Deal", "Search")
- **URLs and routes**
- **Error messages** from the system or API
- **Landing page / marketing site** (`src/app/page.tsx`)

### Tone Guidelines

- Keep the metaphor natural and light — avoid forcing it where it feels awkward.
- Mix brand terms with plain English when needed for clarity (e.g., "Add your first contact to start growing your trellis.").
- Never sacrifice usability or comprehension for brand voice.
- The metaphor should feel like a consistent theme, not a puzzle the user has to decode.
