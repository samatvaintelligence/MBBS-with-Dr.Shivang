import { db } from "@/lib/db";
import { leads, leadAttribution } from "@/lib/schema";
import { eq, like, or, desc, asc, sql, and } from "drizzle-orm";
import { LeadTable } from "@/components/admin/lead-table";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    tier?: string;
    stage?: string;
    search?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status;
  const tier = params.tier;
  const stage = params.stage;
  const search = params.search;
  const sortBy = params.sort || "created_at";
  const order = params.order || "desc";
  const page = parseInt(params.page || "1", 10);
  const limit = 25;
  const offset = (page - 1) * limit;

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

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(whereClause);

  // Sort
  const sortColumn = {
    created_at: leads.createdAt,
    full_name: leads.fullName,
    lead_status: leads.leadStatus,
    qualifier_score: leads.qualifierScore,
    next_follow_up_due: leads.nextFollowUpDue,
  }[sortBy] || leads.createdAt;

  const orderFn = order === "asc" ? asc : desc;

  // Query
  const result = await db
    .select()
    .from(leads)
    .leftJoin(leadAttribution, eq(leads.id, leadAttribution.leadId))
    .where(whereClause)
    .orderBy(orderFn(sortColumn as typeof leads.createdAt))
    .limit(limit)
    .offset(offset);

  const data = result.map((row) => ({
    ...row.leads,
    attribution: row.lead_attribution,
  }));

  const totalPages = Math.ceil(countResult.count / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Leads</h1>
        <a
          href="/api/leads/export"
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          Export CSV
        </a>
      </div>

      <LeadTable
        leads={data}
        pagination={{ page, totalPages, total: countResult.count }}
        filters={{ status, tier, stage, search, sort: sortBy, order }}
      />
    </div>
  );
}
