/**
 * Lead Engine — exact port of google-apps-script/lead-capture.gs lines 535-785.
 *
 * Every function here mirrors its Apps Script counterpart. Scoring thresholds,
 * tier boundaries, keyword lists, and message templates are ported verbatim.
 */

import { WA_COUNTRY_CODE } from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeadData {
  fullName?: string | null;
  phone?: string | null;
  leadStatus?: string | null;
  neetScore?: string | null;
  dropYears?: string | null;
  budget?: string | null;
  targetIntake?: string | null;
  parentCallTime?: string | null;
  notes?: string | null;
  finalOutcome?: string | null;
  followUpAttempts?: number | null;
  qualifierScore?: number | null;
  qualifierTier?: string | null;
  mainObjection?: string | null;
  optimizationEvent?: string | null;
  outcomeUpdatedAt?: string | null;
  createdAt?: string | null;
}

export interface ComputedFields {
  qualifierScore: number | null;
  qualifierTier: string | null;
  mainObjection: string;
  recommendedNextAction: string;
  followUpStage: string;
  nextFollowUpDue: string | null;
  followUpMessage: string;
  whatsappFollowUpLink: string;
  optimizationEvent: string;
  outcomeUpdatedAt: string | null;
}

// ---------------------------------------------------------------------------
// Master recompute function
// ---------------------------------------------------------------------------

export function recomputeLead(lead: LeadData, now?: Date): ComputedFields {
  const currentTime = now || new Date();
  const submittedAt = toDate(lead.createdAt) || currentTime;

  // Qualifier
  const hasInputs = hasQualifierInputs(lead);
  let qualifierScore: number | null = null;
  let qualifierTier: string | null = null;
  let mainObjection = "not clear yet";
  let recommendedNextAction =
    "Start the WhatsApp conversation and ask NEET score, target intake, budget, and parent call timing.";

  if (hasInputs) {
    qualifierScore = computeQualifierScore(lead);
    qualifierTier = getQualifierTier(qualifierScore);
    mainObjection = detectMainObjection(lead);
    recommendedNextAction = getRecommendedAction(
      lead,
      qualifierTier,
      mainObjection
    );
  }

  // Follow-up
  const followUpStage = computeFollowUpStage(lead, submittedAt, currentTime);
  const nextFollowUpDue = computeFollowUpDueAt(followUpStage, submittedAt);
  const followUpMessage = generateFollowUpMessage(followUpStage, lead);
  const whatsappFollowUpLink = buildWhatsappLink(
    lead.phone || "",
    followUpMessage
  );

  // Outcome
  const status = normalizeText(lead.leadStatus || "new");
  const finalOutcome = normalizeText(lead.finalOutcome);
  const optimizationEvent = computeOptimizationEvent(status, finalOutcome);
  const outcomeUpdatedAt =
    optimizationEvent === "Lead" && !finalOutcome
      ? null
      : lead.outcomeUpdatedAt || currentTime.toISOString();

  return {
    qualifierScore,
    qualifierTier,
    mainObjection,
    recommendedNextAction,
    followUpStage,
    nextFollowUpDue,
    followUpMessage,
    whatsappFollowUpLink,
    optimizationEvent,
    outcomeUpdatedAt,
  };
}

// ---------------------------------------------------------------------------
// Qualifier scoring — port of lead-capture.gs lines 568-667
// ---------------------------------------------------------------------------

function hasQualifierInputs(lead: LeadData): boolean {
  return [
    lead.neetScore,
    lead.dropYears,
    lead.budget,
    lead.targetIntake,
    lead.parentCallTime,
    lead.notes,
    lead.finalOutcome,
  ].some((value) => normalizeText(value));
}

/**
 * Port of getQualifierScore() — lead-capture.gs lines 598-633.
 *
 * NOTE: The budget scoring cascade at lines 610-614 has a logic quirk:
 * the second condition (indexOf("25") && indexOf("35")) is unreachable
 * because the first condition (indexOf("35")) already catches strings
 * containing "35". This is reproduced exactly as-is for parity.
 */
export function computeQualifierScore(lead: LeadData): number {
  let score = 0;
  const budget = normalizeText(lead.budget);
  const year = normalizeText(lead.targetIntake);
  const parentCallTime = normalizeText(lead.parentCallTime);
  const neetScore = parseNumber(lead.neetScore);
  const phoneDigits = String(lead.phone || "").replace(/\D/g, "");

  // Phone: +5 for valid 10+ digit number
  if (phoneDigits.length >= 10) score += 5;

  // NEET score: +15 for any score, +5 bonus for >=150
  if (neetScore > 0) score += 15;
  if (neetScore >= 150) score += 5;

  // Budget: keyword matching (cascade — order matters)
  if (budget.indexOf("35") !== -1) score += 25;
  else if (budget.indexOf("25") !== -1 && budget.indexOf("35") !== -1)
    score += 20; // unreachable — see note above
  else if (budget.indexOf("15") !== -1 && budget.indexOf("25") !== -1)
    score += 8;
  else if (budget.indexOf("not sure") !== -1) score += 6;

  // Target intake year
  if (year === "2026") score += 20;
  else if (year === "2027") score += 10;
  else if (year) score += 4;

  // Parent call timing
  if (parentCallTime === "today") score += 20;
  else if (parentCallTime.indexOf("tomorrow") !== -1) score += 18;
  else if (parentCallTime === "weekend") score += 12;
  else if (parentCallTime.indexOf("not sure") !== -1) score += 4;

  // Lead status progression bonus
  const status = normalizeText(lead.leadStatus);
  if (status === "qualified") score += 10;
  if (status === "parent call booked") score += 18;
  if (status === "call done") score += 22;
  if (status === "admission started" || status === "closed") score += 30;
  if (status === "lost") score = Math.min(score, 25);

  return Math.max(0, Math.min(score, 100));
}

/** Port of getQualifierTier() — lead-capture.gs lines 635-640 */
export function getQualifierTier(score: number): string {
  if (score >= 75) return "hot";
  if (score >= 55) return "warm";
  if (score >= 35) return "nurture";
  return "low fit";
}

/** Port of getMainObjection() — lead-capture.gs lines 642-656 */
export function detectMainObjection(lead: LeadData): string {
  const text = normalizeText(
    [lead.notes, lead.finalOutcome, lead.budget, lead.parentCallTime].join(" ")
  );

  if (
    text.indexOf("budget") !== -1 ||
    text.indexOf("under") !== -1 ||
    text.indexOf("15") !== -1
  )
    return "budget";
  if (
    text.indexOf("parent") !== -1 ||
    text.indexOf("father") !== -1 ||
    text.indexOf("mother") !== -1
  )
    return "parent approval";
  if (
    text.indexOf("neet") !== -1 ||
    text.indexOf("eligible") !== -1 ||
    text.indexOf("eligibility") !== -1
  )
    return "eligibility";
  if (
    text.indexOf("2027") !== -1 ||
    text.indexOf("2028") !== -1 ||
    text.indexOf("later") !== -1
  )
    return "timeline";
  if (
    text.indexOf("trust") !== -1 ||
    text.indexOf("agent") !== -1 ||
    text.indexOf("consultant") !== -1
  )
    return "trust";
  return "not clear yet";
}

/** Port of getRecommendedNextAction() — lead-capture.gs lines 658-667 */
export function getRecommendedAction(
  lead: LeadData,
  tier: string,
  objection: string
): string {
  const status = normalizeText(lead.leadStatus);
  if (status === "closed" || status === "admission started")
    return "Keep outcome updated for optimization. No sales follow-up needed.";
  if (status === "lost")
    return "Record the exact lost reason and use only light FAQ retargeting.";
  if (tier === "hot") return "Call or WhatsApp today and push a parent call.";
  if (tier === "warm")
    return "Send the parent-call message and answer the main objection.";
  if (objection === "budget")
    return "Send Chuvash fee summary and compare against India private cost.";
  if (objection === "eligibility")
    return "Clarify NEET eligibility without promising admission or visa outcomes.";
  return "Nurture with story, FAQ, and proof. Do not pressure.";
}

// ---------------------------------------------------------------------------
// Follow-up automation — port of lead-capture.gs lines 535-756
// ---------------------------------------------------------------------------

/** Port of getFollowUpStage() — lead-capture.gs lines 711-719 */
export function computeFollowUpStage(
  lead: LeadData,
  submittedAt: Date,
  now: Date
): string {
  const status = normalizeText(lead.leadStatus || "new");
  if (
    ["closed", "lost", "admission started"].indexOf(status) !== -1
  )
    return "done";
  if (
    ["qualified", "parent call booked", "call done"].indexOf(status) !== -1
  )
    return "parent call booking";

  const ageMs = now.getTime() - submittedAt.getTime();
  if (ageMs >= 3 * 24 * 60 * 60 * 1000) return "3d no-reply story + FAQ";
  if (ageMs >= 24 * 60 * 60 * 1000) return "24h no-reply fee reminder";
  return "new lead acknowledgement";
}

/** Port of getFollowUpDueAt() — lead-capture.gs lines 722-729 */
export function computeFollowUpDueAt(
  stage: string,
  submittedAt: Date
): string | null {
  if (stage === "done") return null;

  const dueAt = new Date(submittedAt.getTime());
  if (stage === "new lead acknowledgement")
    dueAt.setMinutes(dueAt.getMinutes() + 5);
  if (stage === "24h no-reply fee reminder")
    dueAt.setDate(dueAt.getDate() + 1);
  if (stage === "3d no-reply story + FAQ")
    dueAt.setDate(dueAt.getDate() + 3);
  if (stage === "parent call booking")
    dueAt.setHours(dueAt.getHours() + 1);

  return dueAt.toISOString();
}

/**
 * Port of getFollowUpMessage() — lead-capture.gs lines 731-746.
 *
 * Updated for 2026 campaign: messages are more conversational (Hinglish),
 * include social proof and credentials, and address the 4 trust gaps
 * identified in the marketing plan (no office, no past batches,
 * competitor offers, slow follow-up).
 */
export function generateFollowUpMessage(
  stage: string,
  lead: LeadData
): string {
  const firstName = getFirstName(lead.fullName);

  if (stage === "parent call booking") {
    return `Hi ${firstName}, Dr. Shivang here. Tumhara form mila. Best next step: ek free call jismein main tumhare parents ko fees, eligibility, documents, aur safety - sab clearly explain kar sakta hoon.

Main khud Russia se MBBS graduate hoon aur currently G.R.M.C Gwalior (govt hospital) mein intern. Ye guidance hai - selling nahi. Parents ke liye convenient time batao.`;
  }
  if (stage === "24h no-reply fee reminder") {
    return `Hi ${firstName}, Chuvash 2026 ka quick fee summary:

Year 1: Rs 9.12L (flights + hostel + everything included)
Years 2-6: Rs 3.35L/year
Total: Rs 25.85L over 5.8 years

Compare: India private MBBS = Rs 70L - 1.5Cr. Same NMC degree, same license.

No agent fee. No hidden charges. Main doctor hoon, consultant nahi. Parents se baat karwao - free hai.`;
  }
  if (stage === "3d no-reply story + FAQ") {
    return `Hi ${firstName}, maine bhi 3 baar NEET drop kiya tha - isliye NEET pressure aur private college fees ka tension samajhta hoon.

Agar Russia abhi bhi mind mein hai toh bata doon - Chuvash mein Indian students ki community hai, Indian mess hai, aur NMC recognized degree milti hai.

Parents ke sawaal hain? Unse seedha baat kar sakta hoon. Mera koi charge nahi hai - ye real guidance hai, experienced doctor se.`;
  }
  if (stage === "retarget proof/FAQ") {
    return `Hi ${firstName}, parents ke common sawaal about Russia MBBS:

Q: Degree India mein chalegi? A: Haan - NMC + WHO recognized. Main khud wahan se MBBS karke India mein practice kar raha hoon.

Q: Safe hai? A: Cheboksary safe university city hai. Indian mess + student community hai.

Q: Cost kitna? A: Rs 25.85L total vs Rs 70L+ India private.

Video testimonials chahiye toh bolo - students ne apna experience share kiya hai. No agent, no selling.`;
  }
  // Default: new lead acknowledgement
  return `Hi ${firstName}, main Dr. Shivang - Russia se MBBS graduate, currently G.R.M.C Gwalior mein govt hospital intern.

Tumhara MBBS Russia form mila. Baat karna completely free hai aur ye guidance hai - selling nahi.

Chuvash 2026 intake ke baare mein fees, eligibility, documents - sab bataunga. Reply karo ya call karo - main available hoon.`;
}

// ---------------------------------------------------------------------------
// WhatsApp link builder — port of lead-capture.gs lines 748-759
// ---------------------------------------------------------------------------

export function buildWhatsappLink(phone: string, message: string): string {
  const number = normalizeWhatsappNumber(phone);
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function normalizeWhatsappNumber(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return WA_COUNTRY_CODE + digits;
  return digits;
}

// ---------------------------------------------------------------------------
// Outcome / optimization — port of lead-capture.gs lines 669-709
// ---------------------------------------------------------------------------

/** Port of getOptimizationEvent() — lead-capture.gs lines 680-688 */
export function computeOptimizationEvent(
  status: string,
  finalOutcome: string
): string {
  if (status === "closed" || finalOutcome.indexOf("closed") !== -1)
    return "AdmissionClosed";
  if (status === "admission started" || finalOutcome.indexOf("admission") !== -1)
    return "AdmissionStarted";
  if (status === "lost" || finalOutcome.indexOf("lost") !== -1)
    return "LostLead";
  if (status === "call done") return "CallDone";
  if (status === "parent call booked") return "ParentCallBooked";
  if (status === "qualified") return "QualifiedLead";
  return "Lead";
}

/** Port of getConversionValue() — lead-capture.gs lines 690-700 */
export function getConversionValue(event: string): number {
  const values: Record<string, number> = {
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

/** Port of getOptimizationRecommendation() — lead-capture.gs lines 703-709 */
export function getOptimizationRecommendation(bucket: {
  leads: number;
  parentCalls: number;
  hot: number;
  admissionStarted: number;
  lost: number;
  qualified: number;
}): string {
  if (bucket.leads < 3) return "Keep collecting data.";
  if (bucket.parentCalls === 0)
    return "Pause or rewrite: leads are not becoming parent calls.";
  if (bucket.hot >= 2 || bucket.admissionStarted > 0)
    return "Keep spending cautiously and make similar creatives.";
  if (bucket.lost > bucket.qualified)
    return "Review lost reasons before scaling.";
  return "Watch for parent calls and admission-started outcomes.";
}

// ---------------------------------------------------------------------------
// Utility functions — port of lead-capture.gs lines 761-785
// ---------------------------------------------------------------------------

function getFirstName(name: string | null | undefined): string {
  const cleanName = String(name || "there").trim();
  return cleanName ? cleanName.split(/\s+/)[0] : "there";
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeText(value: string | null | undefined): string {
  return String(value || "").toLowerCase().trim();
}

function parseNumber(value: string | null | undefined): number {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}
