import { db } from "@/lib/db";
import { leads, leadAttribution } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  computeOptimizationEvent,
  getConversionValue,
  getOptimizationRecommendation,
} from "@/lib/lead-engine";

export const dynamic = "force-dynamic";

interface Bucket {
  utmCampaign: string;
  campaignId: string;
  adsetId: string;
  adId: string;
  placement: string;
  leads: number;
  qualified: number;
  parentCalls: number;
  admissionStarted: number;
  closed: number;
  lost: number;
  hot: number;
  value: number;
}

export default async function OptimizationPage() {
  // Get all leads with attribution
  const result = await db
    .select()
    .from(leads)
    .leftJoin(leadAttribution, eq(leads.id, leadAttribution.leadId));

  // Group by campaign/adset/ad — same logic as Apps Script refreshOptimizationDashboard
  const grouped: Record<string, Bucket> = {};

  for (const row of result) {
    const lead = row.leads;
    const attr = row.lead_attribution;

    const key = [
      attr?.utmCampaign || "(no campaign)",
      attr?.campaignId || "",
      attr?.adsetId || "",
      attr?.adId || "",
      attr?.placement || "",
    ].join("||");

    if (!grouped[key]) {
      grouped[key] = {
        utmCampaign: attr?.utmCampaign || "(no campaign)",
        campaignId: attr?.campaignId || "",
        adsetId: attr?.adsetId || "",
        adId: attr?.adId || "",
        placement: attr?.placement || "",
        leads: 0,
        qualified: 0,
        parentCalls: 0,
        admissionStarted: 0,
        closed: 0,
        lost: 0,
        hot: 0,
        value: 0,
      };
    }

    const bucket = grouped[key];
    const status = (lead.leadStatus || "").toLowerCase().trim();
    const tier = (lead.qualifierTier || "").toLowerCase().trim();

    bucket.leads += 1;
    if (
      ["qualified", "parent call booked", "call done", "admission started", "closed"].includes(status)
    )
      bucket.qualified += 1;
    if (
      ["parent call booked", "call done", "admission started", "closed"].includes(status)
    )
      bucket.parentCalls += 1;
    if (["admission started", "closed"].includes(status))
      bucket.admissionStarted += 1;
    if (status === "closed") bucket.closed += 1;
    if (status === "lost") bucket.lost += 1;
    if (tier === "hot") bucket.hot += 1;

    const event =
      lead.optimizationEvent ||
      computeOptimizationEvent(
        status,
        (lead.finalOutcome || "").toLowerCase().trim()
      );
    bucket.value += getConversionValue(event);
  }

  const buckets = Object.values(grouped);

  // Overall funnel
  const funnel = {
    total: result.length,
    qualified: buckets.reduce((s, b) => s + b.qualified, 0),
    parentCalls: buckets.reduce((s, b) => s + b.parentCalls, 0),
    admissionStarted: buckets.reduce((s, b) => s + b.admissionStarted, 0),
    closed: buckets.reduce((s, b) => s + b.closed, 0),
    lost: buckets.reduce((s, b) => s + b.lost, 0),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">
        Campaign Optimization
      </h1>

      {/* Funnel overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-zinc-900 mb-4">Lead Funnel</h2>
        <div className="flex items-end gap-4 h-40">
          {[
            { label: "Leads", value: funnel.total, color: "bg-zinc-300" },
            { label: "Qualified", value: funnel.qualified, color: "bg-blue-400" },
            { label: "Parent Calls", value: funnel.parentCalls, color: "bg-amber-400" },
            { label: "Admission", value: funnel.admissionStarted, color: "bg-green-400" },
            { label: "Closed", value: funnel.closed, color: "bg-green-600" },
            { label: "Lost", value: funnel.lost, color: "bg-zinc-400" },
          ].map((step) => {
            const height =
              funnel.total > 0
                ? Math.max((step.value / funnel.total) * 100, 8)
                : 8;
            return (
              <div
                key={step.label}
                className="flex-1 flex flex-col items-center"
              >
                <span className="text-lg font-bold text-zinc-900 mb-1">
                  {step.value}
                </span>
                <div
                  className={`w-full rounded-t-lg ${step.color} transition-all`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-zinc-500 mt-2">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">
            By Campaign / Ad Creative
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  Campaign
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  Placement
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">
                  Leads
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">
                  Qualified
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">
                  Parent Calls
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">
                  Admission
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">
                  Closed
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">
                  Lost
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">
                  Hot
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">
                  Value
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {buckets.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-12 text-center text-zinc-400"
                  >
                    No campaign data yet
                  </td>
                </tr>
              ) : (
                buckets.map((bucket, i) => (
                  <tr key={i} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-900">
                        {bucket.utmCampaign}
                      </span>
                      {bucket.campaignId && (
                        <p className="text-xs text-zinc-400">
                          {bucket.campaignId}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {bucket.placement || "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      {bucket.leads}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bucket.qualified}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bucket.parentCalls}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bucket.admissionStarted}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bucket.closed}
                    </td>
                    <td className="px-4 py-3 text-center">{bucket.lost}</td>
                    <td className="px-4 py-3 text-center">
                      {bucket.hot > 0 ? (
                        <span className="text-red-600 font-medium">
                          {bucket.hot}
                        </span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      {bucket.value}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">
                      {getOptimizationRecommendation(bucket)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
