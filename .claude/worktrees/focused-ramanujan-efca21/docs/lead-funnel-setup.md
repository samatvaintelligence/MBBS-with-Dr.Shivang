# Lead Funnel Setup

This site now has the client-side funnel wiring. The lead endpoint and Meta Pixel ID are configured locally; deploy the static files and Apps Script whenever these files change.

## 1. Google Sheet Lead Capture

1. Create a Google Sheet named something like `MBBS with Dr Shivang Leads 2026`.
2. Open `Extensions > Apps Script`.
3. Paste `google-apps-script/lead-capture.gs` into `Code.gs`.
4. Run `setupLeadSheet()` once and approve permissions.
5. Deploy as a web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Copy the web app URL.
7. Paste it into `LEAD_ENDPOINT_URL` in `assets/app.js`.

The admissions form will show a WhatsApp fallback if this URL is blank or the endpoint fails before the browser sends the request.

If `google-apps-script/lead-capture.gs` changes, redeploy the Apps Script as a new web app version before testing new Sheet columns:

1. Open Apps Script.
2. Choose `Deploy > Manage deployments`.
3. Edit the web app deployment.
4. Set `Version` to `New version`.
5. Deploy.

## 2. Meta Pixel

1. Create or open the Meta Pixel in Events Manager.
2. Copy the Pixel ID.
3. Paste it into `META_PIXEL_ID` in `assets/app.js`.

The site fires these browser events when `META_PIXEL_ID` is set:

- `PageView`
- `WhatsAppClick`
- `LeadFormStart`
- `LeadSubmitted`
- Standard `Lead`
- `LeadSubmitFailed`
- `CalendlyClick`

After the Pixel ID is added, verify in Meta Events Manager Test Events:

1. Open `admissions.html` with a test URL containing ad parameters.
2. Start the form and confirm `LeadFormStart`.
3. Submit a test lead and confirm `LeadSubmitted` plus standard `Lead`.
4. Click WhatsApp and Calendly CTAs and confirm their events.
5. Confirm the same test lead appears in the Google Sheet with campaign/adset/ad IDs.

## 3. Ad URL Parameters

Use these parameters in Meta ad URLs so each lead row stores attribution:

```text
utm_source=instagram
utm_medium=paid_social
utm_campaign={{campaign.name}}
utm_content={{ad.name}}
campaign_id={{campaign.id}}
adset_id={{adset.id}}
ad_id={{ad.id}}
placement={{placement}}
```

Example landing URL:

```text
https://your-domain.com/admissions.html?utm_source=instagram&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}
```

For website lead ads, send traffic to `admissions.html`. For proof/retargeting ads, send traffic to the most relevant page and keep the same parameters so first-touch attribution is stored if the student later opens the form.

## 4. Release 2 Test Budget

Use a small tracking test before increasing spend:

- ₹5k-₹10k total first pass.
- 60% click-to-message ads for Instagram DM + WhatsApp.
- 25% website or instant-form lead ads pointing to `admissions.html`.
- 15% retargeting to people who visited the site or engaged with Instagram.

Judge the test by qualified parent calls, not raw leads. In the Sheet, update `Lead Status`, `Final Outcome`, and `Notes` after each conversation so the next release can build follow-up automation from real outcomes.

Safe ad copy direction:

```text
For NEET students considering MBBS in Russia.
Talk directly with Dr. Shivang Gupta, an Indian doctor who studied MBBS in Russia.
Talking with me is completely free. This is about guidance — not selling.
```

Avoid copy that labels the viewer as failed, unsuccessful, or rejected. Keep the language informational and parent-safe.

## 5. Release 3 Follow-up Workflow

Release 3 keeps follow-up inside the Google Sheet. It does not auto-send WhatsApp messages. The Sheet generates the next stage, due time, message draft, and WhatsApp link so Dr. Shivang stays in control of every conversation.

After pasting the latest `google-apps-script/lead-capture.gs` into Apps Script:

1. Save the script.
2. Run `setupLeadSheet()` once. This also installs the Sheet edit trigger.
3. Deploy the web app as a new version.
4. Run `refreshFollowUpQueue()` after importing old rows or after a day of lead activity.
5. Refresh the `Leads` sheet.

Release 3 keeps only the follow-up fields Dr. Shivang needs day to day:

- `Follow-up Stage`
- `Next Follow-up Due`
- `Follow-up Message`
- `WhatsApp Follow-up Link`
- `Last Contacted At`
- `Follow-up Attempts`

Daily workflow:

1. Sort or filter by `Next Follow-up Due`.
2. Open the `WhatsApp Follow-up Link` for due leads.
3. Send only after checking the message is appropriate for that student.
4. Fill `Last Contacted At`, increment `Follow-up Attempts`, and add a short note.
5. Update `Lead Status` when the student qualifies, books a parent call, starts admission, closes, or is lost.

Follow-up stages:

- `new lead acknowledgement`: send within 5 minutes.
- `parent call booking`: use for qualified leads or leads ready for parent discussion.
- `24h no-reply fee reminder`: fee summary plus free-call reminder.
- `3d no-reply story + FAQ`: Dr. Shivang story plus parent FAQ angle.
- `retarget proof/FAQ`: use for interested-but-not-ready students when Meta retargeting audiences are available.
- `done`: closed, lost, or admission started.

Do not bulk-send these messages automatically. Each WhatsApp message is a real conversation from Dr. Shivang, so review before sending.

If you manually change `Follow-up Stage`, the edit trigger updates `Next Follow-up Due`, `Follow-up Message`, and `WhatsApp Follow-up Link` for that row. If those fields do not change, run `setupLeadSheet()` again and accept permissions so the trigger can be installed.

## 6. Release 4 Qualifier Layer

Release 4 is implemented as a private Sheet-side qualifier first. It does not expose an AI API key in the static website and it does not auto-message students. The current version uses deterministic rules from the form and CRM fields so Dr. Shivang can start scoring leads immediately while real call data accumulates.

After pasting the latest `google-apps-script/lead-capture.gs` into Apps Script:

1. Save the script.
2. Run `setupLeadSheet()` once.
3. Run `refreshQualifierAndOutcomeSignals()` once for existing rows.
4. Deploy the web app as a new version.
5. Refresh the `Leads` sheet.

Release 4 keeps the qualifier output compact:

- `Qualifier Score`
- `Qualifier Tier`
- `Main Objection`
- `Recommended Next Action`
- `AI Summary`

How to use it:

1. Sort by `Qualifier Tier` or `Qualifier Score`.
2. Treat `hot` and `warm` leads as parent-call priorities.
3. Use `Main Objection`, `Recommended Next Action`, and `AI Summary` to choose the next WhatsApp reply.
4. Keep updating `Notes`, `Final Outcome`, and `Lead Status` after calls; the edit trigger will refresh the score and next action.

This is not a full LLM chatbot yet. A real AI qualifier should only be added after 1-2 weeks of tracked leads and must run behind a secure backend such as Google Apps Script or Cloudflare Worker. Do not put Gemini/OpenAI keys in `assets/app.js`.

## 7. Release 5 Optimization Layer

Release 5 is implemented as outcome tracking for Meta optimization. It prepares the Sheet for future Meta offline conversions or Conversions API, but it does not send lead data to Meta automatically.

Release 5 keeps only the outcome fields needed for optimization:

- `Optimization Event`
- `Lost Reason`
- `Outcome Updated At`

Daily workflow:

1. Update `Lead Status` whenever a lead becomes qualified, books a parent call, completes a call, starts admission, closes, or is lost.
2. For lost leads, fill `Lost Reason`.
3. Run `refreshQualifierAndOutcomeSignals()` if you bulk edited rows.
4. Run `refreshOptimizationDashboard()` to create or refresh the `Optimization` tab.
5. Use the `Optimization` tab to compare campaigns by qualified leads, parent calls, admission starts, closed leads, lost leads, and hot leads.

The `Optimization` dashboard computes a relative quality value from `Optimization Event`; this keeps the lead row cleaner while still ranking ad quality.

Do not upload phone numbers, names, or outcome data to Meta until consent, privacy handling, and the exact upload format are reviewed.
