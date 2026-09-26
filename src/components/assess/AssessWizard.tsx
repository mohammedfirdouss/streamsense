"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AssessmentReview, PhotoAnalysis } from "@/lib/ai/schemas";
import { resizeImage } from "@/lib/image";
import {
  type AiSuggestion,
  type Assessment,
  emptyAssessment,
  HUMAN_CONTACT_OPTIONS,
  type Indicator,
  INDICATORS,
  optionLabel,
  WILDLIFE_OPTIONS,
} from "@/lib/protocol";
import { oneHealthSignals, scoreAssessment } from "@/lib/scoring";
import { saveSubmission, type Submission } from "@/lib/store";
import { dataConfidence, validateAssessment } from "@/lib/validation";
import { CheckList, ConfidenceMeter, LENS_META, ScoreDial, ScoreExplanation, SignalList } from "../insights";
import { AiBadge, Badge, Button, Card, cx } from "../ui";

const STEPS = ["Site", "Photos", "Observe", "Life & people", "Review"] as const;

type PhotoResult = Omit<PhotoAnalysis, "suggestions"> & { suggestions: AiSuggestion[]; demo: boolean };

export function AssessWizard() {
  const [a, setA] = useState<Assessment>(emptyAssessment);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<Submission | null>(null);
  const [photoResult, setPhotoResult] = useState<PhotoResult | null>(null);
  const [review, setReview] = useState<(AssessmentReview & { demo: boolean }) | null>(null);

  const update = (patch: Partial<Assessment>) => setA((prev) => ({ ...prev, ...patch }));
  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) return <Submitted sub={submitted} onRestart={() => { setA(emptyAssessment()); setSubmitted(null); setPhotoResult(null); setReview(null); go(0); }} />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Stepper step={step} onJump={go} />
      {step === 0 && <SiteStep a={a} update={update} />}
      {step === 1 && <PhotoStep a={a} update={update} result={photoResult} setResult={setPhotoResult} />}
      {step === 2 && <ObserveStep a={a} setA={setA} demo={photoResult?.demo} />}
      {step === 3 && <LifeStep a={a} update={update} />}
      {step === 4 && <ReviewStep a={a} review={review} setReview={setReview} onJump={go} onSubmit={() => setSubmitted(saveSubmission(a, review ?? undefined))} />}

      {step < 4 && (
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>← Back</Button>
          <Button onClick={() => go(step + 1)}>Next: {STEPS[step + 1]} →</Button>
        </div>
      )}
    </div>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (n: number) => void }) {
  return (
    <nav aria-label="Survey progress" className="mb-6">
      <ol className="flex gap-1">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <button
              onClick={() => onJump(i)}
              aria-current={i === step ? "step" : undefined}
              className={cx(
                "w-full border-t-4 pt-2 text-left text-xs font-medium",
                i < step && "border-cyan-700 text-cyan-900",
                i === step && "border-cyan-800 text-cyan-950",
                i > step && "border-slate-200 text-slate-500",
              )}
            >
              <span className="hidden sm:inline">{i + 1}. </span>{s}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StepHeading({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-slate-600">{intro}</p>
    </div>
  );
}

// ─── Step 1: Site ────────────────────────────────────────────────────────────

function SiteStep({ a, update }: { a: Assessment; update: (p: Partial<Assessment>) => void }) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const locate = () => {
    if (!navigator.geolocation) return setGeoError("Location isn't available in this browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({ site: { ...a.site, lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) } });
        setLocating(false);
        setGeoError("");
      },
      () => {
        setGeoError("Couldn't get your location. You can still continue.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <Card>
      <StepHeading title="Where are you?" intro="About 10 minutes. No expertise needed — we'll explain everything as we go." />
      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium">Your name or group</span>
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={a.observer} onChange={(e) => update({ observer: e.target.value })} placeholder="e.g. Sam, or Riverside Primary Year 5" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Stream and spot name <span className="text-rose-700">*</span></span>
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={a.site.name} onChange={(e) => update({ site: { ...a.site, name: e.target.value } })} placeholder="e.g. Millbrook — by the footbridge" required />
        </label>
        <div>
          <Button variant="secondary" onClick={locate} disabled={locating}>📍 {locating ? "Finding you…" : a.site.lat ? "Update location" : "Use my location"}</Button>
          {a.site.lat !== undefined && <p className="mt-2 text-sm text-emerald-800">✓ Location saved ({a.site.lat}, {a.site.lng})</p>}
          {geoError && <p className="mt-2 text-sm text-amber-800" role="alert">{geoError}</p>}
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Weather</legend>
          <p className="text-xs text-slate-600">Rain washes pollution from roads into streams, so it changes what you&apos;ll see.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([["dry", "☀️ Dry for 2+ days"], ["rain_24h", "🌦 Rained in the last day"], ["raining", "🌧 Raining now"]] as const).map(([v, l]) => (
              <Choice key={v} name="weather" checked={a.weather === v} onChange={() => update({ weather: v })} label={l} />
            ))}
          </div>
        </fieldset>
      </div>
    </Card>
  );
}

// ─── Step 2: Photos + AI ─────────────────────────────────────────────────────

function PhotoStep({ a, update, result, setResult }: { a: Assessment; update: (p: Partial<Assessment>) => void; result: PhotoResult | null; setResult: (r: PhotoResult | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const resized = await Promise.all([...files].slice(0, 3 - a.photos.length).map((f) => resizeImage(f)));
    update({ photos: [...a.photos, ...resized] });
    setResult(null);
  };

  const analyse = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/analyze-photo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos: a.photos }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      update({ aiSuggestions: data.suggestions, aiDecisions: {} });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <StepHeading title="Take a photo of the stream" intro="Show the water and both banks if you can. Our photo assistant will suggest answers — you'll check every one." />
      <div className="flex flex-wrap gap-3">
        {a.photos.map((p, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p} alt={`Stream photo ${i + 1}`} className="h-32 w-32 rounded-lg object-cover" />
            <button className="absolute right-1 top-1 rounded-full bg-white/90 px-2 text-sm" aria-label={`Remove photo ${i + 1}`} onClick={() => { update({ photos: a.photos.filter((_, j) => j !== i), aiSuggestions: [], aiDecisions: {} }); setResult(null); }}>✕</button>
          </div>
        ))}
        {a.photos.length < 3 && (
          <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-600 hover:border-cyan-700">
            <span aria-hidden className="text-2xl">📷</span> Add photo
            <input type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
          </label>
        )}
      </div>

      {a.photos.length > 0 && !result && (
        <Button className="mt-5" onClick={analyse} disabled={busy}>{busy ? "Looking at your photos…" : "✦ Ask the photo assistant"}</Button>
      )}
      {error && <p className="mt-3 text-sm text-amber-800" role="alert">{error}</p>}

      {result && (
        <div className="mt-5 rounded-lg border border-violet-200 bg-violet-50 p-4">
          <AiBadge demo={result.demo} />
          {!result.showsWaterbody ? (
            <p className="mt-2 text-sm">This doesn&apos;t look like a stream. Try a photo showing the water and banks.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-800">{result.summary}</p>
              {!result.photoQuality.usable && <p className="mt-2 text-sm text-amber-800">⚠️ {result.photoQuality.issues.join(", ")}</p>}
              {result.photoQuality.retakeTip && <p className="mt-1 text-sm text-slate-700">Tip: {result.photoQuality.retakeTip}</p>}
              <p className="mt-2 text-sm font-medium">{result.suggestions.filter((s) => s.value !== "cannot_tell").length} suggestions are waiting for you on the next step.</p>
            </>
          )}
        </div>
      )}
      <p className="mt-5 text-xs text-slate-500">No camera? Skip this step — you can complete the survey by eye.</p>
    </Card>
  );
}

// ─── Step 3: Observations ────────────────────────────────────────────────────

function ObserveStep({ a, setA, demo }: { a: Assessment; setA: (fn: (p: Assessment) => Assessment) => void; demo?: boolean }) {
  const answer = (ind: Indicator, value: string, viaSuggestion = false) =>
    setA((prev) => {
      const s = prev.aiSuggestions.find((x) => x.indicator === ind.id);
      const aiDecisions = { ...prev.aiDecisions };
      if (s && s.value !== "cannot_tell") aiDecisions[ind.id] = viaSuggestion || value === s.value ? "accepted" : "rejected";
      return { ...prev, answers: { ...prev.answers, [ind.id]: value }, aiDecisions };
    });

  return (
    <div className="space-y-4">
      <Card>
        <StepHeading title="What do you notice?" intro="Trust your senses. Where the photo assistant has a suggestion, it's shown — but nothing is filled in until you choose." />
      </Card>
      {INDICATORS.map((ind) => {
        const s = a.aiSuggestions.find((x) => x.indicator === ind.id && x.value !== "cannot_tell");
        const chosen = a.answers[ind.id];
        return (
          <Card key={ind.id}>
            <fieldset>
              <legend className="text-lg font-medium text-slate-900">{ind.question}</legend>
              <details className="mt-1 text-sm text-slate-600">
                <summary className="cursor-pointer text-cyan-800">Scientists call this <strong>{ind.term}</strong> · why it matters</summary>
                <p className="mt-2">{ind.termExplainer}</p>
                <p className="mt-1">{ind.whyItMatters}</p>
                <p className="mt-1 flex gap-2">{ind.lenses.map((l) => <Badge key={l}>{LENS_META[l].icon} {LENS_META[l].label}</Badge>)}</p>
              </details>

              {s && (
                <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <AiBadge demo={demo} />
                    <Badge tone={s.confidence === "high" ? "green" : s.confidence === "medium" ? "amber" : "slate"}>{s.confidence} confidence</Badge>
                  </div>
                  <p className="mt-2"><strong>{optionLabel(ind.id, s.value)}</strong> — <span className="text-slate-700">{s.evidence}</span></p>
                  {chosen === undefined ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="secondary" className="min-h-9 py-1" onClick={() => answer(ind, s.value, true)}>Looks right</Button>
                      <span className="self-center text-slate-600">or pick what you see below</span>
                    </div>
                  ) : (
                    <p className="mt-2 text-slate-700">
                      {a.aiDecisions[ind.id] === "accepted" ? "✓ You agreed with the suggestion." : "✎ You chose differently — your observation is what counts."}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {ind.options.map((o) => (
                  <Choice key={o.value} name={ind.id} checked={chosen === o.value} onChange={() => answer(ind, o.value)} label={o.label} />
                ))}
              </div>
            </fieldset>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Step 4: Life & people ───────────────────────────────────────────────────

function LifeStep({ a, update }: { a: Assessment; update: (p: Partial<Assessment>) => void }) {
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const num = (v: string) => (v === "" ? undefined : Number(v));

  return (
    <div className="space-y-4">
      <Card>
        <StepHeading title="Life and people" intro="One Health means people, animals and the environment share the same water. Who's using this stream?" />
        <fieldset>
          <legend className="font-medium">🐟 Wildlife you saw</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {WILDLIFE_OPTIONS.map((o) => (
              <Choice key={o.value} type="checkbox" checked={a.wildlife.includes(o.value)} onChange={() => update({ wildlife: toggle(a.wildlife, o.value) })} label={o.label} />
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className="font-medium">🧍 People and pets in contact with the water</legend>
          <p className="text-xs text-slate-600">This tells health authorities whether pollution could actually reach people.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {HUMAN_CONTACT_OPTIONS.map((o) => (
              <Choice key={o.value} type="checkbox" checked={a.humanContact.includes(o.value)} onChange={() => update({ humanContact: toggle(a.humanContact, o.value) })} label={o.label} />
            ))}
          </div>
        </fieldset>
      </Card>
      <Card>
        <h2 className="font-medium">🧪 Water tests <span className="font-normal text-slate-600">(optional — if you have a kit)</span></h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <NumberField label="Temperature (°C)" value={a.tests.temperatureC} onChange={(v) => update({ tests: { ...a.tests, temperatureC: num(v) } })} />
          <NumberField label="pH" value={a.tests.ph} onChange={(v) => update({ tests: { ...a.tests, ph: num(v) } })} />
          <NumberField label="Nitrate (mg/L)" value={a.tests.nitrateMgL} onChange={(v) => update({ tests: { ...a.tests, nitrateMgL: num(v) } })} />
        </div>
        <label className="mt-5 block">
          <span className="font-medium">Anything else?</span>
          <textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} value={a.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="e.g. a pipe was pouring grey water though it hasn't rained" />
        </label>
      </Card>
    </div>
  );
}

// ─── Step 5: Review ──────────────────────────────────────────────────────────

function ReviewStep({ a, review, setReview, onJump, onSubmit }: { a: Assessment; review: (AssessmentReview & { demo: boolean }) | null; setReview: (r: (AssessmentReview & { demo: boolean }) | null) => void; onJump: (n: number) => void; onSubmit: () => void }) {
  const score = useMemo(() => scoreAssessment(a), [a]);
  const signals = useMemo(() => oneHealthSignals(a), [a]);
  const checks = useMemo(() => validateAssessment(a), [a]);
  const confidence = useMemo(() => dataConfidence(a, checks), [a, checks]);
  const blocked = checks.some((c) => c.level === "error");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const askReview = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...a, photos: [] }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <StepHeading title="Your stream report" intro="Here's what your observations tell us. Check the flags, then submit." />
        <ScoreDial score={score} />
        <ScoreExplanation score={score} />
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">One Health signals</h2>
        <SignalList signals={signals} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Data checks</h2>
          <Button variant="ghost" className="min-h-9 py-1" onClick={() => onJump(2)}>Edit answers</Button>
        </div>
        <CheckList checks={checks} />
        <div className="mt-4 border-t border-slate-100 pt-4"><ConfidenceMeter confidence={confidence} /></div>
      </Card>

      <Card className="border-violet-200">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">✦ AI second opinion</h2>
          {review && <AiBadge demo={review.demo} />}
        </div>
        {!review ? (
          <>
            <p className="text-sm text-slate-600">Get a plain-language explanation of your results and any questions worth double-checking. It can&apos;t change your answers or score.</p>
            <Button variant="secondary" className="mt-3" onClick={askReview} disabled={busy || score.score === null}>{busy ? "Reading your survey…" : "Explain my results"}</Button>
            {error && <p className="mt-2 text-sm text-amber-800" role="alert">{error}</p>}
          </>
        ) : (
          <div className="space-y-4 text-sm">
            <p>{review.plainLanguageSummary}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["human", "animal", "environment"] as const).map((l) => (
                <div key={l} className="rounded-lg bg-slate-50 p-3">
                  <p className="mb-1 font-medium">{LENS_META[l].icon} {LENS_META[l].label}</p>
                  <p className="text-slate-700">{review.oneHealth[l]}</p>
                </div>
              ))}
            </div>
            {review.doubleCheckQuestions.length > 0 && (
              <div>
                <p className="font-medium">Worth a second look</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {review.doubleCheckQuestions.map((q) => <li key={q.question}>{q.question} <span className="text-slate-600">— {q.reason}</span></li>)}
                </ul>
              </div>
            )}
            <div>
              <p className="font-medium">Next steps</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">{review.nextSteps.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => onJump(3)}>← Back</Button>
        <Button onClick={onSubmit} disabled={blocked}>{blocked ? "Fix the ⛔ items to submit" : "Submit report"}</Button>
      </div>
    </div>
  );
}

function Submitted({ sub, onRestart }: { sub: Submission; onRestart: () => void }) {
  const reviewing = sub.status === "needs_review";
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden>{reviewing ? "🔎" : "🌊"}</p>
      <h1 className="mt-4 text-2xl font-semibold">Thank you — report submitted</h1>
      <p className="mt-2 text-slate-700">
        {reviewing
          ? "Your report includes something unusual, so a trained reviewer will take a look before it's published. That's how we keep citizen data trustworthy."
          : "Your report passed all checks and is now part of the stream's health record."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={onRestart}>Survey another spot</Button>
        <Link href="/review" className="inline-flex min-h-11 items-center rounded-lg border border-cyan-800 px-4 text-sm font-medium text-cyan-900 hover:bg-cyan-50">See review queue</Link>
      </div>
    </div>
  );
}

// ─── Inputs ──────────────────────────────────────────────────────────────────

function Choice({ label, checked, onChange, name, type = "radio" }: { label: string; checked: boolean; onChange: () => void; name?: string; type?: "radio" | "checkbox" }) {
  return (
    <label className={cx("flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-cyan-700", checked ? "border-cyan-700 bg-cyan-50 font-medium" : "border-slate-200 hover:border-slate-400")}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-cyan-800" />
      {label}
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value?: number; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input type="number" inputMode="decimal" step="any" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
