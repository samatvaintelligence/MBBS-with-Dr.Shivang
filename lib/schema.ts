import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

  // Identity
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  consentToContact: boolean("consent_to_contact").notNull().default(true),

  // Status workflow
  leadStatus: text("lead_status").notNull().default("new"),

  // Qualifier (computed on every write)
  qualifierScore: integer("qualifier_score"),
  qualifierTier: text("qualifier_tier"),
  mainObjection: text("main_objection"),
  recommendedNextAction: text("recommended_next_action"),

  // Follow-up (computed on every write)
  followUpStage: text("follow_up_stage"),
  nextFollowUpDue: timestamp("next_follow_up_due", { withTimezone: true }),
  followUpMessage: text("follow_up_message"),
  whatsappFollowUpLink: text("whatsapp_follow_up_link"),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  followUpAttempts: integer("follow_up_attempts").default(0),

  // Lead details (filled by Dr. Shivang during follow-up)
  parentCallTime: text("parent_call_time"),
  neetScore: text("neet_score"),
  dropYears: text("drop_years"),
  budget: text("budget"),
  targetIntake: text("target_intake"),
  notes: text("notes"),
  aiSummary: text("ai_summary"),

  // Outcome
  finalOutcome: text("final_outcome"),
  lostReason: text("lost_reason"),
  optimizationEvent: text("optimization_event"),
  outcomeUpdatedAt: timestamp("outcome_updated_at", { withTimezone: true }),
});

export const leadAttribution = pgTable("lead_attribution", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .unique()
    .references(() => leads.id),
  landingPage: text("landing_page"),
  referrer: text("referrer"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  campaignId: text("campaign_id"),
  adsetId: text("adset_id"),
  adId: text("ad_id"),
  placement: text("placement"),
  fbClickId: text("fb_click_id"),
});

export const leadActivityLog = pgTable("lead_activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  fieldChanged: text("field_changed").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedBy: text("changed_by").notNull(),
});

export const metaCampaignCache = pgTable("meta_campaign_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: text("campaign_id"),
  campaignName: text("campaign_name"),
  adsetId: text("adset_id"),
  adsetName: text("adset_name"),
  adId: text("ad_id"),
  adName: text("ad_name"),
  date: text("date"),
  spend: integer("spend"), // stored as cents
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  cpc: integer("cpc"), // stored as cents
  cpm: integer("cpm"), // stored as cents
  fetchedAt: timestamp("fetched_at", { withTimezone: true }),
});

// Type helpers
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadAttribution = typeof leadAttribution.$inferSelect;
export type NewLeadAttribution = typeof leadAttribution.$inferInsert;
export type LeadActivityLogEntry = typeof leadActivityLog.$inferSelect;
