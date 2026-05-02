# MBBS with Dr. Shivang — project guide for Codex

## What this is

A static marketing + lead-capture site for **Dr. Shivang Gupta's** personal mentorship service that helps Indian NEET aspirants (especially droppers) enrol in MBBS at Russian government medical universities. The 2026 intake is featured at **Chuvash State University, Cheboksary**.

The brand is the founder, not a company. Dr. Shivang dropped NEET three times, graduated MBBS from Russia, currently interns at G.R.M.C Gwalior, and runs this mentorship 1:1. Every piece of copy should sound like him talking — first-person, empathetic, anti-consultant. Repeating brand promises (verbatim from the PDF):

- *"Talking with me is completely free."*
- *"This is about guidance — not selling."*
- *"No agent or consultant can offer this kind of real-world support."*

**Source of truth:** `/Users/vansh/Downloads/2026MBBSwithDr.Shivang chuvash.pdf` is the brand deck. When a content question comes up, check the PDF before inventing copy. A full synthesis lives at `/Users/vansh/.Codex/plans/users-vansh-downloads-2026mbbswithdr-sh-gentle-wall.md` (read this first if you're picking up the project cold).

## Tech stack

- **Pure static HTML.** No build step, no framework, no package manager.
- **Tailwind via CDN** (`<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries">`). Each HTML file declares its own `tailwind.config = {...}` inline — these configs are duplicated across pages and **must stay in sync**. Custom design tokens (colors like `primary` `#b90039`, fonts Epilogue / Manrope, named spacing).
- **One JS file:** `assets/app.js` — vanilla, no modules. Handles WhatsApp/tel/social link rewriting, Calendly click handling, Meta Pixel hooks, UTM/referrer attribution, and the multi-step admissions form. (The language-page toggle is dead code now that language.html is orphaned.)
- **Photos** in `assets/img/` — all extracted from the brand PDF and resized as JPEG (max 1600px, q=85).
- **Calendly widget** loaded on `admissions.html` via `<link>` + `<script>` from `assets.calendly.com`. Popup triggered with `Calendly.initPopupWidget({url:'https://calendly.com/samatvaintelligence/30min'})`.
- **Lead backend:** Google Apps Script + Google Sheet. `google-apps-script/lead-capture.gs` is the deployable endpoint template. The live deployed Web App URL is stored in `assets/app.js → LEAD_ENDPOINT_URL`. Admin lead review happens in the Google Sheet `Leads` tab.
- **Meta tracking:** `assets/app.js` has Meta Pixel hooks and `META_PIXEL_ID` is set locally. Verify events in Meta Events Manager before scaling paid traffic.

Open the site by double-clicking `index.html` or running a quick local server (`python3 -m http.server` from the repo root). There are no tests.

## File map

```
index.html        Home: greeting animation, hero gallery, Russia vs India comparison, founder section, concern carousel, CTA strip
mbbs.html         Core product page: Chuvash featured + supporting unis, course details, fees, eligibility, beyond-admission, FAQ
admissions.html   Multi-step lead form (basic info → NEET journey → review → Calendly booking modal)
life.html         Student-life lookbook + masonry gallery (testimonials moved to homepage)
language.html     ORPHANED — Russian-language prep course catalogue. No pages link to it. Do not add links back.
assets/app.js     All JS (WhatsApp/tel/social links, Calendly, Meta Pixel, attribution, admissions form; language toggle is dead code)
assets/img/       11 authentic photos extracted from the brand PDF
google-apps-script/lead-capture.gs  Google Apps Script lead endpoint template
docs/lead-funnel-setup.md  Setup notes for Google Sheets + Meta Pixel + ad URL parameters
```

## Site structure and nav

All four active pages share the same nav order (no Language link anywhere):

```
MBBS IN RUSSIA  |  LIFE IN RUSSIA  |  ADMISSIONS
```

The site title "MBBS WITH DR. SHIVANG" links back to `index.html` (homepage). There is no separate "Programs" section — the homepage IS the landing page reached by clicking the title.

## Page-by-page notes

### index.html
- **Greeting animation:** EF.com-style variable-font weight bounce across 5 languages (English, Hindi, Russian, Tamil, Telugu). Uses Epilogue variable font `font-variation-settings: 'wght'` animating from 100 → 900 on each word. Words cycle every ~1.8 s with fade-in/fade-out keyframes (`word-enter`, `word-exit`). Noto Sans is loaded as a Google Font fallback for Devanagari / Tamil / Telugu / Cyrillic scripts.
- **#programs section:** Replaced with a full-width **Russia vs India Private comparison** — two columns on desktop, stacked on mobile. Left card (dark `bg-zinc-950`) = Russia recommended path with green-check bullets and fee callouts. Right card (light `bg-surface`) = India private cautionary comparison with warning bullets. Reassurance tagline below: *"Both paths lead to the same Indian medical licence. The difference is ₹50L+ and 3 years of NEET retakes."* Russia card CTA links to `mbbs.html`.
- **Concern carousel:** Three slides, auto-advances every 4 s, dot indicators. This replaced the fabricated testimonial carousel. It should stay as honest parent/student concern messaging unless real student quotes are provided.
- **Founder photo:** Uses `object-top` to keep Dr. Shivang's face in frame.

### mbbs.html
Sub-nav and section order (top to bottom):
1. **Universities** — Chuvash featured card, then three "Also supported" cards (Kazan, Pirogov, Pavlov). Each alternate card has a "Get in touch to know more" CTA leading to `admissions.html`.
2. **Course Details**
3. **Fees** — Shows **tuition fee + hostel fee only**. Do not add other line items (flights, food, etc.) to this section; those belong in the first-year breakdown prose.
4. **Eligibility**
5. **Beyond Admission** (mentorship services)
6. **FAQs**

### admissions.html
- Multi-step form: Step 1 (basic info) → Step 2 (NEET journey) → Step 3 (review) → success modal.
- Captures `{ fullName, phone, neet, drops, budget, year, parentCallTime }` plus hidden attribution fields for UTM/ad params.
- Submits to Google Apps Script via `assets/app.js → LEAD_ENDPOINT_URL` using `fetch(..., { mode: "no-cors" })`. Apps Script responses are opaque in-browser, so a visible success modal means the browser sent the request; the Google Sheet / Apps Script executions are the source of truth.
- **Success modal** has two CTAs: primary = "Book a call with Dr. Shivang" (triggers `Calendly.initPopupWidget({url:'https://calendly.com/samatvaintelligence/30min'})`), secondary = WhatsApp (`data-wa="1"`).
- On submission failure before the request is sent, the page shows a WhatsApp fallback so the query is not missed.
- Calendly CSS: `https://assets.calendly.com/assets/external/widget.css`
- Calendly JS: `https://assets.calendly.com/assets/external/widget.js`

### life.html
- Student-life lookbook and masonry photo gallery.
- Testimonial section was **moved to `index.html`** — do not re-add it here.

## Conventions

### WhatsApp + tel links

Anchors with `data-wa="1"` are auto-rewritten by `app.js` to `https://wa.me/919211567773?text=I%20want%20to%20be%20a%20doctor`. Anchors with `data-tel="1"` get the same number on `tel:`. **Don't hard-code the WhatsApp URL** — use the data attribute and let `app.js` handle it. Number lives in `assets/app.js` as `WA_NUMBER` / `WA_MESSAGE` constants.

### Lead-form state

`assets/app.js → initAdmissionsForm()` keeps a `state` object: `{ fullName, phone, neet, drops, budget, year, parentCallTime }`. Each step's required inputs are validated, captured into `state`, and rendered on the review step via `renderReview()`. If you add a new field to `admissions.html`, you must also add it to the `state` object, `renderReview()`, and `buildLeadPayload()` — these don't auto-derive.

### Lead backend + admin access

- Live lead submissions go to the Google Sheet created from `google-apps-script/lead-capture.gs`, tab name `Leads`.
- Current admin Sheet URL: `https://docs.google.com/spreadsheets/d/1OuS24ECwZBXdJrdcnlLFI00HsCUjPxvXizJjav_Bbc4/edit`.
- `setupLeadSheet()` creates headers and dropdown validation. It also migrates existing rows by header name before trimming removed columns, so schema reorders do not scramble kept data. `doPost(e)` appends rows.
- Sheet columns are ordered for daily lead work first, then tracking: lead identity/contact, consent, status, qualifier score/tier, objection, next action, AI summary, follow-up fields, academic/budget fields, notes/outcome, landing/referrer, UTM fields, Meta campaign/adset/ad IDs, placement, and FB click ID.
- Lead status workflow: `new`, `qualified`, `parent call booked`, `call done`, `admission started`, `closed`, `lost`.
- If Apps Script code changes, saving the script is not enough. Use **Deploy → Manage deployments → Edit → Version: New version → Deploy**, then update `LEAD_ENDPOINT_URL` if the URL changes.
- If the form shows success but no row appears, check Apps Script **Executions** for a `doPost` entry. No `doPost` means the deployed URL/version/access is wrong or the page is cached.

Optimized `Leads` schema, in order:

```
Lead ID, Submitted At, Full Name, Phone, Consent To Contact,
Lead Status, Qualifier Score, Qualifier Tier, Main Objection, Recommended Next Action, AI Summary,
Follow-up Stage, Next Follow-up Due, Follow-up Message, WhatsApp Follow-up Link, Last Contacted At, Follow-up Attempts,
Parent Call Time, NEET Score, Drop Years, Budget, Target Intake,
Notes, Final Outcome, Lost Reason, Optimization Event, Outcome Updated At,
Landing Page, Referrer, UTM Source, UTM Medium, UTM Campaign, UTM Content, UTM Term,
Campaign ID, Adset ID, Ad ID, Placement, FB Click ID
```

Dropped from the Sheet to keep it usable: raw user agent, duplicate source/ad-platform fields, FBC/FBP, retargeting notes, AI-review flag, offline-upload notes, upload-ready flag, and per-row conversion value. The `Optimization` tab computes quality value from outcomes instead.

### Attribution + tracking

- `assets/app.js` stores first-touch attribution in `sessionStorage` and writes hidden fields in the admissions form.
- Supported ad params: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `campaign_id`, `adset_id`, `ad_id`, `placement`.
- Meta Pixel is initialized only when `META_PIXEL_ID` is non-empty.
- Events implemented: `PageView`, `WhatsAppClick`, `LeadFormStart`, `LeadSubmitted`, standard `Lead`, `LeadSubmitFailed`, `CalendlyClick`.
- Recommended ad URL pattern is documented in `docs/lead-funnel-setup.md`.

### Tailwind config sync

Every HTML file ships its own copy of the `tailwind.config = {...}` block (inline `<script id="tailwind-config">`). When changing design tokens, edit them in **all active** HTML files (`index`, `mbbs`, `admissions`, `life`) or visual drift will appear on whichever page you missed. Long-term this should be extracted to a shared partial, but there's no build step to do that today.

### Tone

- First-person Dr. Shivang, not "we" / "our team" / "our mentors."
- Mention drop years matter-of-factly ("Drop years are completely fine — Dr. Shivang dropped three").
- Use INR, not USD. Audience thinks in lakhs.
- The Chuvash 2026 numbers are: **₹9.12L** first year (incl. flights), **₹3.35L/yr** thereafter, **₹25.85L total** over 5.8 years. These are headline numbers — don't paraphrase them away.
- India private college comparison range: **₹70L – 1.5Cr total** (established line, used on both `index.html` and `mbbs.html`).

### Image policy

All photos in `assets/img/` are Dr. Shivang's own (extracted from the brand PDF, ©Dr. Shivang Gupta). The known remaining stock imagery is:

1. The three **"Also supported" university cards** on `mbbs.html` (Kazan, Pirogov, Pavlov) — the PDF only has Chuvash photos.

If you swap an image, also rewrite any caption / `alt` text that referenced the previous image's content.

### What not to invent

The site previously claimed `1.2K+ Students Placed`, `12 Partner Universities`, `100% Visa Success`. **These were fabricated** and have been removed. Don't add metrics that aren't grounded in something real Dr. Shivang has said. Honest replacements like `3 yrs NEET dropper / 6 yrs MBBS in Russia / 1:1 mentorship` are fine.

## Current progress

- **Release 1 lead capture is live.** Google Apps Script is deployed, `LEAD_ENDPOINT_URL` is set in `assets/app.js`, and a test form submission appeared in the Google Sheet `Leads` tab.
- **Google Sheet is the current admin panel.** Filled forms are accessed at `https://docs.google.com/spreadsheets/d/1OuS24ECwZBXdJrdcnlLFI00HsCUjPxvXizJjav_Bbc4/edit`, tab `Leads`.
- **Fake testimonials were removed.** Homepage/life-page fake testimonial content was replaced with honest parent/student concern messaging.
- **Parent-call qualification is added.** Admissions form captures `parentCallTime`; `mbbs.html` and `life.html` include parent-call CTAs.
- **UTM/ad attribution is wired.** The form captures campaign/adset/ad/placement fields and stores them in the lead row.
- **Meta Pixel is configured locally.** `META_PIXEL_ID` is set in `assets/app.js`; verify events in Meta Events Manager before scaling traffic.
- **Release 3 follow-up workflow is added locally.** `google-apps-script/lead-capture.gs` now generates follow-up stage, due time, WhatsApp draft link, message template, contact tracking, and attempt count. Paste/deploy the latest script and run `setupLeadSheet()` plus `refreshFollowUpQueue()` in Apps Script.
- **Release 4 qualifier layer is added locally.** The Sheet now computes qualifier score/tier, main objection, and recommended next action. `AI Summary` exists as the future AI/chat summary field. This is rules-based until real lead data justifies a secure AI backend.
- **Release 5 optimization layer is added locally.** The Sheet now tracks optimization event, lost reason, outcome timestamp, and an `Optimization` dashboard tab via Apps Script. It does not send data to Meta automatically.

## 2026 release roadmap

Implement the broader ads + AI plan in 5 releases, not all at once.

### Release 1 — Make lead capture live

Goal: every website query becomes a row that Dr. Shivang can track.

Status:
- Done: `google-apps-script/lead-capture.gs` deployed.
- Done: connected to Google Sheet `MBBS-with-Dr.Shivang`, tab `Leads`.
- Done: deployed Web App URL pasted into `assets/app.js → LEAD_ENDPOINT_URL`.
- Done: form submission verified in the Sheet.
- Done: real Meta Pixel ID added to `assets/app.js → META_PIXEL_ID`.
- Done: consent-to-contact line added before submit.

Admin system:
- Google Sheet is the v1 mini-CRM.
- Lead statuses: `new`, `qualified`, `parent call booked`, `call done`, `admission started`, `closed`, `lost`.

### Release 2 — Ads + tracking

Goal: identify which ads produce real parent calls and admissions intent, not just views.

- Campaign split: 60% Instagram/WhatsApp click-to-message lead ads, 25% website/instant-form lead ads, 15% retargeting.
- Every ad URL should include UTMs and Meta IDs so the Sheet records which campaign, ad set, ad, and placement produced the lead.
- Start with a ₹5k–₹10k tracking test before spending the full ₹50k test budget.
- Keep Advantage+ placements/audience on unless the early data shows waste.
- Prefer safe ad copy like “For NEET students considering MBBS in Russia” instead of copy that directly labels a person as failed or unsuccessful.

### Release 3 — Follow-up workflow

Goal: fix last year’s leakage where students used the guidance but enrolled elsewhere.

- Use the Sheet as the source of truth.
- New lead: WhatsApp acknowledgement within 5 minutes.
- Qualified lead: push parent call booking.
- No reply after 24 hours: fee summary + free-call reminder.
- No reply after 3 days: Dr. Shivang story + parent FAQ.
- Interested but not ready: retarget with proof/FAQ Reels.
- Implementation: `google-apps-script/lead-capture.gs` adds follow-up stage, next due time, WhatsApp draft link, message template, contact tracking, and attempt count. Run `setupLeadSheet()` after pasting the updated script, and use `refreshFollowUpQueue()` to refresh follow-up stages for existing rows.

### Release 4 — AI qualifier

Build only after 1–2 weeks of real tracked leads.

The AI should:
- Ask 5–6 qualifying questions.
- Answer only from approved site/PDF FAQ content.
- Score the lead.
- Summarize objections.
- Hand off to Dr. Shivang on WhatsApp or in the Sheet.

Implementation constraints:
- First version should be a static-site chat widget plus a backend proxy.
- Do not expose Gemini/OpenAI API keys in frontend code.
- Google Apps Script or Cloudflare Worker can call Gemini/OpenAI securely.
- AI writes summary + score back to the same `Leads` Sheet.
- AI must not close admissions or promise admission, visa, FMGE/NExT outcomes, seats, discounts, or unsupported claims.

### Release 5 — Optimization

Goal: optimize Meta around lead quality and admissions outcomes.

- Once admissions outcomes exist, feed quality data back to Meta using Conversions API or offline conversion upload.
- Optimize for cost per qualified lead, cost per parent call, cost per admission started, cost per admission closed, and lost reason.
- Use Sheet/CRM fields as first-party outcome data for better retargeting and creative decisions.

## Other open work

1. **Private admin dashboard not built.** Leads are currently accessed in Google Sheets. Do not expose lead data in the public static site. If a web admin UI is needed, build a separate Google Apps Script admin webapp restricted to the owner account that reads/writes the same `Leads` sheet.
2. **Three "Also supported" university cards** still use stock imagery (Kazan, Pirogov, Pavlov). Authentic photos would need to come from Dr. Shivang's Instagram or direct outreach.
3. **Tailwind configs duplicated 4×** (language.html excluded as orphaned). Consider a single `assets/tailwind-config.js` if this becomes painful.
4. **Hosting not configured.** Recommended path: **GitHub → Google Cloud Storage** (static bucket + `allUsers` read + `index.html` as website suffix). CI/CD via GitHub Actions (`gsutil rsync -r . gs://bucket-name`). Custom domain via Cloud Load Balancer + managed SSL, or simply use Cloud Storage's direct URL for a quick launch.

## Reference: WhatsApp + key numbers

- WhatsApp: **+91-9211567773** (prefilled message: *"I want to be a doctor"*)
- Instagram: `@mbbswithdr.shivang`, `@dr.shivang_skywalker`
- Calendly: `https://calendly.com/samatvaintelligence/30min`
- Featured university (2026): **Chuvash State University, Cheboksary**
- Total course cost: **₹25.85L over 5.8 years** (₹9.12L yr 1 incl. flights; ₹3.35L/yr yrs 2–6)
- India private comparison: **₹70L – 1.5Cr total**
