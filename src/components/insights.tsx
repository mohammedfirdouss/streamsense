import type { Lens } from "@/lib/protocol";
import type { HealthBand, OneHealthSignal, StreamHealthScore } from "@/lib/scoring";
import type { DataConfidence, ValidationCheck } from "@/lib/validation";
import { Badge, type Tone } from "./ui";

export const BAND_META: Record<HealthBand, { label: string; tone: Tone; ring: string }> = {
  healthy: { label: "Healthy", tone: "green", ring: "text-emerald-600" },
  moderate: { label: "Moderate", tone: "amber", ring: "text-amber-500" },
  stressed: { label: "Stressed", tone: "orange", ring: "text-orange-600" },
  critical: { label: "Critical", tone: "red", ring: "text-rose-600" },
};

export const LENS_META: Record<Lens, { label: string; icon: string }> = {
  human: { label: "People", icon: "🧍" },
  animal: { label: "Animals", icon: "🐟" },
  environment: { label: "Environment", icon: "🌿" },
};

export function ScoreDial({ score }: { score: StreamHealthScore }) {
  if (score.score === null || !score.band) {
    return <p className="text-sm text-slate-600">Answer at least 3 observations to see a health score.</p>;
  }
  const meta = BAND_META[score.band];
  const circumference = 2 * Math.PI * 42;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0" role="img" aria-label={`Stream Health Index ${score.score} out of 100, ${meta.label}`}>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
          className={meta.ring}
          strokeDasharray={`${(score.score / 100) * circumference} ${circumference}`}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" textAnchor="middle" className="fill-slate-900 text-2xl font-semibold">{score.score}</text>
      </svg>
      <div>
        <p className="text-sm text-slate-600">Stream Health Index</p>
        <p className="mb-1 text-xl font-semibold">{meta.label}</p>
        <p className="text-xs text-slate-600">Based on {score.answered} of {score.total} observations. Calculated by a fixed formula — not by AI.</p>
      </div>
    </div>
  );
}

export function ScoreExplanation({ score }: { score: StreamHealthScore }) {
  if (!score.contributions.length) return null;
  return (
    <div className="mt-4">
      <h4 className="mb-2 text-sm font-semibold">Why this score?</h4>
      <ul className="space-y-1.5">
        {score.contributions.slice(0, 5).map((c) => (
          <li key={c.term} className="flex items-center gap-3 text-sm">
            <span className="w-40 shrink-0 truncate text-slate-700">{c.term}</span>
            <span className="h-2 flex-1 rounded bg-slate-100">
              <span className="block h-2 rounded bg-orange-400" style={{ width: `${Math.min(100, c.penalty * 4)}%` }} />
            </span>
            <span className="w-10 text-right tabular-nums text-slate-600">−{c.penalty}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SEVERITY_TONE = { urgent: "red", concern: "orange", watch: "amber" } as const;

export function SignalList({ signals }: { signals: OneHealthSignal[] }) {
  if (!signals.length) {
    return <p className="text-sm text-slate-600">No One Health warning signs in this survey. 🎉</p>;
  }
  return (
    <ul className="space-y-3">
      {signals.map((s) => (
        <li key={s.id} className="rounded-lg border border-slate-200 p-3">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span aria-hidden>{LENS_META[s.lens].icon}</span>
            <span className="font-medium">{s.title}</span>
            <Badge tone={SEVERITY_TONE[s.severity]}>{s.severity}</Badge>
            <Badge>{LENS_META[s.lens].label}</Badge>
          </div>
          <p className="text-sm text-slate-700">{s.explanation}</p>
          <p className="mt-1 text-sm font-medium text-cyan-900">→ {s.action}</p>
        </li>
      ))}
    </ul>
  );
}

const CHECK_META = {
  error: { icon: "⛔", tone: "text-rose-800" },
  warning: { icon: "⚠️", tone: "text-amber-800" },
  info: { icon: "ℹ️", tone: "text-slate-700" },
} as const;

export function CheckList({ checks }: { checks: ValidationCheck[] }) {
  if (!checks.length) return <p className="text-sm text-emerald-800">✓ All data checks passed.</p>;
  return (
    <ul className="space-y-2">
      {checks.map((c) => (
        <li key={c.id} className={`text-sm ${CHECK_META[c.level].tone}`}>
          <span aria-hidden>{CHECK_META[c.level].icon} </span>
          <span className="sr-only">{c.level}: </span>
          {c.message}
          {c.prompt && <span className="block pl-6 text-slate-600 italic">{c.prompt}</span>}
        </li>
      ))}
    </ul>
  );
}

export function ConfidenceMeter({ confidence }: { confidence: DataConfidence }) {
  const tone = confidence.tier === "high" ? "green" : confidence.tier === "medium" ? "amber" : "red";
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold">Data confidence</span>
        <Badge tone={tone}>{confidence.tier} · {confidence.score}/100</Badge>
      </div>
      <ul className="text-xs text-slate-600">
        {confidence.reasons.map((r) => <li key={r}>{r}</li>)}
      </ul>
    </div>
  );
}
