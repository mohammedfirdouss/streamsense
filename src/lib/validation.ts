import { type Assessment, INDICATOR_BY_ID, INDICATORS, optionLabel } from "./protocol";

export type CheckLevel = "error" | "warning" | "info";

export interface ValidationCheck {
  id: string;
  level: CheckLevel;
  message: string;
  /** A friendly question that helps the observer double-check, not a verdict. */
  prompt?: string;
}

const CONFIDENCE_RANK = { low: 0, medium: 1, high: 2 } as const;

/**
 * Deterministic data-quality checks. They run instantly on the client and
 * never block submission (except hard errors) — they ask the observer to
 * look again, and route unusual reports to a human reviewer.
 */
export function validateAssessment(a: Assessment): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const ans = a.answers;

  if (!a.site.name.trim()) {
    checks.push({ id: "site_name", level: "error", message: "Give the site a name so others can find it." });
  }
  if (a.site.lat === undefined || a.site.lng === undefined) {
    checks.push({
      id: "no_location",
      level: "warning",
      message: "No location saved, so the report can't be put on a map or compared over time.",
    });
  }
  if (a.photos.length === 0) {
    checks.push({
      id: "no_photo",
      level: "warning",
      message: "No photo added. Photos help reviewers check reports and make them much more useful.",
    });
  }

  const answered = INDICATORS.filter((i) => ans[i.id]).length;
  if (answered < INDICATORS.length) {
    checks.push({
      id: "incomplete",
      level: answered < 3 ? "error" : "info",
      message: `${answered} of ${INDICATORS.length} observations answered${answered < 3 ? ". Answer at least 3 to get a health score" : ""}.`,
    });
  }

  const { ph, temperatureC, nitrateMgL } = a.tests;
  if (ph !== undefined) {
    if (ph < 0 || ph > 14) {
      checks.push({ id: "ph_range", level: "error", message: `pH ${ph} isn't possible. pH goes from 0 to 14.` });
    } else if (ph < 5 || ph > 9.5) {
      checks.push({
        id: "ph_unusual",
        level: "warning",
        message: `pH ${ph} is very unusual for a city stream. It is usually between 6.5 and 8.5.`,
        prompt: "Could the test strip have been read in poor light, or after waiting too long?",
      });
    }
  }
  if (temperatureC !== undefined && (temperatureC < -1 || temperatureC > 35)) {
    checks.push({
      id: "temp_unusual",
      level: "warning",
      message: `${temperatureC}°C is outside the normal range for a stream.`,
      prompt: "Was the thermometer in the water for at least a minute, out of the sun?",
    });
  }
  if (nitrateMgL !== undefined && (nitrateMgL < 0 || nitrateMgL > 500)) {
    checks.push({ id: "nitrate_range", level: "error", message: `Nitrate ${nitrateMgL} mg/L isn't possible. Please check it again.` });
  }

  // Internal consistency — combinations that are possible but rare.
  if (ans.waterClarity === "clear" && (ans.waterColour === "grey_black" || ans.algae === "bloom")) {
    checks.push({
      id: "clarity_conflict",
      level: "warning",
      message: "The water is marked clear, but also dark or full of algae.",
      prompt: "Were you looking at different parts of the stream? If so, describe the worst part.",
    });
  }
  if (ans.flow === "dry" && ans.surfaceFilm && ans.surfaceFilm !== "none") {
    checks.push({
      id: "dry_with_film",
      level: "warning",
      message: "The stream is marked dry, but something on the water surface is recorded.",
      prompt: "Is there standing water in pools? If so, choose 'Still, not moving' for how the water is moving.",
    });
  }
  if (a.wildlife.includes("dead_animals") && ans.odour === "none" && ans.waterClarity === "clear") {
    checks.push({
      id: "dead_animals_clean",
      level: "info",
      message: "Dead animals were reported in water that otherwise looks clean. A reviewer will take a look.",
      prompt: "A close up photo helps experts tell pollution apart from natural causes.",
    });
  }
  if (a.weather !== "dry" && ans.outfalls === "clear_discharge") {
    checks.push({
      id: "wet_weather_outfall",
      level: "info",
      message: "Pipes often pour out rainwater after rain. This is usually normal.",
    });
  }
  if (a.humanContact.includes("none_seen") && a.humanContact.length > 1) {
    checks.push({
      id: "contact_conflict",
      level: "warning",
      message: "'Nobody using the water' is selected along with other activities.",
    });
  }

  // Human vs AI disagreement: the human's answer stands, but a reviewer sees it.
  for (const s of a.aiSuggestions) {
    const human = ans[s.indicator];
    if (!human || s.value === "cannot_tell" || human === s.value) continue;
    if (CONFIDENCE_RANK[s.confidence] < CONFIDENCE_RANK.medium) continue;
    const ind = INDICATOR_BY_ID[s.indicator];
    const humanStress = ind.options.find((o) => o.value === human)?.stress ?? 0;
    const aiStress = ind.options.find((o) => o.value === s.value)?.stress ?? 0;
    if (Math.abs(humanStress - aiStress) < 2) continue;
    checks.push({
      id: `disagree_${s.indicator}`,
      level: "info",
      message: `${ind.term}: you said "${optionLabel(s.indicator, human)}", the photo assistant suggested "${optionLabel(s.indicator, s.value)}".`,
      prompt: "You were there, so your answer is kept. A reviewer may compare it with the photo.",
    });
  }

  return checks;
}

export type ConfidenceTier = "high" | "medium" | "low";

export interface DataConfidence {
  tier: ConfidenceTier;
  score: number;
  reasons: string[];
}

/**
 * How much can a scientist trust this record? Transparent point system
 * shown to observers so they learn what makes data valuable.
 */
export function dataConfidence(a: Assessment, checks: ValidationCheck[]): DataConfidence {
  let score = 40;
  const reasons: string[] = [];
  const answered = INDICATORS.filter((i) => a.answers[i.id]).length;

  score += Math.round((answered / INDICATORS.length) * 20);
  reasons.push(`${answered}/${INDICATORS.length} observations (+${Math.round((answered / INDICATORS.length) * 20)})`);

  if (a.photos.length > 0) {
    score += 15;
    reasons.push("Photo evidence (+15)");
  }
  if (a.site.lat !== undefined) {
    score += 10;
    reasons.push("GPS location (+10)");
  }
  if (Object.values(a.tests).some((v) => v !== undefined)) {
    score += 10;
    reasons.push("Measured water tests (+10)");
  }
  const reviewed = Object.keys(a.aiDecisions).length;
  if (reviewed > 0) {
    score += 5;
    reasons.push("Checked photo suggestions (+5)");
  }
  const warnings = checks.filter((c) => c.level === "warning").length;
  if (warnings) {
    score -= warnings * 8;
    reasons.push(`${warnings} unresolved warning${warnings > 1 ? "s" : ""} (−${warnings * 8})`);
  }

  score = Math.max(0, Math.min(100, score));
  const tier: ConfidenceTier = score >= 75 ? "high" : score >= 50 ? "medium" : "low";
  return { tier, score, reasons };
}

/** Records needing a human expert before they're published. */
export function needsExpertReview(a: Assessment, checks: ValidationCheck[]): boolean {
  return (
    checks.some((c) => c.level === "warning" || c.id.startsWith("disagree_") || c.id === "dead_animals_clean") ||
    a.wildlife.includes("dead_animals")
  );
}
