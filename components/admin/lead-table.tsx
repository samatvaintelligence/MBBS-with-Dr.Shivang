"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { LEAD_STATUSES, QUALIFIER_TIERS, FOLLOW_UP_STAGES } from "@/lib/constants";

interface LeadRow {
  id: string;
  fullName: string;
  phone: string;
  leadStatus: string;
  qualifierScore: number | null;
  qualifierTier: string | null;
  followUpStage: string | null;
  nextFollowUpDue: string | Date | null;
  whatsappFollowUpLink: string | null;
  createdAt: string | Date;
  attribution?: {
    utmCampaign?: string | null;
  } | null;
}

interface Props {
  leads: LeadRow[];
  pagination: { page: number; totalPages: number; total: number };
  filters: {
    status?: string;
    tier?: string;
    stage?: string;
    search?: string;
    sort?: string;
    order?: string;
  };
}

export function LeadTable({ leads, pagination, filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(filters.search || "");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/leads?${params.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("search", searchInput);
  }

  function handleSort(column: string) {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get("sort");
    const currentOrder = params.get("order") || "desc";

    if (currentSort === column) {
      params.set("order", currentOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", column);
      params.set("order", "asc");
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/leads?${params.toString()}`);
    });
  }

  function handleStatusChange(leadId: string, newStatus: string) {
    startTransition(async () => {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadStatus: newStatus }),
      });
      router.refresh();
    });
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`/admin/leads?${params.toString()}`);
    });
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (filters.sort !== column) return null;
    return (
      <span className="ml-1 text-xs">
        {filters.order === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search name or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-zinc-100 rounded-lg text-sm hover:bg-zinc-200 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Status filter */}
          <select
            value={filters.status || ""}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Tier filter */}
          <select
            value={filters.tier || ""}
            onChange={(e) => updateFilter("tier", e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Tiers</option>
            {QUALIFIER_TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Stage filter */}
          <select
            value={filters.stage || ""}
            onChange={(e) => updateFilter("stage", e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Stages</option>
            {FOLLOW_UP_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Clear */}
          {(filters.status || filters.tier || filters.stage || filters.search) && (
            <button
              onClick={() => {
                setSearchInput("");
                startTransition(() => {
                  router.push("/admin/leads");
                });
              }}
              className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-sm text-zinc-500">
            {pagination.total} lead{pagination.total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th
                  className="text-left px-4 py-3 font-medium text-zinc-500 cursor-pointer hover:text-zinc-900"
                  onClick={() => handleSort("full_name")}
                >
                  Name <SortIcon column="full_name" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  Phone
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-zinc-500 cursor-pointer hover:text-zinc-900"
                  onClick={() => handleSort("lead_status")}
                >
                  Status <SortIcon column="lead_status" />
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-zinc-500 cursor-pointer hover:text-zinc-900"
                  onClick={() => handleSort("qualifier_score")}
                >
                  Score <SortIcon column="qualifier_score" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  Tier
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  Follow-up
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-zinc-500 cursor-pointer hover:text-zinc-900"
                  onClick={() => handleSort("next_follow_up_due")}
                >
                  Next Due <SortIcon column="next_follow_up_due" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  WhatsApp
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-zinc-500 cursor-pointer hover:text-zinc-900"
                  onClick={() => handleSort("created_at")}
                >
                  Created <SortIcon column="created_at" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-zinc-400"
                  >
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-medium text-zinc-900 hover:text-primary"
                      >
                        {lead.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{lead.phone}</td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.leadStatus}
                        onChange={(e) =>
                          handleStatusChange(lead.id, e.target.value)
                        }
                        className="px-2 py-1 border border-zinc-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {lead.qualifierScore ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={lead.qualifierTier} />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {lead.followUpStage || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {lead.nextFollowUpDue
                        ? new Date(lead.nextFollowUpDue).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {lead.whatsappFollowUpLink ? (
                        <a
                          href={lead.whatsappFollowUpLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                        >
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
                className="px-3 py-1.5 border border-zinc-200 rounded text-sm disabled:opacity-30 hover:bg-zinc-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
                className="px-3 py-1.5 border border-zinc-200 rounded text-sm disabled:opacity-30 hover:bg-zinc-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="text-zinc-400">—</span>;
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
