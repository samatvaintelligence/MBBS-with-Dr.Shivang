// Mirrors the constants from google-apps-script/lead-capture.gs

export const LEAD_STATUSES = [
  "new",
  "qualified",
  "parent call booked",
  "call done",
  "admission started",
  "closed",
  "lost",
] as const;

export const FOLLOW_UP_STAGES = [
  "new lead acknowledgement",
  "parent call booking",
  "24h no-reply fee reminder",
  "3d no-reply story + FAQ",
  "retarget proof/FAQ",
  "done",
] as const;

export const QUALIFIER_TIERS = ["hot", "warm", "nurture", "low fit"] as const;

export const MAIN_OBJECTIONS = [
  "budget",
  "parent approval",
  "eligibility",
  "timeline",
  "trust",
  "not clear yet",
] as const;

export const OPTIMIZATION_EVENTS = [
  "Lead",
  "QualifiedLead",
  "ParentCallBooked",
  "CallDone",
  "AdmissionStarted",
  "AdmissionClosed",
  "LostLead",
] as const;

export const LOST_REASONS = [
  "budget",
  "parent not convinced",
  "not eligible",
  "chose another option",
  "not responding",
  "other",
] as const;

export const WA_COUNTRY_CODE = "91";

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type FollowUpStage = (typeof FOLLOW_UP_STAGES)[number];
export type QualifierTier = (typeof QUALIFIER_TIERS)[number];
export type MainObjection = (typeof MAIN_OBJECTIONS)[number];
export type OptimizationEvent = (typeof OPTIMIZATION_EVENTS)[number];
export type LostReason = (typeof LOST_REASONS)[number];
