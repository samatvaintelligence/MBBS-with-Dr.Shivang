# Lead Funnel Setup

This site now has the client-side funnel wiring, but two live values must be pasted into `assets/app.js` before paid traffic is sent to the admissions form.

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

The admissions form will show a WhatsApp fallback if this URL is blank or the endpoint fails.

## 2. Meta Pixel

1. Create or open the Meta Pixel in Events Manager.
2. Copy the Pixel ID.
3. Paste it into `META_PIXEL_ID` in `assets/app.js`.

The site fires:

- `PageView`
- `WhatsAppClick`
- `LeadFormStart`
- `LeadSubmitted`
- Standard `Lead`
- `LeadSubmitFailed`
- `CalendlyClick`

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
