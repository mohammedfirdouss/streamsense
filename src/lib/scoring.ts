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
        "A sewage smell, dark water or a pipe pouring out dirty water are strong signs of germs from poo, such as E. coli." +
        (peopleInWater ? " People were seen in contact with the water." : ""),
      action: "Stay out of the water. Report the place to your local water company or environment agency.",
    });
  }

  if (ans.algae === "bloom" || (ans.algae === "lots" && ans.waterColour === "green")) {
    s.push({
      id: "cyanobacteria",
      lens: dogsInWater ? "animal" : "human",
      severity: dogsInWater || peopleInWater ? "urgent" : "concern",
      title: "Possible poisonous algae",
      explanation:
        "Thick green algae can be blue green algae, which is poisonous to people and can kill dogs.",
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
        "Dead animals can mean pollution, too little oxygen or disease. Other wildlife and pets may be at risk too.",
      action: "Don't touch the animals. Report it straight away to the environment agency's incident line.",
    });
  }

  if (ans.surfaceFilm === "oily_sheen" || ans.odour === "chemical") {
    s.push({
      id: "chemical",
      lens: "environment",
      severity: "concern",
      title: "Possible chemical or fuel pollution",
      explanation: "Oil on the water and chemical smells mean fuel or other harmful substances are getting in.",
      action: "Note where it is coming from if you can see it, and report it. Stay out of the water.",
    });
  }

  if ((ans.flow === "still" || ans.flow === "slow") && (a.tests.temperatureC ?? 0) >= 20) {
    s.push({
      id: "low_oxygen",
      lens: "animal",
      severity: "watch",
      title: "Warm, slow water may be low in oxygen",
      explanation: "Warm, still water holds little oxygen, which harms fish and water insects, and can breed mosquitoes.",
      action: "Check again in a few days to see if it is still the same.",
    });
  }

  if (a.tests.nitrateMgL !== undefined && a.tests.nitrateMgL > 11) {
    s.push({
      id: "nutrients",
      lens: "environment",
      severity: a.tests.nitrateMgL > 50 ? "concern" : "watch",
      title: "High nitrate",
      explanation:
        "Nitrate comes from fertiliser, sewage or rainwater running off the land. Too much makes algae grow, and above 50 mg/L it is over the safe limit for drinking water.",
      action: "Look upstream for farmland, drains or pipes that could be the cause.",
    });
  }

  if (ans.bankVegetation === "hard_engineered" || ans.bankErosion === "significant") {
    s.push({
      id: "habitat",
      lens: "environment",
      severity: "watch",
      title: "Damaged banks",
      explanation: "Concrete or crumbling banks can't clean the water or give wildlife a safe path the way healthy banks do.",
      action: "This could be a good spot for community planting or repair work.",
    });
  }

  const order = { urgent: 0, concern: 1, watch: 2 };
  return s.sort((x, y) => order[x.severity] - order[y.severity]);
}
