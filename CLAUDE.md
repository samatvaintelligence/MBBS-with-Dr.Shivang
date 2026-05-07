# MBBS with Dr. Shivang — project guide for Claude

## What this is

A marketing + lead-capture site for **Dr. Shivang Gupta's** personal mentorship service that helps Indian NEET aspirants (especially droppers) enrol in MBBS at Russian government medical universities. The 2026 intake is featured at **Chuvash State University, Cheboksary**.

The project has two layers:
1. **Static marketing pages** served from `/public` (the original HTML site, unchanged except for the form endpoint)
2. **Full-stack admin backend** built on Next.js — replaces the former Google Apps Script + Google Sheet system with a proper database, API, and admin dashboard

The brand is the founder, not a company. Dr. Shivang dropped NEET three times, graduated MBBS from Russia, currently interns at G.R.M.C Gwalior, and runs this mentorship 1:1. Every piece of copy should sound like him talking — first-person, empathetic, anti-consultant. Repeating brand promises (verbatim from the PDF):

- *"Talking with me is completely free."*
- *"This is about guidance — not selling."*
- *"No agent or consultant can offer this kind of real-world support."*

**Source of truth:** `/Users/vansh/Downloads/2026MBBSwithDr.Shivang chuvash.pdf` is the brand deck. When a content question comes up, check the PDF before inventing copy. A full synthesis lives at `/Users/vansh/.claude/plans/users-vansh-downloads-2026mbbswithdr-sh-gentle-wall.md` (read this first if you're picking up the project cold).

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 16.2.4** (App Router, Turbopack) | API routes replace Apps Script; React powers admin UI; static HTML served from `/public` |
| Database | **Supabase** (Postgres) | Hosted Postgres, free tier, row-level security available |
| ORM | **Drizzle** + `postgres-js` driver | Type-safe schema, zero runtime overhead, migration tooling |
| Auth | **NextAuth v5** (`next-auth@5.0.0-beta.25`) + Google OAuth | Single authorized email (`ADMIN_EMAIL` env var) |
| Admin UI | Tailwind CSS v4 + custom components | Tailwind v4 uses `@import "tailwindcss"` and `@theme inline {}` syntax |
| Charts | **Recharts** | Funnel and campaign charts on optimization page |
| Hosting | **Vercel** (planned) | Free tier, auto HTTPS, cron jobs, preview deploys |

### Key dependencies
- `drizzle-orm` + `drizzle-kit` — schema, migrations, queries
- `postgres` — Postgres.js driver (not `pg`, not `@supabase/supabase-js` for queries)
- `next-auth` v5 beta — auth with Google OAuth
- `recharts` — admin dashboard charts
- `@supabase/supabase-js` — installed but Drizzle handles all DB access directly via `postgres-js`

### Running locally
```bash
npm run dev          # Next.js dev server with Turbopack
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database (dev)
npm run db:migrate   # Run migrations (prod)
npm run db:studio    # Drizzle Studio GUI
```

### Environment variables
```
DATABASE_URL          — Supabase Postgres connection string (postgresql://...)
AUTH_SECRET           — NextAuth secret (openssl rand -base64 32)
NEXTAUTH_URL          — http://localhost:3000 (dev)
GOOGLE_CLIENT_ID      — Google OAuth client ID
GOOGLE_CLIENT_SECRET  — Google OAuth client secret
ADMIN_EMAIL           — Only this email can access /admin
```

## File map

```
/app
  /admin/layout.tsx              — Sidebar nav, auth gate
  /admin/page.tsx                — Dashboard overview (stats, follow-up queue)
  /admin/leads/page.tsx          — Lead table (sort, filter, inline status edit)
  /admin/leads/[id]/page.tsx     — Lead detail + edit + activity log
  /admin/optimization/page.tsx   — Campaign performance dashboard
  /admin/login/page.tsx          — Google OAuth login
  /api/leads/route.ts            — POST (public), GET (auth)
  /api/leads/[id]/route.ts       — GET + PATCH (auth)
  /api/leads/refresh/route.ts    — POST (auth) — batch recompute
  /api/leads/export/route.ts     — GET (auth) — CSV download
  /api/auth/[...nextauth]/route.ts
/lib
  /db.ts                         — Drizzle + postgres-js client
  /schema.ts                     — Drizzle Postgres table definitions
  /lead-engine.ts                — Ported qualifier/follow-up/outcome logic (1:1 from Apps Script)
  /constants.ts                  — Status lists, tiers, message templates
  /auth.ts                       — NextAuth v5 config
/components/admin/               — LeadTable, LeadDetailForm, Sidebar
/public/                         — Static HTML marketing pages (served as-is by Next.js)
  index.html, mbbs.html, admissions.html, life.html, language.html (orphaned)
  /assets/app.js                 — Vanilla JS (WhatsApp, tel, form state + submission)
  /assets/img/                   — Photos from brand PDF
/scripts/migrate-from-sheet.ts   — One-time CSV → Postgres migration
/drizzle/migrations/             — SQL migration files
/google-apps-script/lead-capture.gs — Original 786-line Apps Script (reference only)
```

## Database schema (Postgres via Drizzle)

Four tables defined in `lib/schema.ts`:

- **`leads`** — Core lead data (identity, status, qualifier scores, follow-up state, outcome). Uses `uuid` PKs with `defaultRandom()`, `timestamp({ withTimezone: true })` for dates, `boolean` for consent.
- **`lead_attribution`** — One-to-one with leads. UTM params, campaign/adset/ad IDs, fbclid.
- **`lead_activity_log`** — Audit trail of field changes. `changed_by` is one of: `form_submission`, `admin`, `system`, `migration`.
- **`meta_campaign_cache`** — Phase 3: cached Meta Marketing API data.

Important: `neetScore`, `budget`, `dropYears`, `targetIntake` are stored as `TEXT` (not numbers) because the scoring logic uses string pattern matching (e.g. `indexOf("35 lakh")`).

## Business logic: `lib/lead-engine.ts`

Exact 1:1 port of `google-apps-script/lead-capture.gs` lines 535–785. Key functions:

| Function | What it does |
|----------|--------------|
| `recomputeLead()` | Master function — calls all below, returns all computed fields |
| `computeQualifierScore()` | Scores 0–100 based on phone, NEET, budget, year, parent call, status |
| `getQualifierTier()` | hot ≥ 75, warm ≥ 55, nurture ≥ 35, low fit < 35 |
| `detectMainObjection()` | Keyword scan in notes/budget for budget/parent/eligibility/timeline/trust |
| `getRecommendedAction()` | Status/tier/objection-based action text |
| `computeFollowUpStage()` | Status-based or age-based stage progression |
| `computeFollowUpDueAt()` | 5min / +1d / +3d / +1h / null |
| `generateFollowUpMessage()` | 5 stage-specific WhatsApp templates with first-name interpolation |
| `buildWhatsappLink()` | wa.me URL, +91 normalization for 10-digit numbers |
| `computeOptimizationEvent()` | Status-to-event mapping for ad optimization |
| `getConversionValue()` | Lead=1 … AdmissionClosed=100 |

This module accepts string dates (ISO 8601) and returns string dates. API routes convert to/from Postgres `Date` objects at the boundary.

## API endpoints

**Public:**
- `POST /api/leads` — Replaces Apps Script `doPost`. Accepts the same payload shape as `app.js buildLeadPayload()`. Handles `Content-Type: text/plain` (legacy CORS workaround) by falling back to text parsing. Returns `{ ok: true }`.

**Protected (NextAuth session required):**
- `GET /api/leads` — List with sort/filter/search/pagination
- `GET /api/leads/[id]` — Single lead + attribution + activity log
- `PATCH /api/leads/[id]` — Update editable fields, auto-recompute all derived fields, log changes
- `POST /api/leads/refresh` — Batch recompute all active leads (for daily cron)
- `GET /api/leads/export` — CSV download matching 39-column Google Sheet format

## Admin dashboard pages

- **`/admin`** — 6 stat cards, follow-up queue (top 10 overdue with WhatsApp links), recent leads
- **`/admin/leads`** — Sortable/filterable table with inline status dropdown, search, pagination
- **`/admin/leads/[id]`** — Editable form (status, notes, outcome, NEET, budget, etc.), read-only computed fields, attribution section, activity log, WhatsApp copy/open buttons
- **`/admin/optimization`** — Campaign aggregation table + funnel chart (same logic as Apps Script `refreshOptimizationDashboard`)
- **`/admin/login`** — Google OAuth login with server action

## Static marketing pages (`/public`)

The original HTML pages are served unchanged from `/public`:

### Site structure and nav
All four active pages share the same nav order (no Language link):
```
MBBS IN RUSSIA  |  LIFE IN RUSSIA  |  ADMISSIONS
```
The site title "MBBS WITH DR. SHIVANG" links back to `index.html`.

### Page notes
- **index.html** — Greeting animation (variable-font weight bounce), hero gallery, Russia vs India comparison, founder section, testimonial carousel, CTA strip
- **mbbs.html** — Chuvash featured + supporting unis, course details, fees, eligibility, beyond-admission, FAQ
- **admissions.html** — Multi-step lead form → success modal with Calendly + WhatsApp CTAs. Form POSTs to `/api/leads`.
- **life.html** — Student-life lookbook + masonry gallery
- **language.html** — ORPHANED. No pages link to it. Do not add links back.

### Form submission flow
`assets/app.js` → `buildLeadPayload()` builds the payload, POSTs to `/api/leads` with `mode: "no-cors"` and `Content-Type: text/plain` (legacy from Apps Script CORS workaround). The API handles both JSON and text/plain parsing. The form JS handles both opaque and normal responses.

## Conventions

### WhatsApp + tel links
Anchors with `data-wa="1"` are auto-rewritten by `app.js` to `https://wa.me/919211567773?text=I%20want%20to%20be%20a%20doctor`. Anchors with `data-tel="1"` get the same number on `tel:`. **Don't hard-code the WhatsApp URL** — use the data attribute.

### Next.js App Router gotchas
- `params` in route handlers is a **Promise** that must be `await`ed: `const { id } = await params;`
- Tailwind v4 uses `@import "tailwindcss"` and `@theme inline {}` blocks, not v3's `tailwind.config.js`
- Static HTML pages in `/public` are served by Next.js as-is — they use Tailwind CDN with inline config (separate from the Next.js Tailwind setup)

### Tailwind config sync (marketing pages)
Every HTML file in `/public` ships its own copy of the `tailwind.config = {...}` block. When changing design tokens, edit them in **all active** HTML files or visual drift will appear.

### Tone
- First-person Dr. Shivang, not "we" / "our team" / "our mentors."
- Use INR, not USD. Audience thinks in lakhs.
- Chuvash 2026 numbers: **₹9.12L** first year, **₹3.35L/yr** thereafter, **₹25.85L total** over 5.8 years
- India private comparison: **₹70L – 1.5Cr total**

### Image policy
All photos in `assets/img/` are Dr. Shivang's own. Three places still use stock: the "Also supported" university cards on `mbbs.html` and the fictional "Ahmed Khan" testimonial avatar on `index.html`.

### What not to invent
Don't add metrics that aren't grounded in reality. Honest statements like `3 yrs NEET dropper / 6 yrs MBBS in Russia / 1:1 mentorship` are fine.

## Open work

1. **Testimonial carousel has fabricated quotes.** Replace with real student paraphrases or remove.
2. **Three "Also supported" university cards** still use stock imagery.
3. **Tailwind configs duplicated 4x** across marketing pages.
4. **Custom chat agent (not started).** Plan: Gemini API RAG over Dr. Shivang's WhatsApp chat logs.
5. **Vercel deployment not configured.** Need to set env vars and deploy.
6. **Supabase project setup.** Need to create project, get connection string, run `npm run db:push`.
7. **Google OAuth credentials.** Need real `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` for login.
8. **Meta Marketing API (Phase 3).** Campaign spend data integration.
9. **Migration script.** `scripts/migrate-from-sheet.ts` ready — needs CSV export from Google Sheet + `DATABASE_URL` set.

## Reference: WhatsApp + key numbers

- WhatsApp: **+91-9211567773** (prefilled message: *"I want to be a doctor"*)
- Instagram: `@mbbswithdr.shivang`, `@dr.shivang_skywalker`
- Calendly: `https://calendly.com/samatvaintelligence/30min`
- Featured university (2026): **Chuvash State University, Cheboksary**
- Total course cost: **₹25.85L over 5.8 years** (₹9.12L yr 1 incl. flights; ₹3.35L/yr yrs 2–6)
- India private comparison: **₹70L – 1.5Cr total**
