/**
 * MBBS with Dr. Shivang lead capture endpoint.
 *
 * Setup:
 * 1. Create a Google Sheet for leads.
 * 2. Open Extensions > Apps Script.
 * 3. Paste this file into Code.gs.
 * 4. If the script is not bound to the Sheet, paste the Sheet ID below.
 * 5. Run setupLeadSheet() once.
 * 6. Deploy > New deployment > Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Paste the Web app URL into LEAD_ENDPOINT_URL in assets/app.js.
 */

const SPREADSHEET_ID = "";
const SHEET_NAME = "Leads";
const LEAD_STATUSES = ["new", "qualified", "parent call booked", "call done", "admission started", "closed", "lost"];

const HEADERS = [
  "Lead ID",
  "Submitted At",
  "Full Name",
  "Phone",
  "NEET Score",
  "Drop Years",
  "Budget",
  "Target Intake",
  "Parent Call Time",
  "Lead Status",
  "Follow-up Owner",
  "Notes",
  "Final Outcome",
  "AI Summary",
  "Source Page",
  "Landing Page",
  "Referrer",
  "UTM Source",
  "UTM Medium",
  "UTM Campaign",
  "UTM Content",
  "UTM Term",
  "Campaign ID",
  "Adset ID",
  "Ad ID",
  "Placement",
  "User Agent",
];

function doGet() {
  return jsonResponse({ ok: true, service: "mbbs-with-dr-shivang-leads" });
}

function doPost(e) {
  try {
    const payload = parsePayload(e);
    validatePayload(payload);

    const sheet = getLeadSheet();
    ensureHeaders(sheet);
    sheet.appendRow(buildRow(payload));

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || "Unknown error" });
  }
}

function setupLeadSheet() {
  const sheet = getLeadSheet();
  ensureHeaders(sheet);
  applyStatusValidation(sheet);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body.");
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error("Request body must be valid JSON.");
  }
}

function validatePayload(payload) {
  const required = ["fullName", "phone", "neet", "drops", "budget", "year", "parentCallTime"];
  required.forEach((key) => {
    if (!payload[key]) throw new Error("Missing required field: " + key);
  });
}

function buildRow(payload) {
  const attribution = payload.attribution || {};
  return [
    Utilities.getUuid(),
    payload.submittedAt || new Date().toISOString(),
    payload.fullName || "",
    payload.phone || "",
    payload.neet || "",
    payload.drops || "",
    payload.budget || "",
    payload.year || "",
    payload.parentCallTime || "",
    payload.leadStatus || "new",
    payload.followUpOwner || "Dr. Shivang",
    payload.notes || "",
    payload.finalOutcome || "",
    payload.aiSummary || "",
    payload.sourcePage || attribution.sourcePage || "",
    payload.landingPage || attribution.landingPage || "",
    payload.referrer || attribution.referrer || "",
    attribution.utm_source || "",
    attribution.utm_medium || "",
    attribution.utm_campaign || "",
    attribution.utm_content || "",
    attribution.utm_term || "",
    attribution.campaign_id || "",
    attribution.adset_id || "",
    attribution.ad_id || "",
    attribution.placement || "",
    attribution.userAgent || "",
  ];
}

function getLeadSheet() {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error("No spreadsheet found. Bind the script to a Sheet or set SPREADSHEET_ID.");
  }

  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = firstRow.some((value) => value);
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }

  const needsReset = HEADERS.some((header, index) => firstRow[index] !== header);
  if (needsReset) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function applyStatusValidation(sheet) {
  const statusColumn = HEADERS.indexOf("Lead Status") + 1;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(LEAD_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, statusColumn, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
