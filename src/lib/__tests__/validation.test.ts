import { describe, expect, it } from "vitest";
import { sanitizeSuggestions } from "../ai/sanitize";
import { type Assessment, emptyAssessment } from "../protocol";
import { dataConfidence, needsExpertReview, validateAssessment } from "../validation";

const base = (extra: Partial<Assessment> = {}): Assessment => ({
  ...emptyAssessment(),
  site: { name: "Test brook", lat: 51.5, lng: -0.1 },
  photos: ["data:image/jpeg;base64,AAAA"],
  answers: { waterClarity: "clear", waterColour: "none", odour: "none" },
  ...extra,
});

const ids = (a: Assessment) => validateAssessment(a).map((c) => c.id);

describe("validateAssessment", () => {
  it("requires a site name", () => {
    expect(ids(base({ site: { name: " " } }))).toContain("site_name");
  });

  it("rejects impossible pH and warns on unusual pH", () => {
    expect(ids(base({ tests: { ph: 15 } }))).toContain("ph_range");
    expect(ids(base({ tests: { ph: 4.2 } }))).toContain("ph_unusual");
    expect(ids(base({ tests: { ph: 7.2 } }))).not.toContain("ph_unusual");
  });

  it("flags internally contradictory answers", () => {
    expect(ids(base({ answers: { waterClarity: "clear", algae: "bloom", odour: "none" } }))).toContain("clarity_conflict");
  });

  it("flags strong human–AI disagreement but not minor or low-confidence ones", () => {
    const a = base({
      answers: { waterClarity: "clear", litter: "few", algae: "none" },
      aiSuggestions: [
        { indicator: "waterClarity", value: "opaque", confidence: "high", evidence: "" },
        { indicator: "litter", value: "none", confidence: "high", evidence: "" },
        { indicator: "algae", value: "bloom", confidence: "low", evidence: "" },
      ],
    });
    const found = ids(a);
    expect(found).toContain("disagree_waterClarity");
    expect(found).not.toContain("disagree_litter");
    expect(found).not.toContain("disagree_algae");
    expect(needsExpertReview(a, validateAssessment(a))).toBe(true);
  });

  it("always routes dead-animal reports to a reviewer", () => {
    const a = base({ wildlife: ["dead_animals"] });
    expect(needsExpertReview(a, validateAssessment(a))).toBe(true);
  });
});

describe("dataConfidence", () => {
  it("rewards photos, GPS and tests", () => {
    const rich = base({ tests: { ph: 7 } });
    const poor = base({ photos: [], site: { name: "x" } });
    expect(dataConfidence(rich, validateAssessment(rich)).score).toBeGreaterThan(
      dataConfidence(poor, validateAssessment(poor)).score,
    );
  });
});

describe("sanitizeSuggestions", () => {
  it("drops non-visual indicators, dedupes, and coerces unknown values", () => {
    const out = sanitizeSuggestions([
      { indicator: "odour", value: "sewage", confidence: "high", evidence: "smells" },
      { indicator: "algae", value: "purple_goo", confidence: "high", evidence: "?" },
      { indicator: "litter", value: "few", confidence: "high", evidence: "bottles" },
      { indicator: "litter", value: "lots", confidence: "high", evidence: "dup" },
    ]);
    expect(out).toEqual([
      { indicator: "algae", value: "cannot_tell", confidence: "low", evidence: "?" },
      { indicator: "litter", value: "few", confidence: "high", evidence: "bottles" },
    ]);
  });
});
