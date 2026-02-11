# Referral Genealogy

A SaaS platform that visualizes business referral networks like a family tree — tracking who referred whom, linking referrals to deals and revenue, and surfacing AI-powered insights to grow your network.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| Payments | Polar (Merchant of Record, subscription billing) |
| UI | Tailwind CSS v4 + Catalyst UI Kit + Headless UI |
| Visualizations | React Flow for tree & network + D3.js for galaxy |
| AI | Anthropic Claude API for insights |
| Forms | React Hook Form + Zod validation |
| Icons | Heroicons |

## Features

- **Referral Chain Tracking** — Map every referral from source to close with depth tracking and root-referrer attribution
- **Three Visualization Modes** — Tree (hierarchical), Network (force-directed graph), Galaxy (clustered by industry/geography)
- **Revenue-Linked Referrals** — Connect referrals directly to deals and track lifetime referral value per contact
- **AI-Powered Insights** — Pattern analysis, top referrer predictions, network gap identification, growth opportunities
- **Full Deal Pipeline** — Customizable Kanban board with drag-and-drop, probability tracking, referral source linking
- **CSV Import & Export** — Smart field mapping, batch processing, progress tracking
- **Team Collaboration** — Up to 25 users with role-based access (owner/admin/member/viewer) and real-time sync

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Optional) [Polar](https://polar.sh) account for billing
- (Optional) [Anthropic](https://anthropic.com) API key for AI insights

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env.local` file in the root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Optional
   POLAR_ACCESS_TOKEN=your-polar-token
   POLAR_WEBHOOK_SECRET=your-webhook-secret
   ANTHROPIC_API_KEY=your-anthropic-key
   ```

3. **Run the database migration**

   ```bash
   npx supabase db push --linked
   ```

   Or apply manually via the Supabase SQL editor using `supabase/migrations/00001_initial_schema.sql`.

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the landing page. Navigate to `/register` to create your first account.

## Project Structure

```
src/
  app/
    page.tsx                      # Marketing landing page
    (auth)/                       # Login, register, forgot/reset password
    (app)/                        # Authenticated app with sidebar layout
      dashboard/                  # KPI dashboard
      contacts/                   # Contact CRUD
      companies/                  # Company CRUD
      deals/                      # Deal pipeline (table + kanban)
      referrals/                  # Referral tracking
      visualize/                  # Tree, Network, Galaxy views
      insights/                   # AI insights
      reports/                    # Analytics & reports
      import/                     # CSV import wizard
      settings/                   # Profile, org, team, pipeline, billing
    api/                          # API routes (webhooks, AI, import/export)
  components/
    catalyst/                     # Vendored Catalyst UI Kit
    layout/                       # App shell, sidebar, topbar
    contacts/ companies/ deals/   # Data management components
    referrals/                    # Referral components
    visualizations/               # Tree, Network, Galaxy view components
    dashboard/ insights/          # Dashboard & insight components
    providers/                    # Supabase, Org, Theme, Toast providers
  lib/
    supabase/                     # Client, server, admin, middleware
    polar/                        # Billing client & plans
    ai/                           # Anthropic client & prompts
    visualization/                # Data transformers & layout algorithms
    hooks/                        # Custom data hooks
    utils/                        # Utilities (cn, format, validators, csv)
supabase/
  migrations/                     # SQL migration (15 tables, 59 RLS policies)
```

## Pricing Tiers

| | Free | Pro ($29/mo) | Team ($79/mo) |
|--|------|-------------|---------------|
| Contacts | 50 | Unlimited | Unlimited |
| Users | 1 | 1 | 25 |
| Views | Tree only | All 3 | All 3 |
| AI Insights | No | Yes | Yes |
| Import/Export | No | Yes | Yes |
| Realtime Collab | No | No | Yes |

## Design

- **Theme:** Molten Amber — warm amber/orange palette with ivory backgrounds and stone-950 dark mode
- **Typography:** Nunito (body) + Libre Baskerville (headings)
- **Dark mode:** Toggle in header, persisted to localStorage, respects system preference

## License

Private — All rights reserved.
