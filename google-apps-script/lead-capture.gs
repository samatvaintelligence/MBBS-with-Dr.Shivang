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

const SPREADSHEET_ID = "1OuS24ECwZBXdJrdcnlLFI00HsCUjPxvXizJjav_Bbc4";
const SHEET_NAME = "Leads";
const LEAD_STATUSES = ["new", "qualified", "parent call booked", "call done", "admission started", "closed", "lost"];
const FOLLOW_UP_STAGES = [
  "new lead acknowledgement",
  "parent call booking",
  "24h no-reply fee reminder",
  "3d no-reply story + FAQ",
  "retarget proof/FAQ",
  "done",
];
const QUALIFIER_TIERS = ["hot", "warm", "nurture", "low fit"];
const MAIN_OBJECTIONS = ["budget", "parent approval", "eligibility", "timeline", "trust", "not clear yet"];
const OPTIMIZATION_EVENTS = [
  "Lead",
  "QualifiedLead",
  "ParentCallBooked",
  "CallDone",
  "AdmissionStarted",
  "AdmissionClosed",
  "LostLead",
];
const LOST_REASONS = ["budget", "parent not convinced", "not eligible", "chose another option", "not responding", "other"];
const WA_COUNTRY_CODE = "91";
const OPTIMIZATION_SHEET_NAME = "Optimization";

const HEADERS = [
  "Lead ID",
  "Submitted At",
  "Full Name",
  "Phone",
  "Consent To Contact",
  "Lead Status",
  "Qualifier Score",
  "Qualifier Tier",
  "Main Objection",
  "Recommended Next Action",
  "AI Summary",
  "Follow-up Stage",
  "Next Follow-up Due",
  "Follow-up Message",
  "WhatsApp Follow-up Link",
  "Last Contacted At",
  "Follow-up Attempts",
  "Parent Call Time",
  "NEET Score",
  "Drop Years",
  "Budget",
  "Target Intake",
  "Notes",
  "Final Outcome",
  "Lost Reason",
  "Optimization Event",
  "Outcome Updated At",
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
  "FB Click ID",
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
    const row = buildRow(payload);
    sheet.appendRow(row);
    applyStatusValidation(sheet);
    applyFollowUpValidation(sheet);
    applyQualifierValidation(sheet);
    applyOptimizationValidation(sheet);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || "Unknown error" });
  }
}

function setupLeadSheet() {
  const sheet = getLeadSheet();
  ensureHeaders(sheet);
  applyStatusValidation(sheet);
  applyFollowUpValidation(sheet);
  applyQualifierValidation(sheet);
  applyOptimizationValidation(sheet);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 1), HEADERS.length).setWrap(true);
  installFollowUpEditTrigger();
}

function refreshFollowUpQueue() {
  const sheet = getLeadSheet();
  ensureHeaders(sheet);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const now = new Date();
  const updates = values.map((row) => {
    const lead = rowToLead(row);
    return buildFollowUpCells(lead, now);
  });

  const startColumn = HEADERS.indexOf("Follow-up Stage") + 1;
  sheet.getRange(2, startColumn, updates.length, updates[0].length).setValues(updates);
  applyStatusValidation(sheet);
  applyFollowUpValidation(sheet);
  applyQualifierValidation(sheet);
  applyOptimizationValidation(sheet);
}

function refreshQualifierAndOutcomeSignals() {
  const sheet = getLeadSheet();
  ensureHeaders(sheet);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const now = new Date();
  const qualifierUpdates = [];
  const outcomeUpdates = [];

  values.forEach((row) => {
    const lead = rowToLead(row);
    qualifierUpdates.push(buildQualifierCells(lead));
    outcomeUpdates.push(buildOutcomeCells(lead, now));
  });

  const qualifierColumn = HEADERS.indexOf("Qualifier Score") + 1;
  const outcomeColumn = HEADERS.indexOf("Optimization Event") + 1;
  sheet.getRange(2, qualifierColumn, qualifierUpdates.length, qualifierUpdates[0].length).setValues(qualifierUpdates);
  sheet.getRange(2, outcomeColumn, outcomeUpdates.length, outcomeUpdates[0].length).setValues(outcomeUpdates);
  applyQualifierValidation(sheet);
  applyOptimizationValidation(sheet);
}

function refreshOptimizationDashboard() {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  const leadsSheet = getLeadSheet();
  ensureHeaders(leadsSheet);

  const dashboard = spreadsheet.getSheetByName(OPTIMIZATION_SHEET_NAME)
    || spreadsheet.insertSheet(OPTIMIZATION_SHEET_NAME);
  dashboard.clear();

  const rows = leadsSheet.getLastRow() < 2
    ? []
    : leadsSheet.getRange(2, 1, leadsSheet.getLastRow() - 1, HEADERS.length).getValues();
  const grouped = {};

  rows.forEach((row) => {
    const lead = rowToLead(row);
    const key = [
      lead.utmCampaign || "(no campaign)",
      lead.campaignId || "",
      lead.adsetId || "",
      lead.adId || "",
      lead.placement || "",
    ].join("||");

    if (!grouped[key]) {
      grouped[key] = {
        utmCampaign: lead.utmCampaign || "(no campaign)",
        campaignId: lead.campaignId || "",
        adsetId: lead.adsetId || "",
        adId: lead.adId || "",
        placement: lead.placement || "",
        leads: 0,
        qualified: 0,
        parentCalls: 0,
        admissionStarted: 0,
        closed: 0,
        lost: 0,
        hot: 0,
        value: 0,
      };
    }

    const bucket = grouped[key];
    const status = normalizeText(lead.leadStatus);
    const tier = normalizeText(lead.qualifierTier);
    bucket.leads += 1;
    if (status === "qualified" || status === "parent call booked" || status === "call done" || status === "admission started" || status === "closed") bucket.qualified += 1;
    if (status === "parent call booked" || status === "call done" || status === "admission started" || status === "closed") bucket.parentCalls += 1;
    if (status === "admission started" || status === "closed") bucket.admissionStarted += 1;
    if (status === "closed") bucket.closed += 1;
    if (status === "lost") bucket.lost += 1;
    if (tier === "hot") bucket.hot += 1;
    bucket.value += getConversionValue(lead.optimizationEvent || getOptimizationEvent(status, normalizeText(lead.finalOutcome)));
  });

  const dashboardHeaders = [
    "UTM Campaign",
    "Campaign ID",
    "Adset ID",
    "Ad ID",
    "Placement",
    "Leads",
    "Qualified",
    "Parent Calls",
    "Admission Started",
    "Closed",
    "Lost",
    "Hot Leads",
    "Quality Value",
    "Recommended Action",
  ];
  const dashboardRows = Object.keys(grouped).map((key) => {
    const bucket = grouped[key];
    return [
      bucket.utmCampaign,
      bucket.campaignId,
      bucket.adsetId,
      bucket.adId,
      bucket.placement,
      bucket.leads,
      bucket.qualified,
      bucket.parentCalls,
      bucket.admissionStarted,
      bucket.closed,
      bucket.lost,
      bucket.hot,
      bucket.value,
      getOptimizationRecommendation(bucket),
    ];
  });

  dashboard.getRange(1, 1, 1, dashboardHeaders.length).setValues([dashboardHeaders]);
  if (dashboardRows.length) {
    dashboard.getRange(2, 1, dashboardRows.length, dashboardHeaders.length).setValues(dashboardRows);
  }
  dashboard.setFrozenRows(1);
  dashboard.autoResizeColumns(1, dashboardHeaders.length);
}

function onEdit(e) {
  handleLeadEdit(e);
}

function handleLeadEdit(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME || e.range.getRow() < 2) return;

  ensureHeaders(sheet);
  const editedColumn = e.range.getColumn();
  const editedHeader = HEADERS[editedColumn - 1];
  const editableHeaders = [
    "Lead Status",
    "Notes",
    "Final Outcome",
    "NEET Score",
    "Drop Years",
    "Budget",
    "Target Intake",
    "Parent Call Time",
    "Follow-up Stage",
    "Follow-up Attempts",
    "Lost Reason",
  ];
  if (editableHeaders.indexOf(editedHeader) === -1) return;

  const rowNumber = e.range.getRow();
  const row = sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0];
  const lead = rowToLead(row);

  const selectedStage = editedHeader === "Follow-up Stage" ? e.value : "";
  const followUp = buildFollowUpCells(lead, new Date(), selectedStage);
  updateFollowUpCells(sheet, rowNumber, followUp);
  updateQualifierCells(sheet, rowNumber, buildQualifierCells(lead));
  updateOutcomeCells(sheet, rowNumber, buildOutcomeCells(lead, new Date()));
}

function handleFollowUpEdit(e) {
  handleLeadEdit(e);
}

function installFollowUpEditTrigger() {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  const existingTrigger = ScriptApp.getProjectTriggers().some((trigger) =>
    ["handleLeadEdit", "handleFollowUpEdit"].indexOf(trigger.getHandlerFunction()) !== -1
  );
  if (existingTrigger) return;

  ScriptApp.newTrigger("handleLeadEdit")
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();
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
  const lead = {
    ...payload,
    leadStatus: payload.leadStatus || "new",
    campaignId: attribution.campaign_id || "",
    adsetId: attribution.adset_id || "",
    adId: attribution.ad_id || "",
    utmCampaign: attribution.utm_campaign || "",
  };
  const followUp = buildFollowUpCells(lead, new Date());
  const qualifier = buildQualifierCells(lead);
  const outcome = buildOutcomeCells(lead, new Date());
  return [
    Utilities.getUuid(),
    payload.submittedAt || new Date().toISOString(),
    payload.fullName || "",
    payload.phone || "",
    payload.consentToContact === false ? "no" : "yes",
    payload.leadStatus || "new",
    ...qualifier,
    payload.aiSummary || "",
    ...followUp,
    payload.parentCallTime || "",
    payload.neet || "",
    payload.drops || "",
    payload.budget || "",
    payload.year || "",
    payload.notes || "",
    payload.finalOutcome || "",
    payload.lostReason || "",
    ...outcome,
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
    attribution.fbclid || "",
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
  const currentColumnCount = sheet.getMaxColumns();
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const firstRow = sheet.getRange(1, 1, 1, currentColumnCount).getValues()[0];
  const hasHeaders = firstRow.some((value) => value);

  if (!hasHeaders) {
    ensureSheetColumns(sheet);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    trimExtraColumns(sheet);
    return;
  }

  const needsMigration = firstRow.length !== HEADERS.length
    || HEADERS.some((header, index) => firstRow[index] !== header);
  if (!needsMigration) return;

  const oldRows = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, currentColumnCount).getValues()
    : [];
  const oldIndexByHeader = {};
  firstRow.forEach((header, index) => {
    if (header && oldIndexByHeader[header] === undefined) {
      oldIndexByHeader[header] = index;
    }
  });

  ensureSheetColumns(sheet);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  if (oldRows.length) {
    const migratedRows = oldRows.map((row) =>
      HEADERS.map((header) => {
        const oldIndex = oldIndexByHeader[header];
        return oldIndex === undefined ? "" : row[oldIndex];
      })
    );
    sheet.getRange(2, 1, migratedRows.length, HEADERS.length).setValues(migratedRows);
  }

  trimExtraColumns(sheet);
}

function ensureSheetColumns(sheet) {
  const missingColumns = HEADERS.length - sheet.getMaxColumns();
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
  }
}

function trimExtraColumns(sheet) {
  const extraColumns = sheet.getMaxColumns() - HEADERS.length;
  if (extraColumns > 0) {
    sheet.deleteColumns(HEADERS.length + 1, extraColumns);
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

function applyFollowUpValidation(sheet) {
  const stageColumn = HEADERS.indexOf("Follow-up Stage") + 1;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(FOLLOW_UP_STAGES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, stageColumn, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function applyQualifierValidation(sheet) {
  applyListValidation(sheet, "Qualifier Tier", QUALIFIER_TIERS);
  applyListValidation(sheet, "Main Objection", MAIN_OBJECTIONS);
}

function applyOptimizationValidation(sheet) {
  applyListValidation(sheet, "Optimization Event", OPTIMIZATION_EVENTS);
  applyListValidation(sheet, "Lost Reason", LOST_REASONS);
}

function applyListValidation(sheet, header, values) {
  const column = HEADERS.indexOf(header) + 1;
  if (column < 1) return;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function rowToLead(row) {
  return {
    leadId: row[HEADERS.indexOf("Lead ID")],
    submittedAt: row[HEADERS.indexOf("Submitted At")],
    fullName: row[HEADERS.indexOf("Full Name")],
    phone: row[HEADERS.indexOf("Phone")],
    consentToContact: row[HEADERS.indexOf("Consent To Contact")],
    neet: row[HEADERS.indexOf("NEET Score")],
    drops: row[HEADERS.indexOf("Drop Years")],
    budget: row[HEADERS.indexOf("Budget")],
    year: row[HEADERS.indexOf("Target Intake")],
    parentCallTime: row[HEADERS.indexOf("Parent Call Time")],
    leadStatus: row[HEADERS.indexOf("Lead Status")],
    notes: row[HEADERS.indexOf("Notes")],
    finalOutcome: row[HEADERS.indexOf("Final Outcome")],
    aiSummary: row[HEADERS.indexOf("AI Summary")],
    utmSource: row[HEADERS.indexOf("UTM Source")],
    utmMedium: row[HEADERS.indexOf("UTM Medium")],
    utmCampaign: row[HEADERS.indexOf("UTM Campaign")],
    campaignId: row[HEADERS.indexOf("Campaign ID")],
    adsetId: row[HEADERS.indexOf("Adset ID")],
    adId: row[HEADERS.indexOf("Ad ID")],
    placement: row[HEADERS.indexOf("Placement")],
    followUpAttempts: row[HEADERS.indexOf("Follow-up Attempts")],
    qualifierScore: row[HEADERS.indexOf("Qualifier Score")],
    qualifierTier: row[HEADERS.indexOf("Qualifier Tier")],
    mainObjection: row[HEADERS.indexOf("Main Objection")],
    optimizationEvent: row[HEADERS.indexOf("Optimization Event")],
    lostReason: row[HEADERS.indexOf("Lost Reason")],
    outcomeUpdatedAt: row[HEADERS.indexOf("Outcome Updated At")],
  };
}

function buildFollowUpCells(lead, now, selectedStage) {
  const submittedAt = toDate(lead.submittedAt) || now;
  const stage = selectedStage || getFollowUpStage(lead, submittedAt, now);
  const dueAt = getFollowUpDueAt(stage, submittedAt);
  const message = getFollowUpMessage(stage, lead);
  const link = buildWhatsappLink(lead.phone, message);

  return [stage, dueAt, message, link, "", 0];
}

function updateFollowUpCells(sheet, rowNumber, followUp) {
  const columnsToUpdate = [
    ["Follow-up Stage", followUp[0]],
    ["Next Follow-up Due", followUp[1]],
    ["Follow-up Message", followUp[2]],
    ["WhatsApp Follow-up Link", followUp[3]],
  ];

  columnsToUpdate.forEach(([header, value]) => {
    sheet.getRange(rowNumber, HEADERS.indexOf(header) + 1).setValue(value);
  });
}

function updateQualifierCells(sheet, rowNumber, qualifier) {
  const startColumn = HEADERS.indexOf("Qualifier Score") + 1;
  sheet.getRange(rowNumber, startColumn, 1, qualifier.length).setValues([qualifier]);
}

function updateOutcomeCells(sheet, rowNumber, outcome) {
  const startColumn = HEADERS.indexOf("Optimization Event") + 1;
  sheet.getRange(rowNumber, startColumn, 1, outcome.length).setValues([outcome]);
}

function buildQualifierCells(lead) {
  const score = getQualifierScore(lead);
  const tier = getQualifierTier(score);
  const objection = getMainObjection(lead);
  const nextAction = getRecommendedNextAction(lead, tier, objection);

  return [score, tier, objection, nextAction];
}

function getQualifierScore(lead) {
  let score = 0;
  const budget = normalizeText(lead.budget);
  const year = normalizeText(lead.year);
  const parentCallTime = normalizeText(lead.parentCallTime);
  const neetScore = parseNumber(lead.neet);
  const phoneDigits = String(lead.phone || "").replace(/\D/g, "");

  if (phoneDigits.length >= 10) score += 5;

  if (neetScore > 0) score += 15;
  if (neetScore >= 150) score += 5;

  if (budget.indexOf("35") !== -1) score += 25;
  else if (budget.indexOf("25") !== -1 && budget.indexOf("35") !== -1) score += 20;
  else if (budget.indexOf("15") !== -1 && budget.indexOf("25") !== -1) score += 8;
  else if (budget.indexOf("not sure") !== -1) score += 6;

  if (year === "2026") score += 20;
  else if (year === "2027") score += 10;
  else if (year) score += 4;

  if (parentCallTime === "today") score += 20;
  else if (parentCallTime.indexOf("tomorrow") !== -1) score += 18;
  else if (parentCallTime === "weekend") score += 12;
  else if (parentCallTime.indexOf("not sure") !== -1) score += 4;

  const status = normalizeText(lead.leadStatus);
  if (status === "qualified") score += 10;
  if (status === "parent call booked") score += 18;
  if (status === "call done") score += 22;
  if (status === "admission started" || status === "closed") score += 30;
  if (status === "lost") score = Math.min(score, 25);

  return Math.max(0, Math.min(score, 100));
}

function getQualifierTier(score) {
  if (score >= 75) return "hot";
  if (score >= 55) return "warm";
  if (score >= 35) return "nurture";
  return "low fit";
}

function getMainObjection(lead) {
  const text = normalizeText([
    lead.notes,
    lead.finalOutcome,
    lead.budget,
    lead.parentCallTime,
  ].join(" "));

  if (text.indexOf("budget") !== -1 || text.indexOf("under") !== -1 || text.indexOf("15") !== -1) return "budget";
  if (text.indexOf("parent") !== -1 || text.indexOf("father") !== -1 || text.indexOf("mother") !== -1) return "parent approval";
  if (text.indexOf("neet") !== -1 || text.indexOf("eligible") !== -1 || text.indexOf("eligibility") !== -1) return "eligibility";
  if (text.indexOf("2027") !== -1 || text.indexOf("2028") !== -1 || text.indexOf("later") !== -1) return "timeline";
  if (text.indexOf("trust") !== -1 || text.indexOf("agent") !== -1 || text.indexOf("consultant") !== -1) return "trust";
  return "not clear yet";
}

function getRecommendedNextAction(lead, tier, objection) {
  const status = normalizeText(lead.leadStatus);
  if (status === "closed" || status === "admission started") return "Keep outcome updated for optimization. No sales follow-up needed.";
  if (status === "lost") return "Record the exact lost reason and use only light FAQ retargeting.";
  if (tier === "hot") return "Call or WhatsApp today and push a parent call.";
  if (tier === "warm") return "Send the parent-call message and answer the main objection.";
  if (objection === "budget") return "Send Chuvash fee summary and compare against India private cost.";
  if (objection === "eligibility") return "Clarify NEET eligibility without promising admission or visa outcomes.";
  return "Nurture with story, FAQ, and proof. Do not pressure.";
}

function buildOutcomeCells(lead, now) {
  const status = normalizeText(lead.leadStatus || "new");
  const finalOutcome = normalizeText(lead.finalOutcome);
  const event = getOptimizationEvent(status, finalOutcome);
  const outcomeUpdatedAt = event === "Lead" && !finalOutcome
    ? ""
    : lead.outcomeUpdatedAt || now;

  return [event, outcomeUpdatedAt];
}

function getOptimizationEvent(status, finalOutcome) {
  if (status === "closed" || finalOutcome.indexOf("closed") !== -1) return "AdmissionClosed";
  if (status === "admission started" || finalOutcome.indexOf("admission") !== -1) return "AdmissionStarted";
  if (status === "lost" || finalOutcome.indexOf("lost") !== -1) return "LostLead";
  if (status === "call done") return "CallDone";
  if (status === "parent call booked") return "ParentCallBooked";
  if (status === "qualified") return "QualifiedLead";
  return "Lead";
}

function getConversionValue(event) {
  const values = {
    Lead: 1,
    QualifiedLead: 5,
    ParentCallBooked: 10,
    CallDone: 15,
    AdmissionStarted: 50,
    AdmissionClosed: 100,
    LostLead: 0,
  };
  return values[event] || 0;
}

function getOptimizationRecommendation(bucket) {
  if (bucket.leads < 3) return "Keep collecting data.";
  if (bucket.parentCalls === 0) return "Pause or rewrite: leads are not becoming parent calls.";
  if (bucket.hot >= 2 || bucket.admissionStarted > 0) return "Keep spending cautiously and make similar creatives.";
  if (bucket.lost > bucket.qualified) return "Review lost reasons before scaling.";
  return "Watch for parent calls and admission-started outcomes.";
}

function getFollowUpStage(lead, submittedAt, now) {
  const status = String(lead.leadStatus || "new").toLowerCase();
  if (["closed", "lost", "admission started"].indexOf(status) !== -1) return "done";
  if (["qualified", "parent call booked", "call done"].indexOf(status) !== -1) return "parent call booking";

  const ageMs = now.getTime() - submittedAt.getTime();
  if (ageMs >= 3 * 24 * 60 * 60 * 1000) return "3d no-reply story + FAQ";
  if (ageMs >= 24 * 60 * 60 * 1000) return "24h no-reply fee reminder";
  return "new lead acknowledgement";
}

function getFollowUpDueAt(stage, submittedAt) {
  const dueAt = new Date(submittedAt.getTime());
  if (stage === "new lead acknowledgement") dueAt.setMinutes(dueAt.getMinutes() + 5);
  if (stage === "24h no-reply fee reminder") dueAt.setDate(dueAt.getDate() + 1);
  if (stage === "3d no-reply story + FAQ") dueAt.setDate(dueAt.getDate() + 3);
  if (stage === "parent call booking") dueAt.setHours(dueAt.getHours() + 1);
  return stage === "done" ? "" : dueAt;
}

function getFollowUpMessage(stage, lead) {
  const firstName = getFirstName(lead.fullName);
  if (stage === "parent call booking") {
    return "Hi " + firstName + ", this is Dr. Shivang. Based on your form, the best next step is a parent call so I can explain MBBS in Russia clearly, including fees, eligibility, and documents. Talking with me is completely free.";
  }
  if (stage === "24h no-reply fee reminder") {
    return "Hi " + firstName + ", sharing the Chuvash 2026 fee summary again: around Rs 9.12L first year including flights, then around Rs 3.35L per year, total around Rs 25.85L over 5.8 years. This is guidance, not selling. I can explain it to your parent on a free call.";
  }
  if (stage === "3d no-reply story + FAQ") {
    return "Hi " + firstName + ", I also had drop years before MBBS, so I understand the pressure around NEET and private college fees. If Russia is still on your mind, I can answer parent questions honestly from my own MBBS experience.";
  }
  if (stage === "retarget proof/FAQ") {
    return "Hi " + firstName + ", I am sharing a few common parent questions about MBBS in Russia, Chuvash, fees, and life there. No agent or consultant can offer this kind of real-world support.";
  }
  return "Hi " + firstName + ", this is Dr. Shivang. I received your MBBS Russia form. Talking with me is completely free, and this is about guidance - not selling. I can help you understand Chuvash 2026, fees, eligibility, and parent call next steps.";
}

function buildWhatsappLink(phone, message) {
  const number = normalizeWhatsappNumber(phone);
  if (!number) return "";
  return "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
}

function normalizeWhatsappNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return WA_COUNTRY_CODE + digits;
  return digits;
}

function getFirstName(name) {
  const cleanName = String(name || "there").trim();
  return cleanName ? cleanName.split(/\s+/)[0] : "there";
}

function toDate(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function parseNumber(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
