/**
 * The StreamSense assessment protocol.
 *
 * Every indicator is phrased as a plain-language question, carries the
 * scientific term it maps to (so citizen data stays interoperable with
 * professional monitoring), and explains why it matters for One Health.
 *
 * `stress` is 0 (no pressure on the ecosystem) to 3 (severe pressure).
 * Scoring is fully deterministic — AI never decides the score.
 */

export type Lens = "human" | "animal" | "environment";

export interface IndicatorOption {
  value: string;
  label: string;
  stress: 0 | 1 | 2 | 3;
  hint?: string;
}

export interface Indicator {
  id: IndicatorId;
  question: string;
  term: string;
  termExplainer: string;
  whyItMatters: string;
  lenses: Lens[];
  /** Whether the AI can reasonably judge this from a photo. */
  visual: boolean;
  weight: number;
  options: IndicatorOption[];
}

export const INDICATOR_IDS = [
  "waterClarity",
  "waterColour",
  "odour",
  "surfaceFilm",
  "algae",
  "litter",
  "flow",
  "bankVegetation",
  "bankErosion",
  "outfalls",
] as const;

export type IndicatorId = (typeof INDICATOR_IDS)[number];

export const INDICATORS: Indicator[] = [
  {
    id: "waterClarity",
    question: "How clear is the water?",
    term: "Turbidity",
    termExplainer:
      "Turbidity is how cloudy water is because of tiny floating particles like silt, algae or pollution.",
    whyItMatters:
      "Cloudy water blocks sunlight for plants, clogs fish gills and can carry bacteria that make people and pets sick.",
    lenses: ["environment", "animal", "human"],
    visual: true,
    weight: 1.2,
    options: [
      { value: "clear", label: "Clear — I can see the bottom", stress: 0 },
      { value: "slightly_cloudy", label: "Slightly cloudy", stress: 1 },
      { value: "murky", label: "Murky — hard to see into", stress: 2 },
      { value: "opaque", label: "Opaque — can't see in at all", stress: 3 },
    ],
  },
  {
    id: "waterColour",
    question: "What colour is the water?",
    term: "Apparent colour",
    termExplainer:
      "The colour you see from the bank. Natural streams are usually colourless or tea-brown from leaves.",
    whyItMatters:
      "Bright green can mean an algal bloom; grey or milky water often points to sewage or chemical discharge.",
    lenses: ["environment", "human"],
    visual: true,
    weight: 1,
    options: [
      { value: "none", label: "Colourless", stress: 0 },
      { value: "tea_brown", label: "Tea-brown (natural leaf tannins)", stress: 0 },
      { value: "green", label: "Green", stress: 2 },
      { value: "grey_black", label: "Grey or black", stress: 3 },
      { value: "unusual", label: "Unusual (milky, red, orange…)", stress: 3 },
    ],
  },
  {
    id: "odour",
    question: "What does it smell like?",
    term: "Odour",
    termExplainer: "Smell is one of the fastest ways to detect sewage or chemical pollution.",
    whyItMatters:
      "A sewage smell means likely faecal bacteria — a direct risk for anyone (or any dog) touching the water.",
    lenses: ["human", "animal"],
    visual: false,
    weight: 1.3,
    options: [
      { value: "none", label: "Nothing unusual", stress: 0 },
      { value: "earthy", label: "Earthy or muddy", stress: 0 },
      { value: "rotten_egg", label: "Rotten eggs", stress: 2 },
      { value: "chemical", label: "Chemical, fuel or bleach", stress: 3 },
      { value: "sewage", label: "Sewage or toilets", stress: 3 },
    ],
  },
  {
    id: "surfaceFilm",
    question: "Is there anything on the water surface?",
    term: "Surface film / foam",
    termExplainer:
      "Films and foams can be natural (from decaying plants) or caused by oil, detergents and sewage.",
    whyItMatters:
      "Oily sheens and soapy foam harm birds' feathers and aquatic insects that fish depend on.",
    lenses: ["animal", "environment"],
    visual: true,
    weight: 1,
    options: [
      { value: "none", label: "Nothing", stress: 0 },
      { value: "natural_foam", label: "A little off-white foam near rocks", stress: 0 },
      { value: "soapy_foam", label: "Thick white soapy foam", stress: 2 },
      { value: "oily_sheen", label: "Rainbow oily sheen", stress: 3 },
    ],
  },
  {
    id: "algae",
    question: "How much green slime or weed is in the water?",
    term: "Algae / eutrophication",
    termExplainer:
      "Eutrophication is when too many nutrients (from fertiliser or sewage) make algae grow out of control.",
    whyItMatters:
      "Algal blooms use up oxygen, killing fish. Some (cyanobacteria) are toxic to people and are a known cause of dog deaths.",
    lenses: ["environment", "animal", "human"],
    visual: true,
    weight: 1.2,
    options: [
      { value: "none", label: "None or a little on rocks", stress: 0 },
      { value: "some", label: "Some patches", stress: 1 },
      { value: "lots", label: "Lots — covers much of the bed", stress: 2 },
      { value: "bloom", label: "Surface scum or bright green bloom", stress: 3 },
    ],
  },
  {
    id: "litter",
    question: "How much litter is in or near the stream?",
    term: "Anthropogenic litter",
    termExplainer: "Human-made waste: plastics, cans, trolleys, fly-tipping.",
    whyItMatters:
      "Litter entangles wildlife, breaks down into microplastics, and signals how a place is valued by its community.",
    lenses: ["animal", "environment"],
    visual: true,
    weight: 0.8,
    options: [
      { value: "none", label: "None", stress: 0 },
      { value: "few", label: "A few items", stress: 1 },
      { value: "lots", label: "Lots of items", stress: 2 },
      { value: "dumped", label: "Dumped waste (bags, furniture, trolleys)", stress: 3 },
    ],
  },
  {
    id: "flow",
    question: "How is the water moving?",
    term: "Flow regime",
    termExplainer: "How fast and how much water moves. Flow carries oxygen and flushes pollution.",
    whyItMatters:
      "Still, warm water holds less oxygen and can breed mosquitoes; very low flow concentrates pollution.",
    lenses: ["environment", "human"],
    visual: true,
    weight: 0.6,
    options: [
      { value: "moderate", label: "Flowing steadily", stress: 0 },
      { value: "fast", label: "Fast or turbulent", stress: 0 },
      { value: "slow", label: "Slow, barely moving", stress: 1 },
      { value: "still", label: "Still / stagnant", stress: 2 },
      { value: "dry", label: "Dry or almost dry", stress: 3 },
    ],
  },
  {
    id: "bankVegetation",
    question: "What's growing along the banks?",
    term: "Riparian vegetation",
    termExplainer:
      "The riparian zone is the strip of land beside a stream. Plants there filter runoff and shade the water.",
    whyItMatters:
      "Healthy banks filter pollution before it reaches the water, keep it cool for fish and give wildlife a corridor through the city.",
    lenses: ["environment", "animal"],
    visual: true,
    weight: 1,
    options: [
      { value: "dense_natural", label: "Dense, mostly native plants and trees", stress: 0 },
      { value: "patchy", label: "Patchy plants, some bare ground", stress: 1 },
      { value: "mown_grass", label: "Mown grass right to the edge", stress: 2 },
      { value: "hard_engineered", label: "Concrete, walls or bare soil", stress: 3 },
    ],
  },
  {
    id: "bankErosion",
    question: "Are the banks collapsing or eroding?",
    term: "Bank erosion",
    termExplainer: "Soil washing or falling into the stream from the banks.",
    whyItMatters:
      "Erosion smothers fish spawning gravels with silt and can undermine paths and property.",
    lenses: ["environment", "human"],
    visual: true,
    weight: 0.8,
    options: [
      { value: "none", label: "Stable banks", stress: 0 },
      { value: "minor", label: "A few small slumps", stress: 1 },
      { value: "significant", label: "Large sections collapsing", stress: 3 },
    ],
  },
  {
    id: "outfalls",
    question: "Can you see any pipes flowing into the stream?",
    term: "Outfalls",
    termExplainer:
      "An outfall is a pipe that discharges into a waterbody — usually surface water drains, sometimes misconnected sewage.",
    whyItMatters:
      "Discharging pipes in dry weather often mean sewage misconnections: a top source of urban stream pollution.",
    lenses: ["human", "environment"],
    visual: true,
    weight: 1.1,
    options: [
      { value: "none", label: "No pipes seen", stress: 0 },
      { value: "dry", label: "Pipe present but dry", stress: 0 },
      { value: "clear_discharge", label: "Pipe discharging clear water", stress: 1 },
      { value: "dirty_discharge", label: "Pipe discharging discoloured or smelly water", stress: 3 },
    ],
  },
];

export const INDICATOR_BY_ID = Object.fromEntries(INDICATORS.map((i) => [i.id, i])) as Record<
  IndicatorId,
  Indicator
>;

export const VISUAL_INDICATORS = INDICATORS.filter((i) => i.visual);

export const WILDLIFE_OPTIONS = [
  { value: "fish", label: "Fish" },
  { value: "invertebrates", label: "Insects or snails in the water" },
  { value: "waterbirds", label: "Ducks, herons or other water birds" },
  { value: "amphibians", label: "Frogs or newts" },
  { value: "mammals", label: "Otters, voles or other mammals" },
  { value: "dead_animals", label: "Dead fish or animals" },
] as const;

export const HUMAN_CONTACT_OPTIONS = [
  { value: "swimming", label: "People swimming or paddling" },
  { value: "children_playing", label: "Children playing at the edge" },
  { value: "dogs_in_water", label: "Dogs going in the water" },
  { value: "fishing", label: "Fishing" },
  { value: "none_seen", label: "Nobody using the water" },
] as const;

export type WildlifeValue = (typeof WILDLIFE_OPTIONS)[number]["value"];
export type HumanContactValue = (typeof HUMAN_CONTACT_OPTIONS)[number]["value"];

export interface WaterTests {
  temperatureC?: number;
  ph?: number;
  nitrateMgL?: number;
}

export interface AiSuggestion {
  indicator: IndicatorId;
  value: string | "cannot_tell";
  confidence: "low" | "medium" | "high";
  evidence: string;
}

export type SuggestionDecision = "accepted" | "rejected";

export interface Assessment {
  id: string;
  createdAt: string;
  observer: string;
  site: {
    name: string;
    lat?: number;
    lng?: number;
  };
  weather: "dry" | "rain_24h" | "raining";
  photos: string[];
  answers: Partial<Record<IndicatorId, string>>;
  wildlife: WildlifeValue[];
  humanContact: HumanContactValue[];
  tests: WaterTests;
  aiSuggestions: AiSuggestion[];
  /** What the human did with each AI suggestion — the audit trail. */
  aiDecisions: Partial<Record<IndicatorId, SuggestionDecision>>;
  notes: string;
}

export function optionLabel(id: IndicatorId, value: string | undefined): string {
  if (!value) return "—";
  if (value === "cannot_tell") return "Can't tell from photo";
  return INDICATOR_BY_ID[id].options.find((o) => o.value === value)?.label ?? value;
}

export function emptyAssessment(): Assessment {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    observer: "",
    site: { name: "" },
    weather: "dry",
    photos: [],
    answers: {},
    wildlife: [],
    humanContact: [],
    tests: {},
    aiSuggestions: [],
    aiDecisions: {},
    notes: "",
  };
}
