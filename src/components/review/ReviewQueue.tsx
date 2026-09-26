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
  follow_up: { label: "Follow up visit requested", tone: "orange" },
  published: { label: "Published automatically", tone: "cyan" },
};

export function ReviewQueue() {
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [filter, setFilter] = useState<"queue" | "all">("queue");

  // localStorage is only available after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSubs(listSubmissions()), []);

  if (!subs) return <p className="p-8 text-ink-soft">Loading…</p>;

  const refresh = () => setSubs(listSubmissions());
  const shown = filter === "queue" ? subs.filter((s) => s.status === "needs_review") : subs;
  const decisions = subs.flatMap((s) => Object.values(s.assessment.aiDecisions));
  const agreement = decisions.length ? Math.round((100 * decisions.filter((d) => d === "accepted").length) / decisions.length) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-semibold">Review queue</h1>
      <p className="mt-2 max-w-prose text-ink-soft">Unusual reports wait here for a trained person before they are published. You can see what the volunteer saw, what the AI suggested, and which checks were raised.</p>

      <dl className="mt-8 grid grid-cols-2 border-y border-line sm:grid-cols-4">
        <Stat label="Reports" value={subs.length} />
        <Stat label="Waiting for review" value={subs.filter((s) => s.status === "needs_review").length} />
        <Stat label="Urgent health alerts" value={subs.reduce((n, s) => n + oneHealthSignals(s.assessment).filter((x) => x.severity === "urgent").length, 0)} />
        <Stat label="People agreed with the AI" value={agreement === null ? "None yet" : `${agreement}%`} hint={`across ${decisions.length} suggestions`} />
      </dl>

      <div className="mt-8 flex flex-wrap items-center gap-2" role="tablist">
        {(["queue", "all"] as const).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={cx("rounded-sm px-4 py-2 text-sm font-semibold", filter === f ? "bg-river text-card" : "border border-line bg-card text-ink-soft hover:text-ink")}>
            {f === "queue" ? "Needs review" : "All reports"}
          </button>
        ))}
        <button className="ml-auto text-sm text-ink-soft underline underline-offset-4" onClick={() => { resetDemoData(); refresh(); }}>Reset demo data</button>
      </div>

      <div className="mt-4 space-y-4">
        {shown.length === 0 && <Card><p className="text-ink-soft">Nothing is waiting for review.</p></Card>}
        {shown.map((s) => <SubmissionCard key={s.assessment.id} sub={s} onChange={refresh} />)}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="flex flex-col-reverse justify-end border-line px-1 py-4 sm:border-l sm:px-5 sm:first:border-l-0 sm:first:pl-0">
      <dt className="mt-2 text-sm text-ink-soft">{label}{hint && <span className="block text-xs">{hint}</span>}</dt>
      <dd className="font-display text-4xl leading-none font-bold tabular-nums">{value}</dd>
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

  const details = [
    a.observer || "Anonymous",
    new Date(a.createdAt).toLocaleDateString(),
    a.weather === "dry" ? "Dry weather" : "After rain",
    a.site.lat !== undefined ? `${a.site.lat}, ${a.site.lng}` : null,
  ].filter(Boolean);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">{a.site.name}</h2>
          <ul className="mt-1 flex flex-wrap gap-x-4 text-sm text-ink-soft">
            {details.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2">
          {score.band && <Badge tone={BAND_META[score.band].tone}>Score {score.score}, {BAND_META[score.band].label}</Badge>}
          <Badge tone={STATUS_META[sub.status].tone}>{STATUS_META[sub.status].label}</Badge>
        </div>
      </div>

      <button className="mt-3 text-sm font-semibold text-river-deep underline underline-offset-4" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide details" : "Show details"}</button>

      {open && (
        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            {a.photos.length > 0 && (
              <div className="flex gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {a.photos.map((p, i) => <img key={i} src={p} alt={`Volunteer photo ${i + 1}`} className="h-24 w-24 rounded-sm border border-line object-cover" />)}
              </div>
            )}
            <div>
              <h3 className="mb-2 font-semibold">What the volunteer chose and what the AI suggested</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-line text-left text-ink-soft"><th className="pb-2 font-normal">Question</th><th className="pb-2 font-normal">Volunteer</th><th className="pb-2 font-normal text-pencil">AI</th></tr></thead>
                  <tbody>
                    {Object.entries(a.answers).map(([id, v]) => {
                      const ind = INDICATOR_BY_ID[id as keyof typeof INDICATOR_BY_ID];
                      const s = a.aiSuggestions.find((x) => x.indicator === id);
                      const decision = a.aiDecisions[ind.id];
                      return (
                        <tr key={id} className={cx("border-b border-line/60 align-top", decision === "rejected" && "bg-orange-50")}>
                          <td className="py-2 pr-2 text-ink-soft">{ind.term}</td>
                          <td className="py-2 pr-2 font-semibold">{optionLabel(ind.id, v)}</td>
                          <td className="py-2 text-pencil">
                            {s ? (
                              <>
                                {optionLabel(ind.id, s.value)}
                                <span className="block text-xs text-ink-soft">{s.confidence} confidence{decision === "rejected" ? ", volunteer disagreed" : decision === "accepted" ? ", volunteer agreed" : ""}</span>
                              </>
                            ) : <span className="text-ink-soft">None</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {a.notes && <blockquote className="border-l-2 border-silt pl-4 text-ink-soft italic">{a.notes}</blockquote>}
          </div>

          <div className="space-y-6">
            <div><h3 className="mb-2 font-semibold">Why it is here</h3><CheckList checks={checks} /></div>
            <div><h3 className="mb-2 font-semibold">Health alerts</h3><SignalList signals={signals} /></div>
            <ConfidenceMeter confidence={confidence} />
            <div className="rounded-sm border border-line bg-paper/60 p-4">
              <label className="block font-semibold" htmlFor={`note-${a.id}`}>Note to the volunteer</label>
              <textarea id={`note-${a.id}`} className="mt-1.5 w-full rounded-sm border border-line bg-card px-3 py-2 text-sm" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="The volunteer will see this, so keep it encouraging." />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button className="min-h-9 py-1" onClick={() => decide("verified")}>Verify &amp; publish</Button>
                <Button variant="secondary" className="min-h-9 py-1" onClick={() => decide("follow_up")}>Ask for a follow up visit</Button>
              </div>
              {sub.reviewedAt && <p className="mt-2 text-xs text-ink-soft">Last decision {new Date(sub.reviewedAt).toLocaleString()}</p>}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
