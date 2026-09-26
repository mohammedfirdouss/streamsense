"use client";

import { useEffect, useState } from "react";
import { INDICATOR_BY_ID, optionLabel } from "@/lib/protocol";
import { oneHealthSignals, scoreAssessment } from "@/lib/scoring";
import { listSubmissions, resetDemoData, type ReviewStatus, type Submission, updateStatus } from "@/lib/store";
import { dataConfidence, validateAssessment } from "@/lib/validation";
import { BAND_META, CheckList, ConfidenceMeter, SignalList } from "../insights";
import { Badge, Button, Card, cx, type Tone } from "../ui";

const STATUS_META: Record<ReviewStatus, { label: string; tone: Tone }> = {
  needs_review: { label: "Needs review", tone: "amber" },
  verified: { label: "Verified by reviewer", tone: "green" },
  follow_up: { label: "Follow-up requested", tone: "orange" },
  published: { label: "Auto-published (all checks passed)", tone: "cyan" },
};

export function ReviewQueue() {
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [filter, setFilter] = useState<"queue" | "all">("queue");

  // localStorage is only available after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSubs(listSubmissions()), []);

  if (!subs) return <p className="p-8 text-slate-600">Loading…</p>;

  const refresh = () => setSubs(listSubmissions());
  const shown = filter === "queue" ? subs.filter((s) => s.status === "needs_review") : subs;
  const decisions = subs.flatMap((s) => Object.values(s.assessment.aiDecisions));
  const agreement = decisions.length ? Math.round((100 * decisions.filter((d) => d === "accepted").length) / decisions.length) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Reviewer queue</h1>
      <p className="mt-1 text-slate-600">Unusual reports are held for a trained human before they reach the public record. Reviewers see what the observer saw, what the AI suggested, and which checks fired.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Reports" value={subs.length} />
        <Stat label="Awaiting review" value={subs.filter((s) => s.status === "needs_review").length} />
        <Stat label="One Health alerts" value={subs.reduce((n, s) => n + oneHealthSignals(s.assessment).filter((x) => x.severity === "urgent").length, 0)} />
        <Stat label="Human–AI agreement" value={agreement === null ? "—" : `${agreement}%`} hint={`${decisions.length} AI suggestions reviewed by observers`} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2" role="tablist">
        {(["queue", "all"] as const).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={cx("rounded-full px-4 py-1.5 text-sm", filter === f ? "bg-cyan-800 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200")}>
            {f === "queue" ? "Needs review" : "All reports"}
          </button>
        ))}
        <button className="ml-auto text-xs text-slate-500 underline" onClick={() => { resetDemoData(); refresh(); }}>Reset demo data</button>
      </div>

      <div className="mt-4 space-y-4">
        {shown.length === 0 && <Card><p className="text-slate-600">Nothing waiting. 🎉</p></Card>}
        {shown.map((s) => <SubmissionCard key={s.assessment.id} sub={s} onChange={refresh} />)}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function SubmissionCard({ sub, onChange }: { sub: Submission; onChange: () => void }) {
  const a = sub.assessment;
  const score = scoreAssessment(a);
  const signals = oneHealthSignals(a);
  const checks = validateAssessment(a);
  const confidence = dataConfidence(a, checks);
  const [note, setNote] = useState(sub.reviewerNote ?? "");
  const [open, setOpen] = useState(sub.status === "needs_review");

  const decide = (status: ReviewStatus) => {
    updateStatus(a.id, status, note || undefined);
    onChange();
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{a.site.name}</h2>
          <p className="text-sm text-slate-600">
            {a.observer || "Anonymous"} · {new Date(a.createdAt).toLocaleDateString()} · {a.weather === "dry" ? "dry weather" : "after rain"}
            {a.site.lat !== undefined && <> · {a.site.lat}, {a.site.lng}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {score.band && <Badge tone={BAND_META[score.band].tone}>SHI {score.score} · {BAND_META[score.band].label}</Badge>}
          <Badge tone={STATUS_META[sub.status].tone}>{STATUS_META[sub.status].label}</Badge>
        </div>
      </div>

      <button className="mt-3 text-sm text-cyan-800 underline" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide details" : "Show details"}</button>

      {open && (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            {a.photos.length > 0 && (
              <div className="flex gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {a.photos.map((p, i) => <img key={i} src={p} alt={`Observer photo ${i + 1}`} className="h-24 w-24 rounded object-cover" />)}
              </div>
            )}
            <div>
              <h3 className="mb-2 text-sm font-semibold">Observations &amp; AI audit trail</h3>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500"><th className="pb-1 font-normal">Indicator</th><th className="pb-1 font-normal">Observer</th><th className="pb-1 font-normal">AI suggested</th></tr></thead>
                <tbody>
                  {Object.entries(a.answers).map(([id, v]) => {
                    const ind = INDICATOR_BY_ID[id as keyof typeof INDICATOR_BY_ID];
                    const s = a.aiSuggestions.find((x) => x.indicator === id);
                    const decision = a.aiDecisions[ind.id];
                    return (
                      <tr key={id} className="border-t border-slate-100 align-top">
                        <td className="py-1.5 pr-2 text-slate-600">{ind.term}</td>
                        <td className="py-1.5 pr-2">{optionLabel(ind.id, v)}</td>
                        <td className="py-1.5">
                          {s ? (
                            <span className={cx(decision === "rejected" && "text-orange-800")}>
                              {optionLabel(ind.id, s.value)} <span className="text-xs text-slate-500">({s.confidence}{decision ? `, ${decision}` : ""})</span>
                            </span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {a.notes && <p className="rounded bg-slate-50 p-3 text-sm italic text-slate-700">“{a.notes}”</p>}
          </div>

          <div className="space-y-5">
            <div><h3 className="mb-2 text-sm font-semibold">Why it&apos;s here</h3><CheckList checks={checks} /></div>
            <div><h3 className="mb-2 text-sm font-semibold">One Health signals</h3><SignalList signals={signals} /></div>
            <ConfidenceMeter confidence={confidence} />
            <div className="rounded-lg border border-slate-200 p-3">
              <label className="block text-sm font-medium" htmlFor={`note-${a.id}`}>Reviewer note</label>
              <textarea id={`note-${a.id}`} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Feedback is sent to the observer — keep it encouraging." />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button className="min-h-9 py-1" onClick={() => decide("verified")}>✓ Verify &amp; publish</Button>
                <Button variant="secondary" className="min-h-9 py-1" onClick={() => decide("follow_up")}>Request follow-up visit</Button>
              </div>
              {sub.reviewedAt && <p className="mt-2 text-xs text-slate-500">Last decision {new Date(sub.reviewedAt).toLocaleString()}</p>}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
