"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LEAD_STATUSES,
  FOLLOW_UP_STAGES,
  LOST_REASONS,
} from "@/lib/constants";

interface Lead {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  fullName: string;
  phone: string;
  consentToContact: boolean;
  leadStatus: string;
  qualifierScore: number | null;
  qualifierTier: string | null;
  mainObjection: string | null;
  recommendedNextAction: string | null;
  followUpStage: string | null;
  nextFollowUpDue: string | Date | null;
  followUpMessage: string | null;
  whatsappFollowUpLink: string | null;
  lastContactedAt: string | Date | null;
  followUpAttempts: number | null;
  parentCallTime: string | null;
  neetScore: string | null;
  dropYears: string | null;
  budget: string | null;
  targetIntake: string | null;
  notes: string | null;
  aiSummary: string | null;
  finalOutcome: string | null;
  lostReason: string | null;
  optimizationEvent: string | null;
  outcomeUpdatedAt: string | Date | null;
}

interface Attribution {
  landingPage?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  campaignId?: string | null;
  adsetId?: string | null;
  adId?: string | null;
  placement?: string | null;
  fbClickId?: string | null;
}

interface ActivityEntry {
  id: string;
  createdAt: string | Date;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
}

interface Props {
  lead: Lead;
  attribution: Attribution | null;
  activityLog: ActivityEntry[];
}

export function LeadDetailForm({ lead, attribution, activityLog }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    leadStatus: lead.leadStatus,
    neetScore: lead.neetScore || "",
    dropYears: lead.dropYears || "",
    budget: lead.budget || "",
    targetIntake: lead.targetIntake || "",
    parentCallTime: lead.parentCallTime || "",
    notes: lead.notes || "",
    finalOutcome: lead.finalOutcome || "",
    lostReason: lead.lostReason || "",
    aiSummary: lead.aiSummary || "",
  });
  const [saved, setSaved] = useState(false);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
      router.refresh();
    });
  }

  const tierColors: Record<string, string> = {
    hot: "bg-red-100 text-red-700 border-red-200",
    warm: "bg-amber-100 text-amber-700 border-amber-200",
    nurture: "bg-blue-100 text-blue-700 border-blue-200",
    "low fit": "bg-zinc-100 text-zinc-500 border-zinc-200",
  };

  return (
    <div className={isPending ? "opacity-60" : ""}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/leads"
          className="text-zinc-400 hover:text-zinc-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900">
            {lead.fullName}
          </h1>
          <p className="text-sm text-zinc-500">
            {lead.phone} &middot; Created{" "}
            {new Date(lead.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — editable fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Outcome */}
          <Section title="Status & Outcome">
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Lead Status">
                <select
                  value={form.leadStatus}
                  onChange={(e) => handleChange("leadStatus", e.target.value)}
                  className="input"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Final Outcome">
                <input
                  type="text"
                  value={form.finalOutcome}
                  onChange={(e) => handleChange("finalOutcome", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Lost Reason">
                <select
                  value={form.lostReason}
                  onChange={(e) => handleChange("lostReason", e.target.value)}
                  className="input"
                >
                  <option value="">—</option>
                  {LOST_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* Lead Details */}
          <Section title="Lead Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="NEET Score">
                <input
                  type="text"
                  value={form.neetScore}
                  onChange={(e) => handleChange("neetScore", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Drop Years">
                <input
                  type="text"
                  value={form.dropYears}
                  onChange={(e) => handleChange("dropYears", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Budget">
                <input
                  type="text"
                  value={form.budget}
                  onChange={(e) => handleChange("budget", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Target Intake">
                <input
                  type="text"
                  value={form.targetIntake}
                  onChange={(e) => handleChange("targetIntake", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Parent Call Time">
                <input
                  type="text"
                  value={form.parentCallTime}
                  onChange={(e) => handleChange("parentCallTime", e.target.value)}
                  className="input"
                />
              </Field>
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={4}
              className="input w-full"
              placeholder="Add notes about this lead..."
            />
          </Section>

          {/* WhatsApp Follow-up */}
          <Section title="WhatsApp Follow-up">
            {lead.followUpMessage ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-zinc-700 mb-3">
                  {lead.followUpMessage}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(lead.followUpMessage || "");
                    }}
                    className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors"
                  >
                    Copy Message
                  </button>
                  {lead.whatsappFollowUpLink && (
                    <a
                      href={lead.whatsappFollowUpLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      Open in WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No follow-up message generated</p>
            )}
          </Section>

          {/* Attribution */}
          {attribution && (
            <Section title="Attribution">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  ["Landing Page", attribution.landingPage],
                  ["Referrer", attribution.referrer],
                  ["UTM Source", attribution.utmSource],
                  ["UTM Medium", attribution.utmMedium],
                  ["UTM Campaign", attribution.utmCampaign],
                  ["UTM Content", attribution.utmContent],
                  ["UTM Term", attribution.utmTerm],
                  ["Campaign ID", attribution.campaignId],
                  ["Adset ID", attribution.adsetId],
                  ["Ad ID", attribution.adId],
                  ["Placement", attribution.placement],
                  ["FB Click ID", attribution.fbClickId],
                ]
                  .filter(([, val]) => val)
                  .map(([label, val]) => (
                    <div key={label as string}>
                      <p className="text-zinc-400 text-xs">{label}</p>
                      <p className="text-zinc-700 truncate">{val as string}</p>
                    </div>
                  ))}
              </div>
            </Section>
          )}

          {/* Activity Log */}
          <Section title="Activity Log">
            {activityLog.length === 0 ? (
              <p className="text-sm text-zinc-400">No activity recorded</p>
            ) : (
              <div className="space-y-2">
                {activityLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 py-2 border-b border-zinc-50 last:border-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-zinc-300 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-700">
                        <strong>{entry.fieldChanged}</strong>{" "}
                        {entry.oldValue && (
                          <>
                            from{" "}
                            <span className="text-zinc-400">
                              {entry.oldValue}
                            </span>{" "}
                          </>
                        )}
                        {entry.newValue && (
                          <>
                            to{" "}
                            <span className="font-medium">
                              {entry.newValue}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {new Date(entry.createdAt).toLocaleString()} &middot;{" "}
                        {entry.changedBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right column — computed fields (read-only) */}
        <div className="space-y-6">
          {/* Qualifier */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-zinc-900 mb-4">Qualifier</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Score</span>
                <span className="text-2xl font-bold text-zinc-900">
                  {lead.qualifierScore ?? "—"}
                </span>
              </div>
              {lead.qualifierTier && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Tier</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      tierColors[lead.qualifierTier] || "bg-zinc-100"
                    }`}
                  >
                    {lead.qualifierTier}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm text-zinc-500 mb-1">Main Objection</p>
                <p className="text-sm text-zinc-700">
                  {lead.mainObjection || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 mb-1">
                  Recommended Action
                </p>
                <p className="text-sm text-zinc-700">
                  {lead.recommendedNextAction || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Follow-up Status */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-zinc-900 mb-4">Follow-up</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-zinc-500">Stage</p>
                <p className="text-sm font-medium text-zinc-700">
                  {lead.followUpStage || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Next Due</p>
                <p className="text-sm text-zinc-700">
                  {lead.nextFollowUpDue
                    ? new Date(lead.nextFollowUpDue).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Attempts</p>
                <p className="text-sm text-zinc-700">
                  {lead.followUpAttempts ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Optimization */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-zinc-900 mb-4">Optimization</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-zinc-500">Event</p>
                <p className="text-sm font-medium text-zinc-700">
                  {lead.optimizationEvent || "—"}
                </p>
              </div>
              {lead.outcomeUpdatedAt && (
                <div>
                  <p className="text-sm text-zinc-500">Updated</p>
                  <p className="text-sm text-zinc-700">
                    {new Date(lead.outcomeUpdatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="font-semibold text-zinc-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
