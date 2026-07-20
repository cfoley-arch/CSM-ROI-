# CSM ROI App

A Customer Success ROI calculator for ClearCompany CSMs — generates a
customer-facing, print/QBR-ready ROI statement for one account at a time.
Full spec: `csm-roi-app-build-plan.md` (shared separately; not committed —
see Section 9 #11 on sanitizing real customer data before it leaves an
internal environment).

**Status:** Phase 1 in progress — data model, generic module system, and
the ATS module's calculation engine are built. UI is a bare-bones proof of
the pipeline (auth → real account data → computed ROI), not the final
branded statement.

## Stack

- **Next.js 16** (App Router, TypeScript) — see `AGENTS.md` before touching
  routing/data-fetching conventions if anything looks unfamiliar; this
  version has real breaking changes vs. older Next.js knowledge.
- **Prisma 7 + SQLite** for local dev (`@prisma/adapter-better-sqlite3`).
  Moving to Postgres later is a provider + adapter swap — see the comment
  at the top of `prisma/schema.prisma`; no model changes needed.
- **Auth.js v5** (Credentials provider, JWT sessions) — one login per CSM.
- **Zod** for module input/assumption validation.
- **Vitest** for the calc engine's unit tests.

## The module system

Per Section 8 of the build plan, every ROI module (ATS today; Onboarding,
Performance, LMS, Background Checks, Compensation later) is a self-contained
config satisfying `ModuleDefinition` (`src/lib/modules/types.ts`): a metrics
schema, an assumptions schema with editable defaults, and a pure
`calculate()` function. Adding a new module is one new folder under
`src/lib/modules/` plus one line in `src/lib/modules/registry.ts` — no
database or screen changes.

The ATS module (`src/lib/modules/ats/`) implements Section 4 Module 1's
granular per-action breakdown: one "Admin Time Savings" line per action
type (texts, emails, interviews, offers, background checks, workflow
automations, scorecards, onboarding packets), each driven by the *current*
period's volume, plus a delta-based "Faster Hiring Productivity" line from
the change in time-to-fill. See the doc comment at the top of
`src/lib/modules/ats/calculate.ts` for the confirmed math.

## Data model

- `Account` — one customer, with shared client-context fields (HR hourly
  rate, cost of vacancy/day, platform cost).
- `AccountModule` — which modules are active for an account + assumption
  overrides.
- `MetricSnapshot` — a dated set of usage metrics for one account + module.
  Per Section 5's resolved solve for the Catalyst CSV's snapshot-only
  limitation, the app itself is the timeline: each import or manual entry
  adds a snapshot, and a statement's baseline/current periods are just the
  two most recent snapshots.
- `ImportBatch` — one CSV upload event, fanning out into many snapshots.
- `RoiStatement` — a persisted, point-in-time ROI statement (frozen inputs
  + computed results), for "CSMs can return later and update numbers."

## Real reference data

`src/lib/csv/catalystImport.ts` maps the Catalyst "Whitespace Map" export
onto the ATS module's metrics — only the columns Section 5 confirms are
covered get mapped; everything else (texts sent, emails, workflow
automations, time-to-fill, hires) stays manual-entry.

The CSV itself is **not committed** (real customer names/ARR/health
scores). To seed your local dev database with it:

1. Drop the export at `data/catalyst-whitespace-map.csv` (see
   `data/README.md`).
2. `npm run db:seed`

Without the CSV, seeding still creates the dev CSM login
(`cfoley@clearcompany.com` / `changeme-dev-only` — change immediately,
dev-only).

## Getting started

```bash
npm install
npm run db:migrate   # applies prisma/migrations against dev.db
npm run db:seed       # creates the dev CSM login + imports the CSV if present
npm run dev             # http://localhost:3000
npm test                # calc engine unit tests
```

## Open items (Section 9)

- **#7** Gong API credential timeline — pending IT. Gong-sourced fields
  stay out of scope until credentials land.
- **#12** Whether ClearInsights/ThoughtSpot can expose time-to-fill and
  hires via API — until resolved, both stay manual-entry fields in the ATS
  module.
