import { type Assessment, INDICATORS, type Lens } from "./protocol";

export type HealthBand = "healthy" | "moderate" | "stressed" | "critical";

export interface ScoreContribution {
  indicator: string;
  term: string;
  stress: number;
  /** Points this indicator removed from a perfect 100. */
  penalty: number;
}

export interface StreamHealthScore {
  score: number | null;
  band: HealthBand | null;
  answered: number;
  total: number;
  /** Sorted most-damaging first — powers the "why this score" explanation. */
  contributions: ScoreContribution[];
}

export function bandFor(score: number): HealthBand {
  if (score >= 75) return "healthy";
  if (score >= 50) return "moderate";
  if (score >= 25) return "stressed";
  return "critical";
}

/**
 * Stream Health Index (0–100). Weighted mean of indicator stress, inverted.
 * Unanswered indicators are excluded rather than assumed healthy, so a
 * partial survey never looks better than it is.
 */
export function scoreAssessment(a: Pick<Assessment, "answers">): StreamHealthScore {
  let weightSum = 0;
  let stressSum = 0;
  const raw: { indicator: string; term: string; stress: number; weight: number }[] = [];

  for (const ind of INDICATORS) {
    const value = a.answers[ind.id];
    const opt = ind.options.find((o) => o.value === value);
    if (!opt) continue;
    weightSum += ind.weight;
    stressSum += ind.weight * opt.stress;
    raw.push({ indicator: ind.question, term: ind.term, stress: opt.stress, weight: ind.weight });
  }

  if (raw.length < 3) {
    return { score: null, band: null, answered: raw.length, total: INDICATORS.length, contributions: [] };
  }

  // `+ 0` normalises -0 (from floating-point rounding) to 0.
  const score = Math.round(100 * (1 - stressSum / (3 * weightSum))) + 0;
  const contributions = raw
    .map((r) => ({
      indicator: r.indicator,
      term: r.term,
      stress: r.stress,
      penalty: Math.round((100 * r.weight * r.stress) / (3 * weightSum)),
    }))
    .filter((c) => c.penalty > 0)
    .sort((x, y) => y.penalty - x.penalty);

  return { score, band: bandFor(score), answered: raw.length, total: INDICATORS.length, contributions };
}

export interface OneHealthSignal {
  id: string;
  lens: Lens;
  severity: "watch" | "concern" | "urgent";
  title: string;
  explanation: string;
  action: string;
}

/**
 * Rule-based One Health signals. Each rule links an ecosystem observation to
 * a concrete human, animal or environmental health pathway. These are
 * transparent and auditable — the AI narrates them, it doesn't invent them.
 */
export function oneHealthSignals(a: Assessment): OneHealthSignal[] {
  const s: OneHealthSignal[] = [];
  const ans = a.answers;
  const contact = a.humanContact.filter((c) => c !== "none_seen");
  const peopleInWater = contact.some((c) => c === "swimming" || c === "children_playing");
  const dogsInWater = contact.includes("dogs_in_water");
  const sewageSigns =
    ans.odour === "sewage" || ans.outfalls === "dirty_discharge" || ans.waterColour === "grey_black";

  if (sewageSigns) {
    s.push({
      id: "sewage",
      lens: "human",
      severity: peopleInWater || dogsInWater ? "urgent" : "concern",
      title: "Possible sewage contamination",
      explanation:
        "Sewage smell, dark water or a dirty discharging pipe are strong signs of faecal bacteria such as E. coli." +
        (peopleInWater ? " People were seen in contact with the water." : ""),
      action: "Avoid contact with the water. Report the location to your local water utility or environment agency.",
    });
  }

  if (ans.algae === "bloom" || (ans.algae === "lots" && ans.waterColour === "green")) {
    s.push({
      id: "cyanobacteria",
      lens: dogsInWater ? "animal" : "human",
      severity: dogsInWater || peopleInWater ? "urgent" : "concern",
      title: "Possible harmful algal bloom",
      explanation:
        "Dense green blooms can contain cyanobacteria, whose toxins can harm people and are a known cause of dog deaths.",
      action: "Keep dogs and children out of the water. Photograph the bloom and report it.",
    });
  }

  if (a.wildlife.includes("dead_animals")) {
    s.push({
      id: "fish_kill",
      lens: "animal",
      severity: "urgent",
      title: "Dead fish or animals reported",
      explanation:
        "Deaths can signal a pollution event, low oxygen or disease — and may affect other wildlife and pets.",
      action: "Do not touch the animals. Report immediately to the environmental authority's incident line.",
    });
  }

  if (ans.surfaceFilm === "oily_sheen" || ans.odour === "chemical") {
    s.push({
      id: "chemical",
      lens: "environment",
      severity: "concern",
      title: "Possible chemical or fuel pollution",
      explanation: "Oily sheens and chemical smells indicate hydrocarbons or other toxic substances.",
      action: "Note the source if visible and report it. Avoid contact.",
    });
  }

  if ((ans.flow === "still" || ans.flow === "slow") && (a.tests.temperatureC ?? 0) >= 20) {
    s.push({
      id: "low_oxygen",
      lens: "animal",
      severity: "watch",
      title: "Warm, slow water — oxygen stress risk",
      explanation: "Warm still water holds little oxygen, stressing fish and invertebrates, and can breed mosquitoes.",
      action: "Re-survey after a few days to see if conditions persist.",
    });
  }

  if (a.tests.nitrateMgL !== undefined && a.tests.nitrateMgL > 11) {
    s.push({
      id: "nutrients",
      lens: "environment",
      severity: a.tests.nitrateMgL > 50 ? "concern" : "watch",
      title: "Elevated nitrate",
      explanation:
        "High nitrate (from fertiliser, sewage or runoff) drives algal blooms and, above 50 mg/L, exceeds drinking-water limits.",
      action: "Look upstream for farmland, drains or outfalls that may be the source.",
    });
  }

  if (ans.bankVegetation === "hard_engineered" || ans.bankErosion === "significant") {
    s.push({
      id: "habitat",
      lens: "environment",
      severity: "watch",
      title: "Degraded bank habitat",
      explanation: "Hard or eroding banks remove the natural filter and wildlife corridor that healthy streams provide.",
      action: "This site may be a good candidate for community planting or restoration.",
    });
  }

  const order = { urgent: 0, concern: 1, watch: 2 };
  return s.sort((x, y) => order[x.severity] - order[y.severity]);
}
