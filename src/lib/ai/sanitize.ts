import { type AiSuggestion, INDICATOR_BY_ID } from "../protocol";
import type { PhotoAnalysis } from "./schemas";

/**
 * Guardrail between the model and the UI: drop suggestions for indicators
 * that aren't photo-assessable, coerce unknown option values to
 * "cannot_tell", and keep one suggestion per indicator.
 */
export function sanitizeSuggestions(raw: PhotoAnalysis["suggestions"]): AiSuggestion[] {
  const seen = new Set<string>();
  const out: AiSuggestion[] = [];
  for (const s of raw) {
    const ind = INDICATOR_BY_ID[s.indicator];
    if (!ind?.visual || seen.has(s.indicator)) continue;
    seen.add(s.indicator);
    const valid = ind.options.some((o) => o.value === s.value);
    out.push({
      indicator: s.indicator,
      value: valid ? s.value : "cannot_tell",
      confidence: valid ? s.confidence : "low",
      evidence: s.evidence.slice(0, 240),
    });
  }
  return out;
}
