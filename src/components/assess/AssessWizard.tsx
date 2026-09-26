"use client";

import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
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
import { CheckList, ConfidenceMeter, LensLabel, LensMark, ScoreDial, ScoreExplanation, SignalList } from "../insights";
import { AiBadge, Badge, BUTTON_BASE, BUTTON_VARIANTS, Button, Card, cx, PencilMark, StreamMark } from "../ui";

const STEPS = ["Site", "Photos", "Observe", "Life and people", "Review"] as const;

const INPUT = "mt-1.5 w-full rounded-sm border border-line bg-card px-3 py-2.5 text-ink placeholder:text-ink-soft/70 focus:border-river";

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
        <div className="mt-6 flex justify-between gap-3">
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>Back</Button>
          <Button onClick={() => go(step + 1)}>Next: {STEPS[step + 1]}</Button>
        </div>
      )}
    </div>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (n: number) => void }) {
  return (
    <nav aria-label="Survey progress" className="mb-6">
      <ol className="grid grid-cols-5 overflow-hidden rounded-md border border-line bg-card">
        {STEPS.map((s, i) => (
          <li key={s} className={cx(i > 0 && "border-l border-line")}>
            <button
              onClick={() => onJump(i)}
              aria-current={i === step ? "step" : undefined}
              className={cx(
                "flex h-full w-full flex-col items-start px-2 py-2 text-left text-xs sm:px-3 sm:text-sm",
                i === step ? "bg-river text-card" : i < step ? "text-river-deep hover:bg-river-wash" : "text-ink-soft hover:bg-river-wash",
              )}
            >
              <span className="font-display text-lg leading-none font-bold">{i + 1}</span>
              <span className="mt-1 hidden leading-tight sm:block">{s}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm text-ink-soft sm:hidden">Step {step + 1} of 5: {STEPS[step]}</p>
    </nav>
  );
}

function StepHeading({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl leading-tight font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-prose text-ink-soft">{intro}</p>
    </div>
  );
}

/** Suggestions from the photo assistant, written in pencil beside the question. */
function PencilNote({ children }: { children: ReactNode }) {
  return <div className="mt-4 border-l-2 border-dashed border-pencil bg-pencil-wash/70 py-3 pr-3 pl-4 text-sm">{children}</div>;
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
      <StepHeading title="Where are you?" intro="This takes about 10 minutes. You don't need to be an expert. We explain everything as we go." />
      <div className="space-y-6">
        <label className="block">
          <span className="font-semibold">Your name or group</span>
          <input className={INPUT} value={a.observer} onChange={(e) => update({ observer: e.target.value })} placeholder="For example Sam, or Riverside Primary Year 5" />
        </label>
        <label className="block">
          <span className="font-semibold">Stream and spot name <span className="text-rose-700" aria-hidden>*</span><span className="sr-only">(required)</span></span>
          <input className={INPUT} value={a.site.name} onChange={(e) => update({ site: { ...a.site, name: e.target.value } })} placeholder="For example Millbrook, by the footbridge" required />
        </label>
        <div>
          <Button variant="secondary" onClick={locate} disabled={locating}>{locating ? "Finding you…" : a.site.lat ? "Update location" : "Use my location"}</Button>
          {a.site.lat !== undefined && <p className="mt-2 text-sm text-emerald-800">Location saved ({a.site.lat}, {a.site.lng})</p>}
          {geoError && <p className="mt-2 text-sm text-amber-800" role="alert">{geoError}</p>}
        </div>
        <fieldset>
          <legend className="font-semibold">Weather</legend>
          <p className="text-sm text-ink-soft">Rain washes pollution from roads into streams, so it changes what you&apos;ll see.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {([["dry", "Dry for 2 or more days"], ["rain_24h", "Rained in the last day"], ["raining", "Raining now"]] as const).map(([v, l]) => (
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
      <StepHeading title="Take a photo of the stream" intro="Show the water and both banks if you can. The photo assistant will suggest answers, and you check every one." />
      <div className="flex flex-wrap gap-3">
        {a.photos.map((p, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p} alt={`Stream photo ${i + 1}`} className="h-32 w-32 rounded-sm border border-line object-cover" />
            <button className="absolute top-1 right-1 rounded-sm bg-card/95 px-2 py-0.5 text-xs font-semibold text-ink" aria-label={`Remove photo ${i + 1}`} onClick={() => { update({ photos: a.photos.filter((_, j) => j !== i), aiSuggestions: [], aiDecisions: {} }); setResult(null); }}>Remove</button>
          </div>
        ))}
        {a.photos.length < 3 && (
          <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-line text-sm font-semibold text-river-deep hover:border-river has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-pencil">
            <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            Add photo
            <input type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
          </label>
        )}
      </div>

      {a.photos.length > 0 && !result && (
        <Button className="mt-5" onClick={analyse} disabled={busy}>{busy ? "Looking at your photos…" : "Ask the photo assistant"}</Button>
      )}
      {error && <p className="mt-3 text-sm text-amber-800" role="alert">{error}</p>}

      {result && (
        <PencilNote>
          <AiBadge demo={result.demo} />
          {!result.showsWaterbody ? (
            <p className="mt-2">This doesn&apos;t look like a stream. Try a photo showing the water and banks.</p>
          ) : (
            <>
              <p className="mt-2">{result.summary}</p>
              {!result.photoQuality.usable && <p className="mt-2 text-amber-900">Photo problem: {result.photoQuality.issues.join(", ")}</p>}
              {result.photoQuality.retakeTip && <p className="mt-1 text-ink-soft">Tip: {result.photoQuality.retakeTip}</p>}
              <p className="mt-2 font-semibold text-pencil">{result.suggestions.filter((s) => s.value !== "cannot_tell").length} suggestions are waiting for you on the next step.</p>
            </>
          )}
        </PencilNote>
      )}
      <p className="mt-6 text-sm text-ink-soft">No camera? Skip this step. You can do the whole survey by eye.</p>
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
        <StepHeading title="What do you notice?" intro="Trust your senses. If the photo assistant has a suggestion, you'll see it in pencil blue. Nothing is filled in until you choose." />
        <p className="text-sm text-ink-soft">{Object.keys(a.answers).length} of {INDICATORS.length} answered</p>
      </Card>
      {INDICATORS.map((ind, n) => {
        const s = a.aiSuggestions.find((x) => x.indicator === ind.id && x.value !== "cannot_tell");
        const chosen = a.answers[ind.id];
        return (
          <Card key={ind.id}>
            <fieldset>
              <legend className="flex gap-3 font-display text-xl leading-snug font-semibold">
                <span className="text-silt tabular-nums">{n + 1}</span>
                <span>{ind.question}</span>
              </legend>
              <details className="mt-2 text-sm text-ink-soft">
                <summary className="cursor-pointer text-river-deep">Scientists call this <strong>{ind.term}</strong>. Why it matters</summary>
                <p className="mt-2">{ind.termExplainer}</p>
                <p className="mt-1">{ind.whyItMatters}</p>
                <p className="mt-2 flex flex-wrap gap-2">{ind.lenses.map((l) => <Badge key={l}><LensLabel lens={l} /></Badge>)}</p>
              </details>

              {s && (
                <PencilNote>
                  <div className="flex flex-wrap items-center gap-2">
                    <AiBadge demo={demo} />
                    <span className="text-pencil">{s.confidence} confidence</span>
                  </div>
                  <p className="mt-2"><strong className="text-pencil">{optionLabel(ind.id, s.value)}.</strong> <span className="text-ink-soft">{s.evidence}</span></p>
                  {chosen === undefined ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button className={cx(BUTTON_BASE, "min-h-9 border border-pencil bg-card py-1 text-pencil hover:bg-pencil-wash")} onClick={() => answer(ind, s.value, true)}>Looks right</button>
                      <span className="text-ink-soft">or pick what you see below</span>
                    </div>
                  ) : (
                    <p className="mt-2 text-ink-soft">
                      {a.aiDecisions[ind.id] === "accepted" ? "You agreed with the suggestion." : "You chose differently. Your observation is what counts."}
                    </p>
                  )}
                </PencilNote>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
        <StepHeading title="Life and people" intro="People, animals and nature share the same water. Who is using this stream?" />
        <fieldset>
          <legend className="flex items-center gap-2 font-semibold"><LensMark lens="animal" className="h-5 w-5 text-river" />Wildlife you saw</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {WILDLIFE_OPTIONS.map((o) => (
              <Choice key={o.value} type="checkbox" checked={a.wildlife.includes(o.value)} onChange={() => update({ wildlife: toggle(a.wildlife, o.value) })} label={o.label} />
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-8">
          <legend className="flex items-center gap-2 font-semibold"><LensMark lens="human" className="h-5 w-5 text-river" />People and pets in contact with the water</legend>
          <p className="text-sm text-ink-soft">This tells health teams whether pollution could actually reach people.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {HUMAN_CONTACT_OPTIONS.map((o) => (
              <Choice key={o.value} type="checkbox" checked={a.humanContact.includes(o.value)} onChange={() => update({ humanContact: toggle(a.humanContact, o.value) })} label={o.label} />
            ))}
          </div>
        </fieldset>
      </Card>
      <Card>
        <h2 className="font-semibold">Water tests <span className="font-normal text-ink-soft">(optional, if you have a kit)</span></h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <NumberField label="Temperature (°C)" value={a.tests.temperatureC} onChange={(v) => update({ tests: { ...a.tests, temperatureC: num(v) } })} />
          <NumberField label="pH" value={a.tests.ph} onChange={(v) => update({ tests: { ...a.tests, ph: num(v) } })} />
          <NumberField label="Nitrate (mg/L)" value={a.tests.nitrateMgL} onChange={(v) => update({ tests: { ...a.tests, nitrateMgL: num(v) } })} />
        </div>
        <label className="mt-6 block">
          <span className="font-semibold">Anything else?</span>
          <textarea className={INPUT} rows={3} value={a.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="For example, a pipe was pouring grey water even though it hasn't rained" />
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
        <h2 className="mb-4 font-display text-2xl font-semibold">Health alerts</h2>
        <SignalList signals={signals} />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-semibold">Data checks</h2>
          <Button variant="ghost" className="min-h-9 py-1" onClick={() => onJump(2)}>Edit answers</Button>
        </div>
        <CheckList checks={checks} />
        <div className="mt-5 border-t border-line pt-5"><ConfidenceMeter confidence={confidence} /></div>
      </Card>

      <Card className="border-pencil/40">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-pencil"><PencilMark className="h-5 w-5" />AI second opinion</h2>
          {review && <AiBadge demo={review.demo} />}
        </div>
        {!review ? (
          <>
            <p className="text-ink-soft">Get a plain English explanation of your results and anything worth checking again. It can&apos;t change your answers or score.</p>
            <button className={cx(BUTTON_BASE, "mt-4 border border-pencil bg-card text-pencil hover:bg-pencil-wash")} onClick={askReview} disabled={busy || score.score === null}>{busy ? "Reading your survey…" : "Explain my results"}</button>
            {error && <p className="mt-2 text-sm text-amber-800" role="alert">{error}</p>}
          </>
        ) : (
          <div className="space-y-5">
            <p>{review.plainLanguageSummary}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["human", "animal", "environment"] as const).map((l) => (
                <div key={l} className="rounded-sm bg-pencil-wash/70 p-3 text-sm">
                  <p className="mb-1 font-semibold text-pencil"><LensLabel lens={l} /></p>
                  <p className="text-ink-soft">{review.oneHealth[l]}</p>
                </div>
              ))}
            </div>
            {review.doubleCheckQuestions.length > 0 && (
              <div>
                <p className="font-semibold">Worth a second look</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {review.doubleCheckQuestions.map((q) => <li key={q.question}>{q.question} <span className="text-ink-soft">{q.reason}</span></li>)}
                </ul>
              </div>
            )}
            <div>
              <p className="font-semibold">Next steps</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">{review.nextSteps.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="ghost" onClick={() => onJump(3)}>Back</Button>
        <Button onClick={onSubmit} disabled={blocked}>{blocked ? "Fix the must fix items to submit" : "Submit report"}</Button>
      </div>
    </div>
  );
}

function Submitted({ sub, onRestart }: { sub: Submission; onRestart: () => void }) {
  const reviewing = sub.status === "needs_review";
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <StreamMark className="h-8 w-14 text-river" />
      <h1 className="mt-5 font-display text-4xl font-semibold">Report submitted. Thank you.</h1>
      <p className="mt-3 text-lg text-ink-soft">
        {reviewing
          ? "Your report includes something unusual, so a trained reviewer will look at it before it is published. That's how we keep volunteer data trustworthy."
          : "Your report passed all checks and is now part of this stream's health record."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={onRestart}>Survey another spot</Button>
        <Link href="/review" className={cx(BUTTON_BASE, BUTTON_VARIANTS.secondary)}>See the review queue</Link>
      </div>
    </div>
  );
}

// ─── Inputs ──────────────────────────────────────────────────────────────────

function Choice({ label, checked, onChange, name, type = "radio" }: { label: ReactNode; checked: boolean; onChange: () => void; name?: string; type?: "radio" | "checkbox" }) {
  return (
    <label className={cx("flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border px-3 py-2 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-pencil", checked ? "border-river bg-river-wash font-semibold text-river-deep" : "border-line bg-card hover:border-ink-soft")}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 accent-river" />
      {label}
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value?: number; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input type="number" inputMode="decimal" step="any" className={INPUT} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
