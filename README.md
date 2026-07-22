# CSM ROI App

A Customer Success ROI calculator for ClearCompany CSMs — generates a
customer-facing, print/QBR-ready ROI statement for one account at a time.
Full spec: `csm-roi-app-build-plan.md` (shared separately; not committed —
see Section 9 #11 on sanitizing real customer data before it leaves an
internal environment).

**Status:** Phase 1 (ATS module) is functionally complete against the v1
scope in Section 3 — data model, generic module system, ATS calc engine,
manual entry, in-app CSV import, persisted/frozen statements, PDF export,
AI-generated QBR narrative, and persona-aware framing are all built.
Gong integration is still blocked on IT credentials (Section 9 #7).

## Stack

- **Next.js 16** (App Router, TypeScript) — see `AGENTS.md` before touching
  routing/data-fetching conventions if anything looks unfamiliar; this
  version has real breaking changes vs. older Next.js knowledge.
- **Prisma 7 + Postgres** (`@prisma/adapter-pg`).
- **Auth.js v5** (Credentials provider, JWT sessions) — one login per CSM,
  self-service via `/register`.
- **Anthropic API** (`@anthropic-ai/sdk`, `claude-opus-4-8`) for the QBR
  email draft + talk track narrative — server-side only.
- **Zod** for module input/assumption validation.
- **Vitest** for unit tests.

## Deploying to Vercel (no terminal required)

1. **Import this repo.** Vercel dashboard → **Add New** → **Project** →
   select `cfoley-arch/CSM-ROI-` → branch
   `claude/clearcompany-csr-roi-app-1rvr8a`.
2. **Create a Postgres database.** Same project → **Storage** tab →
   **Create Database** → Postgres. This automatically sets the
   `DATABASE_URL` environment variable — no connection string to copy by
   hand. (The build command already runs `prisma migrate deploy` — see
   `package.json` — so the database schema applies automatically on every
   deploy; no manual migration step.)
3. **Add environment variables** (Project → Settings → Environment
   Variables):
   - `AUTH_SECRET` — generate one at
     [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)
     or any random 32+ character string.
   - `ANTHROPIC_API_KEY` — optional, only needed for "Generate QBR
     narrative." Without it, that one button shows a clear error banner
     instead of working; nothing else is affected.
4. **Deploy** (or redeploy, if step 2 happened after the first deploy).
   Once it's live, open the URL, click **Create an account** on the login
   page to make your own CSM login (no seed script needed), then
   **Import CSV** from the Accounts page to load the real Catalyst export.

⚠️ **Registration is currently open to anyone with the deployed URL** —
fine for testing with a link you control, but lock it down (an invite
code, or disabling `/register`) before sharing more broadly.

## Deploying to Netlify (no terminal required)

Netlify also works — it fully supports Next.js 16's App Router and Server
Actions via its Next.js Runtime (auto-detected, no config file needed).

1. **Import this repo.** Netlify dashboard → **Add new site** → **Import an
   existing project** → GitHub → select `cfoley-arch/CSM-ROI-` → branch
   `claude/clearcompany-csr-roi-app-1rvr8a`. Leave build settings on
   Netlify's Next.js defaults.
2. **Create a Postgres database.** Site → **Database** (or **Extensions**
   tab, depending on what your dashboard shows) → provision **Netlify
   Database** (powered by Neon). This sets a connection-string environment
   variable automatically — `src/lib/db/client.ts` and `prisma.config.ts`
   both check `DATABASE_URL` first and fall back to `NETLIFY_DATABASE_URL`,
   so it works either way Netlify names it.
   - If the deploy still fails with a "DATABASE_URL is not set" error,
     open Site → **Environment variables**, find whatever connection
     string variable the database step created, and copy its value into a
     new variable literally named `DATABASE_URL`.
3. **Add environment variables** (Site → **Environment variables**):
   - `AUTH_SECRET` — any random 32+ character string.
   - `ANTHROPIC_API_KEY` — optional, only needed for "Generate QBR
     narrative."
4. **Deploy.** Once live, open the URL, click **Create an account**, then
   **Import CSV** from the Accounts page.

Same registration caveat as above applies.

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
  + computed results, plus optional persona tags and AI narrative), for
  "CSMs can return later and update numbers."

## Real reference data

`src/lib/csv/catalystImport.ts` maps the Catalyst "Whitespace Map" export
onto the ATS module's metrics — only the columns Section 5 confirms are
covered get mapped; everything else (emails, workflow automations,
time-to-fill, hires) stays manual-entry. Texts sent is also mapped, from
the export's column labeled "Do Not Use" (verified usable). Import it
either through the **Import CSV** page in the app, or via the seed script
for local dev.

The CSV itself is **not committed** (real customer names/ARR/health
scores) — see `data/README.md`.

## Local development

Requires a local Postgres instance (`brew install postgresql` +
`brew services start postgresql`, or Docker, or any hosted free-tier
Postgres).

```bash
npm install
```

Create `.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/csmroi"
AUTH_SECRET="<output of: npx auth secret>"
# ANTHROPIC_API_KEY="sk-ant-..."   # optional, for narrative generation
```

```bash
npm run db:migrate   # applies prisma/migrations
npm run db:seed       # creates the dev CSM login + imports the CSV if present at data/catalyst-whitespace-map.csv
npm run dev             # http://localhost:3000
npm test                # unit tests
```

Dev login (if seeded): `cfoley@clearcompany.com` / `changeme-dev-only` —
change this immediately, it's a dev-only default.

## Open items (Section 9)

- **#7** Gong API credential timeline — pending IT. Gong-sourced fields
  stay out of scope until credentials land.
- **#12** Whether ClearInsights/ThoughtSpot can expose time-to-fill and
  hires via API — until resolved, both stay manual-entry fields in the ATS
  module.
