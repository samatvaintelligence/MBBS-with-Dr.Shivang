# MBBS with Dr. Shivang — project guide for Claude

## What this is

A static marketing + lead-capture site for **Dr. Shivang Gupta's** personal mentorship service that helps Indian NEET aspirants (especially droppers) enrol in MBBS at Russian government medical universities. The 2026 intake is featured at **Chuvash State University, Cheboksary**.

The brand is the founder, not a company. Dr. Shivang dropped NEET three times, graduated MBBS from Russia, currently interns at G.R.M.C Gwalior, and runs this mentorship 1:1. Every piece of copy should sound like him talking — first-person, empathetic, anti-consultant. Repeating brand promises (verbatim from the PDF):

- *"Talking with me is completely free."*
- *"This is about guidance — not selling."*
- *"No agent or consultant can offer this kind of real-world support."*

**Source of truth:** `/Users/vansh/Downloads/2026MBBSwithDr.Shivang chuvash.pdf` is the brand deck. When a content question comes up, check the PDF before inventing copy. A full synthesis lives at `/Users/vansh/.claude/plans/users-vansh-downloads-2026mbbswithdr-sh-gentle-wall.md` (read this first if you're picking up the project cold).

## Tech stack

- **Pure static HTML.** No build step, no framework, no package manager.
- **Tailwind via CDN** (`<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries">`). Each HTML file declares its own `tailwind.config = {...}` inline — these configs are duplicated across pages and **must stay in sync**. Custom design tokens (colors like `primary` `#b90039`, fonts Epilogue / Manrope, named spacing).
- **One JS file:** `assets/app.js` — vanilla, no modules. Handles WhatsApp link rewriting, tel: links, and the multi-step admissions form. (The language-page toggle is dead code now that language.html is orphaned.)
- **Photos** in `assets/img/` — all extracted from the brand PDF and resized as JPEG (max 1600px, q=85).
- **Calendly widget** loaded on `admissions.html` via `<link>` + `<script>` from `assets.calendly.com`. Popup triggered with `Calendly.initPopupWidget({url:'https://calendly.com/samatvaintelligence/30min'})`.
- **No backend.** The admissions form collects state but does not POST anywhere yet (see "Open work" below).

Open the site by double-clicking `index.html` or running a quick local server (`python3 -m http.server` from the repo root). There are no tests.

## File map

```
index.html        Home: greeting animation, hero gallery, Russia vs India comparison, founder section, testimonial carousel, CTA strip
mbbs.html         Core product page: Chuvash featured + supporting unis, course details, fees, eligibility, beyond-admission, FAQ
admissions.html   Multi-step lead form (basic info → NEET journey → review → Calendly booking modal)
life.html         Student-life lookbook + masonry gallery (testimonials moved to homepage)
language.html     ORPHANED — Russian-language prep course catalogue. No pages link to it. Do not add links back.
assets/app.js     All JS (WhatsApp, tel, form state; language toggle is dead code)
assets/img/       11 authentic photos extracted from the brand PDF
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
- **Testimonial carousel:** Three slides, auto-advances every 4 s, dot indicators. Moved here from `life.html`. Note: the testimonials are either real student paraphrases or clearly labelled — do not add fabricated quotes.
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
- **Success modal** has two CTAs: primary = "Book a call with Dr. Shivang" (triggers `Calendly.initPopupWidget({url:'https://calendly.com/samatvaintelligence/30min'})`), secondary = WhatsApp (`data-wa="1"`).
- Calendly CSS: `https://assets.calendly.com/assets/external/widget.css`
- Calendly JS: `https://assets.calendly.com/assets/external/widget.js`

### life.html
- Student-life lookbook and masonry photo gallery.
- Testimonial section was **moved to `index.html`** — do not re-add it here.

## Conventions

### WhatsApp + tel links

Anchors with `data-wa="1"` are auto-rewritten by `app.js` to `https://wa.me/919211567773?text=I%20want%20to%20be%20a%20doctor`. Anchors with `data-tel="1"` get the same number on `tel:`. **Don't hard-code the WhatsApp URL** — use the data attribute and let `app.js` handle it. Number lives in `assets/app.js` as `WA_NUMBER` / `WA_MESSAGE` constants.

### Lead-form state

`assets/app.js → initAdmissionsForm()` keeps a `state` object: `{ fullName, phone, neet, drops, budget, year }`. Each step's required inputs are validated, captured into `state`, and rendered on the review step via `renderReview()`. If you add a new field to `admissions.html`, you must also add it to the `state` object **and** to `renderReview()` — these don't auto-derive.

### Tailwind config sync

Every HTML file ships its own copy of the `tailwind.config = {...}` block (inline `<script id="tailwind-config">`). When changing design tokens, edit them in **all active** HTML files (`index`, `mbbs`, `admissions`, `life`) or visual drift will appear on whichever page you missed. Long-term this should be extracted to a shared partial, but there's no build step to do that today.

### Tone

- First-person Dr. Shivang, not "we" / "our team" / "our mentors."
- Mention drop years matter-of-factly ("Drop years are completely fine — Dr. Shivang dropped three").
- Use INR, not USD. Audience thinks in lakhs.
- The Chuvash 2026 numbers are: **₹9.12L** first year (incl. flights), **₹3.35L/yr** thereafter, **₹25.85L total** over 5.8 years. These are headline numbers — don't paraphrase them away.
- India private college comparison range: **₹70L – 1.5Cr total** (established line, used on both `index.html` and `mbbs.html`).

### Image policy

All photos in `assets/img/` are Dr. Shivang's own (extracted from the brand PDF, ©Dr. Shivang Gupta). Three places still use stock from `lh3.googleusercontent.com/aida-public/...`:

1. The three **"Also supported" university cards** on `mbbs.html` (Kazan, Pirogov, Pavlov) — the PDF only has Chuvash photos.
2. The **fictional "Ahmed Khan" testimonial avatar** on `index.html` (carousel) — the testimonial copy is fabricated. Putting a real photo behind a fake quote would be a worse honesty problem than stock. The fix is to replace the testimonial entirely with a real student quote.

If you swap an image, also rewrite any caption / `alt` text that referenced the previous image's content.

### What not to invent

The site previously claimed `1.2K+ Students Placed`, `12 Partner Universities`, `100% Visa Success`. **These were fabricated** and have been removed. Don't add metrics that aren't grounded in something real Dr. Shivang has said. Honest replacements like `3 yrs NEET dropper / 6 yrs MBBS in Russia / 1:1 mentorship` are fine.

## Open work (read before starting)

1. **Form backend is not wired.** `admissions.html` collects data, validates, and shows a success modal — but the form's `submit` handler in `app.js` does nothing with the data. Recommended path: **Google Apps Script + Sheet** (each lead becomes a spreadsheet row Dr. Shivang can triage from his phone). Alternatives: Formspree, Cloudflare Worker.
2. **Testimonial carousel has fabricated quotes.** Replace with real student paraphrases (Dr. Shivang has WhatsApp chats with 30+ students) or remove. The "Ahmed Khan" avatar is stock; do not attach a real photo to a fake quote.
3. **Three "Also supported" university cards** still use stock imagery (Kazan, Pirogov, Pavlov). Authentic photos would need to come from Dr. Shivang's Instagram or direct outreach.
4. **Tailwind configs duplicated 4×** (language.html excluded as orphaned). Consider a single `assets/tailwind-config.js` if this becomes painful.
5. **Custom chat agent (not started).** Dr. Shivang has WhatsApp chat logs from 30+ students. The plan is to feed these to Gemini API (RAG or fine-tune) and embed a chat widget that can answer prospective student queries 24/7. No implementation exists yet.
6. **Hosting not configured.** Recommended path: **GitHub → Google Cloud Storage** (static bucket + `allUsers` read + `index.html` as website suffix). CI/CD via GitHub Actions (`gsutil rsync -r . gs://bucket-name`). Custom domain via Cloud Load Balancer + managed SSL, or simply use Cloud Storage's direct URL for a quick launch.

## Reference: WhatsApp + key numbers

- WhatsApp: **+91-9211567773** (prefilled message: *"I want to be a doctor"*)
- Instagram: `@mbbswithdr.shivang`, `@dr.shivang_skywalker`
- Calendly: `https://calendly.com/samatvaintelligence/30min`
- Featured university (2026): **Chuvash State University, Cheboksary**
- Total course cost: **₹25.85L over 5.8 years** (₹9.12L yr 1 incl. flights; ₹3.35L/yr yrs 2–6)
- India private comparison: **₹70L – 1.5Cr total**
