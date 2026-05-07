import { db } from "@/lib/db";
import { leads, leadAttribution } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

/**
 * GET /api/leads/export — CSV export matching the 39-column Google Sheet format.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db
      .select()
      .from(leads)
      .leftJoin(leadAttribution, eq(leads.id, leadAttribution.leadId));

    // CSV headers matching Google Sheet column order
    const headers = [
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

    const rows = result.map((row) => {
      const l = row.leads;
      const a = row.lead_attribution;
      return [
        l.id,
        l.createdAt,
        l.fullName,
        l.phone,
        l.consentToContact ? "yes" : "no",
        l.leadStatus,
        l.qualifierScore ?? "",
        l.qualifierTier ?? "",
        l.mainObjection ?? "",
        l.recommendedNextAction ?? "",
        l.aiSummary ?? "",
        l.followUpStage ?? "",
        l.nextFollowUpDue ?? "",
        l.followUpMessage ?? "",
        l.whatsappFollowUpLink ?? "",
        l.lastContactedAt ?? "",
        l.followUpAttempts ?? 0,
        l.parentCallTime ?? "",
        l.neetScore ?? "",
        l.dropYears ?? "",
        l.budget ?? "",
        l.targetIntake ?? "",
        l.notes ?? "",
        l.finalOutcome ?? "",
        l.lostReason ?? "",
        l.optimizationEvent ?? "",
        l.outcomeUpdatedAt ?? "",
        a?.landingPage ?? "",
        a?.referrer ?? "",
        a?.utmSource ?? "",
        a?.utmMedium ?? "",
        a?.utmCampaign ?? "",
        a?.utmContent ?? "",
        a?.utmTerm ?? "",
        a?.campaignId ?? "",
        a?.adsetId ?? "",
        a?.adId ?? "",
        a?.placement ?? "",
        a?.fbClickId ?? "",
      ];
    });

    const csvContent = [
      headers.map(escapeCsvField).join(","),
      ...rows.map((row) => row.map(escapeCsvField).join(",")),
    ].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("GET /api/leads/export error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function escapeCsvField(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
