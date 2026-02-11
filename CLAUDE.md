# Referral Genealogy - Brand Language Guide

## Tree/Branch Vocabulary

All user-facing copy in the **logged-in app** (`src/app/(app)/` and its components) must use tree/branch metaphors. This reinforces the "Referral Genealogy" brand identity.

### Vocabulary Mapping

| Business Term       | Brand Term     | Example Usage                                    |
|---------------------|----------------|--------------------------------------------------|
| Contact(s)          | Branch(es)     | "Add a new branch to your tree."                 |
| Company / Companies | Root(s)        | "Plant new roots in your network."               |
| Deal(s)             | Fruit          | "New fruit has been added to your grove."         |
| Referral(s)         | New Growth     | "Follow the new growth extending from every branch." |
| Pipeline            | Grove          | "Track the fruit growing across your grove."     |
| Won Revenue         | Harvest        | KPI title: "Harvest"                             |
| Conversion Rate     | Yield Rate     | KPI title: "Yield Rate"                          |
| Delete contact      | Prune a branch | "Are you sure you want to prune this branch?"    |
| Activity            | Growth log     | "This branch's growth log will appear here."     |

### Where to Apply Brand Language

- Page **descriptions** (the `<p>` below `<h1>` titles)
- KPI card **titles** on the dashboard
- **Empty-state** messages (e.g., "No branches yet.")
- **Toast** messages (success titles and descriptions after CRUD operations)
- **Confirmation dialogs** (e.g., delete prompts)
- **Placeholder text** in tab panels (e.g., "Fruit borne from this branch will appear here.")

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
- Mix brand terms with plain English when needed for clarity (e.g., "Add your first contact to start growing your tree.").
- Never sacrifice usability or comprehension for brand voice.
- The metaphor should feel like a consistent theme, not a puzzle the user has to decode.
