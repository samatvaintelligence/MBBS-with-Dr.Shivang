import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { leads, leadAttribution, leadActivityLog } from "@/lib/schema";
import { recomputeLead } from "@/lib/lead-engine";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// Editable fields that trigger recompute when changed
const EDITABLE_FIELDS = [
  "leadStatus",
  "notes",
  "finalOutcome",
  "lostReason",
  "neetScore",
  "dropYears",
  "budget",
  "targetIntake",
  "parentCallTime",
  "followUpStage",
  "followUpAttempts",
  "lastContactedAt",
  "aiSummary",
] as const;

// Map from camelCase field names to DB column names for logging
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  leadStatus: "Lead Status",
  notes: "Notes",
  finalOutcome: "Final Outcome",
  lostReason: "Lost Reason",
  neetScore: "NEET Score",
  dropYears: "Drop Years",
  budget: "Budget",
  targetIntake: "Target Intake",
  parentCallTime: "Parent Call Time",
  followUpStage: "Follow-up Stage",
  followUpAttempts: "Follow-up Attempts",
  lastContactedAt: "Last Contacted At",
  aiSummary: "AI Summary",
};

// ---------------------------------------------------------------------------
// GET /api/leads/[id] — single lead detail with attribution + activity log
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await db
      .select()
      .from(leads)
      .leftJoin(leadAttribution, eq(leads.id, leadAttribution.leadId))
      .where(eq(leads.id, id));

    if (result.length === 0) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const activityLog = await db
      .select()
      .from(leadActivityLog)
      .where(eq(leadActivityLog.leadId, id))
      .orderBy(desc(leadActivityLog.createdAt));

    return Response.json({
      ...result[0].leads,
      attribution: result[0].lead_attribution,
      activityLog,
    });
  } catch (err) {
    console.error(`GET /api/leads/${id} error:`, err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/leads/[id] — update editable fields, recompute, log changes
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get current lead
    const existing = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id));

    if (existing.length === 0) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const currentLead = existing[0];
    const body = await request.json();
    const now = new Date();

    // Build update object and log changes
    const updates: Record<string, unknown> = {
      updatedAt: now,
    };
    const logEntries: Array<{
      field: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    for (const field of EDITABLE_FIELDS) {
      if (field in body && body[field] !== (currentLead as Record<string, unknown>)[field]) {
        const oldVal = (currentLead as Record<string, unknown>)[field];
        const newVal = body[field];
        updates[field] = newVal;
        logEntries.push({
          field: FIELD_DISPLAY_NAMES[field] || field,
          oldValue: oldVal != null ? String(oldVal) : null,
          newValue: newVal != null ? String(newVal) : null,
        });
      }
    }

    if (logEntries.length === 0) {
      return Response.json({ ...currentLead, attribution: null });
    }

    // Apply direct updates first
    const mergedLead = { ...currentLead, ...updates };

    // Recompute derived fields
    // Convert Date objects to ISO strings for the lead engine
    const createdAtVal = mergedLead.createdAt instanceof Date
      ? (mergedLead.createdAt as Date).toISOString()
      : mergedLead.createdAt as string;
    const outcomeUpdatedAtVal = mergedLead.outcomeUpdatedAt instanceof Date
      ? (mergedLead.outcomeUpdatedAt as Date).toISOString()
      : mergedLead.outcomeUpdatedAt as string | null;

    const computed = recomputeLead(
      {
        fullName: mergedLead.fullName as string,
        phone: mergedLead.phone as string,
        leadStatus: mergedLead.leadStatus as string,
        neetScore: mergedLead.neetScore as string | null,
        dropYears: mergedLead.dropYears as string | null,
        budget: mergedLead.budget as string | null,
        targetIntake: mergedLead.targetIntake as string | null,
        parentCallTime: mergedLead.parentCallTime as string | null,
        notes: mergedLead.notes as string | null,
        finalOutcome: mergedLead.finalOutcome as string | null,
        followUpAttempts: mergedLead.followUpAttempts as number | null,
        outcomeUpdatedAt: outcomeUpdatedAtVal,
        createdAt: createdAtVal,
      },
      now
    );

    // Merge computed fields into updates (convert ISO strings to Date for timestamp columns)
    updates.qualifierScore = computed.qualifierScore;
    updates.qualifierTier = computed.qualifierTier;
    updates.mainObjection = computed.mainObjection;
    updates.recommendedNextAction = computed.recommendedNextAction;
    updates.followUpStage = computed.followUpStage;
    updates.nextFollowUpDue = computed.nextFollowUpDue ? new Date(computed.nextFollowUpDue) : null;
    updates.followUpMessage = computed.followUpMessage;
    updates.whatsappFollowUpLink = computed.whatsappFollowUpLink;
    updates.optimizationEvent = computed.optimizationEvent;
    updates.outcomeUpdatedAt = computed.outcomeUpdatedAt ? new Date(computed.outcomeUpdatedAt) : null;

    // Perform update
    await db.update(leads).set(updates).where(eq(leads.id, id));

    // Log all changes — Postgres generates UUID and timestamp automatically
    for (const entry of logEntries) {
      await db.insert(leadActivityLog).values({
        leadId: id,
        fieldChanged: entry.field,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        changedBy: "admin",
      });
    }

    // Return updated lead
    const updated = await db
      .select()
      .from(leads)
      .leftJoin(leadAttribution, eq(leads.id, leadAttribution.leadId))
      .where(eq(leads.id, id));

    return Response.json({
      ...updated[0].leads,
      attribution: updated[0].lead_attribution,
    });
  } catch (err) {
    console.error(`PATCH /api/leads/${id} error:`, err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
