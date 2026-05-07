import { db } from "@/lib/db";
import { leads, leadAttribution, leadActivityLog } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { LeadDetailForm } from "@/components/admin/lead-detail-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  const result = await db
    .select()
    .from(leads)
    .leftJoin(leadAttribution, eq(leads.id, leadAttribution.leadId))
    .where(eq(leads.id, id));

  if (result.length === 0) {
    notFound();
  }

  const lead = result[0].leads;
  const attribution = result[0].lead_attribution;

  const activityLog = await db
    .select()
    .from(leadActivityLog)
    .where(eq(leadActivityLog.leadId, id))
    .orderBy(desc(leadActivityLog.createdAt));

  return (
    <div>
      <LeadDetailForm
        lead={lead}
        attribution={attribution}
        activityLog={activityLog}
      />
    </div>
  );
}
