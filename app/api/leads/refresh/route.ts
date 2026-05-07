import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { recomputeLead } from "@/lib/lead-engine";
import { auth } from "@/lib/auth";
import { eq, notInArray } from "drizzle-orm";

/**
 * POST /api/leads/refresh — batch recompute all active leads.
 * Replaces Apps Script refreshFollowUpQueue() + refreshQualifierAndOutcomeSignals().
 * Intended to be called by a daily Vercel cron job.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Get all active leads (not closed or lost)
    const activeLeads = await db
      .select()
      .from(leads)
      .where(notInArray(leads.leadStatus, ["closed", "lost"]));

    let updated = 0;

    for (const lead of activeLeads) {
      // Convert Postgres Date objects to ISO strings for the lead engine
      const createdAtStr = lead.createdAt instanceof Date
        ? lead.createdAt.toISOString()
        : String(lead.createdAt);
      const outcomeUpdatedAtStr = lead.outcomeUpdatedAt instanceof Date
        ? lead.outcomeUpdatedAt.toISOString()
        : lead.outcomeUpdatedAt ? String(lead.outcomeUpdatedAt) : null;

      const computed = recomputeLead(
        {
          fullName: lead.fullName,
          phone: lead.phone,
          leadStatus: lead.leadStatus,
          neetScore: lead.neetScore,
          dropYears: lead.dropYears,
          budget: lead.budget,
          targetIntake: lead.targetIntake,
          parentCallTime: lead.parentCallTime,
          notes: lead.notes,
          finalOutcome: lead.finalOutcome,
          followUpAttempts: lead.followUpAttempts,
          outcomeUpdatedAt: outcomeUpdatedAtStr,
          createdAt: createdAtStr,
        },
        now
      );

      await db
        .update(leads)
        .set({
          updatedAt: now,
          qualifierScore: computed.qualifierScore,
          qualifierTier: computed.qualifierTier,
          mainObjection: computed.mainObjection,
          recommendedNextAction: computed.recommendedNextAction,
          followUpStage: computed.followUpStage,
          nextFollowUpDue: computed.nextFollowUpDue ? new Date(computed.nextFollowUpDue) : null,
          followUpMessage: computed.followUpMessage,
          whatsappFollowUpLink: computed.whatsappFollowUpLink,
          optimizationEvent: computed.optimizationEvent,
          outcomeUpdatedAt: computed.outcomeUpdatedAt ? new Date(computed.outcomeUpdatedAt) : null,
        })
        .where(eq(leads.id, lead.id));

      updated++;
    }

    return Response.json({ ok: true, updated });
  } catch (err) {
    console.error("POST /api/leads/refresh error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
