import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { leads, leadAttribution, leadActivityLog } from "@/lib/schema";
import { recomputeLead } from "@/lib/lead-engine";
import { auth } from "@/lib/auth";
import { eq, like, or, desc, asc, sql, and } from "drizzle-orm";

// ---------------------------------------------------------------------------
// POST /api/leads — public endpoint (replaces Apps Script doPost)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // The form sends Content-Type: text/plain (legacy from Apps Script CORS workaround)
    // so we read as text and parse manually to be safe
    let payload;
    try {
      payload = await request.json();
    } catch {
      const text = await request.text();
      payload = JSON.parse(text);
    }

    // Validate required fields
    if (!payload.fullName || !payload.phone) {
      return Response.json(
        { ok: false, error: "Missing required field: fullName or phone" },
        { status: 400 }
      );
    }

    const now = new Date();
    const attribution = payload.attribution || {};
    const submittedAt = payload.submittedAt ? new Date(payload.submittedAt) : now;

    // Build lead data for computing fields
    const leadData = {
      fullName: payload.fullName,
      phone: payload.phone,
      leadStatus: payload.leadStatus || "new",
      neetScore: payload.neet || null,
      dropYears: payload.drops || null,
      budget: payload.budget || null,
      targetIntake: payload.year || null,
      parentCallTime: payload.parentCallTime || null,
      notes: payload.notes || null,
      finalOutcome: payload.finalOutcome || null,
      createdAt: submittedAt.toISOString(),
    };

    // Compute all derived fields
    const computed = recomputeLead(leadData, now);

    // Insert lead — Postgres generates UUID automatically
    const [newLead] = await db.insert(leads).values({
      createdAt: submittedAt,
      updatedAt: now,
      fullName: payload.fullName,
      phone: payload.phone,
      consentToContact: payload.consentToContact !== false,
      leadStatus: payload.leadStatus || "new",
      qualifierScore: computed.qualifierScore,
      qualifierTier: computed.qualifierTier,
      mainObjection: computed.mainObjection,
      recommendedNextAction: computed.recommendedNextAction,
      followUpStage: computed.followUpStage,
      nextFollowUpDue: computed.nextFollowUpDue ? new Date(computed.nextFollowUpDue) : null,
      followUpMessage: computed.followUpMessage,
      whatsappFollowUpLink: computed.whatsappFollowUpLink,
      lastContactedAt: null,
      followUpAttempts: 0,
      parentCallTime: payload.parentCallTime || null,
      neetScore: payload.neet || null,
      dropYears: payload.drops || null,
      budget: payload.budget || null,
      targetIntake: payload.year || null,
      notes: payload.notes || null,
      aiSummary: payload.aiSummary || null,
      finalOutcome: null,
      lostReason: null,
      optimizationEvent: computed.optimizationEvent,
      outcomeUpdatedAt: computed.outcomeUpdatedAt ? new Date(computed.outcomeUpdatedAt) : null,
    }).returning({ id: leads.id });

    const leadId = newLead.id;

    // Insert attribution
    await db.insert(leadAttribution).values({
      leadId,
      landingPage: payload.landingPage || attribution.landingPage || null,
      referrer: payload.referrer || attribution.referrer || null,
      utmSource: attribution.utm_source || null,
      utmMedium: attribution.utm_medium || null,
      utmCampaign: attribution.utm_campaign || null,
      utmContent: attribution.utm_content || null,
      utmTerm: attribution.utm_term || null,
      campaignId: attribution.campaign_id || null,
      adsetId: attribution.adset_id || null,
      adId: attribution.ad_id || null,
      placement: attribution.placement || null,
      fbClickId: attribution.fbclid || null,
    });

    // Log creation
    await db.insert(leadActivityLog).values({
      leadId,
      fieldChanged: "lead_created",
      oldValue: null,
      newValue: payload.fullName,
      changedBy: "form_submission",
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/leads error:", err);
    return Response.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/leads — protected endpoint (list leads with filters)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl;
  const status = url.searchParams.get("status");
  const tier = url.searchParams.get("tier");
  const stage = url.searchParams.get("stage");
  const search = url.searchParams.get("search");
  const sortBy = url.searchParams.get("sort") || "created_at";
  const order = url.searchParams.get("order") || "desc";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "25", 10);
  const offset = (page - 1) * limit;

  try {
    // Build where conditions
    const conditions = [];
    if (status) conditions.push(eq(leads.leadStatus, status));
    if (tier) conditions.push(eq(leads.qualifierTier, tier));
    if (stage) conditions.push(eq(leads.followUpStage, stage));
    if (search) {
      conditions.push(
        or(
          like(leads.fullName, `%${search}%`),
          like(leads.phone, `%${search}%`)
        )!
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(whereClause);
    const total = Number(countResult[0].count);

    // Determine sort column
    const sortColumn = getSortColumn(sortBy);
    const orderFn = order === "desc" ? desc : asc;

    // Get leads with attribution
    const result = await db
      .select()
      .from(leads)
      .leftJoin(leadAttribution, eq(leads.id, leadAttribution.leadId))
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    const data = result.map((row) => ({
      ...row.leads,
      attribution: row.lead_attribution,
    }));

    return Response.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/leads error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSortColumn(sortBy: string): any {
  const sortMap: Record<string, unknown> = {
    created_at: leads.createdAt,
    full_name: leads.fullName,
    lead_status: leads.leadStatus,
    qualifier_score: leads.qualifierScore,
    qualifier_tier: leads.qualifierTier,
    follow_up_stage: leads.followUpStage,
    next_follow_up_due: leads.nextFollowUpDue,
    updated_at: leads.updatedAt,
  };
  return sortMap[sortBy] || leads.createdAt;
}
