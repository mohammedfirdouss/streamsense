import { describe, expect, it } from "vitest";
import { type Assessment, emptyAssessment, INDICATORS } from "../protocol";
import { bandFor, oneHealthSignals, scoreAssessment } from "../scoring";

const withAnswers = (answers: Assessment["answers"], extra: Partial<Assessment> = {}): Assessment => ({
  ...emptyAssessment(),
  answers,
  ...extra,
});

const allAt = (stress: number) =>
  Object.fromEntries(INDICATORS.map((i) => [i.id, i.options.find((o) => o.stress === stress)?.value ?? i.options[0].value]));

describe("scoreAssessment", () => {
  it("returns null until at least 3 indicators are answered", () => {
    expect(scoreAssessment(withAnswers({ waterClarity: "clear", odour: "none" })).score).toBeNull();
  });

  it("scores a pristine stream 100 and a fully stressed one 0", () => {
    expect(scoreAssessment(withAnswers(allAt(0))).score).toBe(100);
    expect(scoreAssessment(withAnswers(allAt(3))).score).toBe(0);
  });

  it("ignores unanswered indicators rather than treating them as healthy", () => {
    const s = scoreAssessment(withAnswers({ waterClarity: "opaque", odour: "sewage", outfalls: "dirty_discharge" }));
    expect(s.score).toBe(0);
    expect(s.answered).toBe(3);
  });

  it("lists contributions most-damaging first", () => {
    const s = scoreAssessment(withAnswers({ waterClarity: "slightly_cloudy", odour: "sewage", litter: "none" }));
    expect(s.contributions[0].term).toBe("Odour");
    expect(s.contributions.every((c) => c.penalty > 0)).toBe(true);
  });

  it("bands at documented thresholds", () => {
    expect([bandFor(75), bandFor(74), bandFor(50), bandFor(25), bandFor(24)]).toEqual([
      "healthy", "moderate", "moderate", "stressed", "critical",
    ]);
  });
});

describe("oneHealthSignals", () => {
  it("escalates sewage to urgent when people are in the water", () => {
    const calm = oneHealthSignals(withAnswers({ odour: "sewage" }));
    const exposed = oneHealthSignals(withAnswers({ odour: "sewage" }, { humanContact: ["swimming"] }));
    expect(calm.find((s) => s.id === "sewage")?.severity).toBe("concern");
    expect(exposed.find((s) => s.id === "sewage")?.severity).toBe("urgent");
  });

  it("frames algal blooms as an animal risk when dogs are in the water", () => {
    const s = oneHealthSignals(withAnswers({ algae: "bloom" }, { humanContact: ["dogs_in_water"] }));
    expect(s.find((x) => x.id === "cyanobacteria")).toMatchObject({ lens: "animal", severity: "urgent" });
  });

  it("sorts urgent signals first", () => {
    const s = oneHealthSignals(
      withAnswers({ bankVegetation: "hard_engineered", odour: "chemical" }, { wildlife: ["dead_animals"] }),
    );
    expect(s[0].severity).toBe("urgent");
  });

  it("returns nothing for a healthy stream", () => {
    expect(oneHealthSignals(withAnswers(allAt(0)))).toEqual([]);
  });
});
