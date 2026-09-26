import type { Lens } from "@/lib/protocol";
import type { HealthBand, OneHealthSignal, StreamHealthScore } from "@/lib/scoring";
import type { DataConfidence, ValidationCheck } from "@/lib/validation";
import { Badge, cx, type Tone } from "./ui";

export const BAND_META: Record<HealthBand, { label: string; tone: Tone; fill: string }> = {
  healthy: { label: "Healthy", tone: "green", fill: "bg-emerald-600" },
  moderate: { label: "Moderate", tone: "amber", fill: "bg-amber-500" },
  stressed: { label: "Stressed", tone: "orange", fill: "bg-orange-600" },
  critical: { label: "Critical", tone: "red", fill: "bg-rose-600" },
};

// Low to high, matching the published band thresholds.
const BANDS: { band: HealthBand; from: number }[] = [
  { band: "critical", from: 0 },
  { band: "stressed", from: 25 },
  { band: "moderate", from: 50 },
  { band: "healthy", from: 75 },
];

export const LENS_META: Record<Lens, { label: string }> = {
  human: { label: "People" },
  animal: { label: "Animals" },
  environment: { label: "Environment" },
};

export function LensMark({ lens, className = "h-4 w-4" }: { lens: Lens; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {lens === "human" && (
        <>
          <circle cx="8" cy="4" r="2" />
          <path d="M4.5 14v-3.5a3.5 3.5 0 0 1 7 0V14" />
        </>
      )}
      {lens === "animal" && (
        <>
          <path d="M1.5 8c2.5-3.5 7-4 10 0-3 4-7.5 3.5-10 0z" />
          <path d="M11.5 8l3-2.5v5z" />
        </>
      )}
      {lens === "environment" && (
        <>
          <path d="M3 13C3 6.5 7 3 13.5 3 13.5 9.5 10 13 3 13z" />
          <path d="M3 13l6.5-6.5" />
        </>
      )}
    </svg>
  );
}

export function LensLabel({ lens }: { lens: Lens }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <LensMark lens={lens} /> {LENS_META[lens].label}
    </span>
  );
}

/** The score reads like a river staff gauge: a graduated post with the level marked on it. */
export function ScoreDial({ score }: { score: StreamHealthScore }) {
  if (score.score === null || !score.band) {
    return <p className="text-ink-soft">Answer at least 3 observations to see a health score.</p>;
  }
  const meta = BAND_META[score.band];
  return (
    <div>
      <div className="flex items-end gap-4">
        <p className="font-display text-6xl leading-none font-bold tabular-nums text-ink">{score.score}</p>
        <div className="pb-1">
          <p className="font-display text-2xl leading-tight font-semibold">{meta.label}</p>
          <p className="text-sm text-ink-soft">Stream Health Index, out of 100</p>
        </div>
      </div>
      <div
        className="relative mt-5"
        role="img"
        aria-label={`Stream Health Index ${score.score} out of 100, ${meta.label}`}
      >
        <div className="flex h-3 overflow-hidden rounded-sm">
          {BANDS.map(({ band }) => (
            <span key={band} className={cx("flex-1", BAND_META[band].fill, band === score.band ? "opacity-100" : "opacity-25")} />
          ))}
        </div>
        <span className="absolute -top-1.5 h-6 w-1 -translate-x-1/2 rounded-sm bg-ink" style={{ left: `${score.score}%` }} />
        <div className="mt-1.5 flex text-xs text-ink-soft" aria-hidden>
          {BANDS.map(({ band, from }) => (
            <span key={band} className="flex-1">{from}</span>
          ))}
          <span>100</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Based on {score.answered} of {score.total} observations. A fixed formula works this out, not the AI.
      </p>
    </div>
  );
}

export function ScoreExplanation({ score }: { score: StreamHealthScore }) {
  if (!score.contributions.length) return null;
  return (
    <div className="mt-6 border-t border-line pt-5">
      <h4 className="mb-3 font-semibold">What lowered the score</h4>
      <ul className="space-y-2">
        {score.contributions.slice(0, 5).map((c) => (
          <li key={c.term} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-3 text-sm">
            <span className="truncate text-ink-soft">{c.term}</span>
            <span className="h-2 rounded-sm bg-river-wash">
              <span className="block h-2 rounded-sm bg-silt" style={{ width: `${Math.min(100, c.penalty * 4)}%` }} />
            </span>
            <span className="text-right tabular-nums text-ink-soft">−{c.penalty}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SEVERITY = {
  urgent: { tone: "red", rule: "border-l-rose-600", label: "Urgent" },
  concern: { tone: "orange", rule: "border-l-orange-600", label: "Concern" },
  watch: { tone: "amber", rule: "border-l-amber-500", label: "Watch" },
} as const;

export function SignalList({ signals }: { signals: OneHealthSignal[] }) {
  if (!signals.length) {
    return <p className="text-ink-soft">No warning signs for people, animals or nature in this survey.</p>;
  }
  return (
    <ul className="space-y-3">
      {signals.map((s) => (
        <li key={s.id} className={cx("border-l-4 bg-paper/60 py-3 pr-3 pl-4", SEVERITY[s.severity].rule)}>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold">{s.title}</span>
            <Badge tone={SEVERITY[s.severity].tone}>{SEVERITY[s.severity].label}</Badge>
            <Badge><LensLabel lens={s.lens} /></Badge>
          </div>
          <p className="text-sm text-ink-soft">{s.explanation}</p>
          <p className="mt-1.5 text-sm font-semibold text-river-deep">What to do: {s.action}</p>
        </li>
      ))}
    </ul>
  );
}

const CHECK_META = {
  error: { label: "Must fix", mark: "bg-rose-600", text: "text-rose-900" },
  warning: { label: "Double check", mark: "bg-amber-500", text: "text-amber-900" },
  info: { label: "Note", mark: "bg-line", text: "text-ink-soft" },
} as const;

export function CheckList({ checks }: { checks: ValidationCheck[] }) {
  if (!checks.length) return <p className="text-emerald-800">All data checks passed.</p>;
  return (
    <ul className="space-y-3">
      {checks.map((c) => (
        <li key={c.id} className="grid grid-cols-[0.5rem_1fr] gap-3 text-sm">
          <span aria-hidden className={cx("mt-1.5 h-2 w-2 rounded-full", CHECK_META[c.level].mark)} />
          <div>
            <p className={CHECK_META[c.level].text}>
              <span className="font-semibold">{CHECK_META[c.level].label}: </span>
              {c.message}
            </p>
            {c.prompt && <p className="mt-0.5 text-ink-soft italic">{c.prompt}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ConfidenceMeter({ confidence }: { confidence: DataConfidence }) {
  const tone = confidence.tier === "high" ? "green" : confidence.tier === "medium" ? "amber" : "red";
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-semibold">Data confidence</span>
        <Badge tone={tone}>{confidence.tier}, {confidence.score} out of 100</Badge>
      </div>
      <ul className="space-y-0.5 text-sm text-ink-soft">
        {confidence.reasons.map((r) => <li key={r}>{r}</li>)}
      </ul>
    </div>
  );
}
