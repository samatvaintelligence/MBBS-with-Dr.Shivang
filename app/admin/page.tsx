import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { eq, sql, and, lte, not, gte, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Stats queries
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads);

  const [newTodayResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(gte(leads.createdAt, todayStart));

  const [hotResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(eq(leads.qualifierTier, "hot"));

  const [followUpsDueResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        lte(leads.nextFollowUpDue, now),
        not(eq(leads.followUpStage, "done"))
      )
    );

  const [closedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(eq(leads.leadStatus, "closed"));

  const [lostResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(eq(leads.leadStatus, "lost"));

  // Follow-up queue (top 10 overdue)
  const followUpQueue = await db
    .select()
    .from(leads)
    .where(
      and(
        lte(leads.nextFollowUpDue, now),
        not(eq(leads.followUpStage, "done"))
      )
    )
    .orderBy(leads.nextFollowUpDue)
    .limit(10);

  // Recent leads
  const recentLeads = await db
    .select()
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(5);

  const stats = [
    { label: "Total Leads", value: totalResult.count, color: "bg-zinc-900" },
    { label: "New Today", value: newTodayResult.count, color: "bg-primary" },
    { label: "Hot Leads", value: hotResult.count, color: "bg-hot" },
    {
      label: "Follow-ups Due",
      value: followUpsDueResult.count,
      color: "bg-warning",
    },
    { label: "Closed", value: closedResult.count, color: "bg-success" },
    { label: "Lost", value: lostResult.count, color: "bg-muted" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <Link
          href="/admin/leads"
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          View All Leads
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
            <div
              className={`w-2 h-2 rounded-full ${stat.color} mb-3`}
            />
            <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Follow-up Queue */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900">
              Follow-ups Due ({followUpsDueResult.count})
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {followUpQueue.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400 text-center">
                No follow-ups due right now
              </p>
            ) : (
              followUpQueue.map((lead) => (
                <div
                  key={lead.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="text-sm font-medium text-zinc-900 hover:text-primary"
                    >
                      {lead.fullName}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {lead.followUpStage} &middot;{" "}
                      {lead.nextFollowUpDue
                        ? getTimeAgo(lead.nextFollowUpDue)
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.whatsappFollowUpLink && (
                      <a
                        href={lead.whatsappFollowUpLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                      >
                        WhatsApp
                      </a>
                    )}
                    <TierBadge tier={lead.qualifierTier} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900">Recent Leads</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {recentLeads.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400 text-center">
                No leads yet
              </p>
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="text-sm font-medium text-zinc-900 hover:text-primary"
                    >
                      {lead.fullName}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {lead.phone} &middot;{" "}
                      {lead.createdAt instanceof Date ? lead.createdAt.toLocaleDateString() : new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={lead.leadStatus} />
                    <TierBadge tier={lead.qualifierTier} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    qualified: "bg-purple-100 text-purple-700",
    "parent call booked": "bg-amber-100 text-amber-700",
    "call done": "bg-teal-100 text-teal-700",
    "admission started": "bg-green-100 text-green-700",
    closed: "bg-green-200 text-green-800",
    lost: "bg-zinc-100 text-zinc-500",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        colors[status] || "bg-zinc-100 text-zinc-600"
      }`}
    >
      {status}
    </span>
  );
}

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  const colors: Record<string, string> = {
    hot: "bg-red-100 text-red-700",
    warm: "bg-amber-100 text-amber-700",
    nurture: "bg-blue-100 text-blue-700",
    "low fit": "bg-zinc-100 text-zinc-500",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        colors[tier] || "bg-zinc-100 text-zinc-600"
      }`}
    >
      {tier}
    </span>
  );
}

function getTimeAgo(dateStr: string | Date): string {
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 0) return `in ${Math.abs(diffMins)}m`;
  if (diffMins < 60) return `${diffMins}m overdue`;
  if (diffHours < 24) return `${diffHours}h overdue`;
  return `${diffDays}d overdue`;
}
