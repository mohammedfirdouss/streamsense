import type { Assessment } from "../protocol";
import type { OneHealthSignal, StreamHealthScore } from "../scoring";
import type { AssessmentReview, PhotoAnalysis } from "./schemas";

/**
 * Canned responses used when no ANTHROPIC_API_KEY is configured, so the full
 * human-in-the-loop flow can be demoed offline. The UI labels them clearly.
 */
export function demoPhotoAnalysis(): PhotoAnalysis {
  return {
    showsWaterbody: true,
    photoQuality: { usable: true, issues: [], retakeTip: "" },
    summary:
      "An urban stream running between grassy banks with some litter at the water's edge. The water looks brownish and the bottom is only partly visible.",
    suggestions: [
      { indicator: "waterClarity", value: "slightly_cloudy", confidence: "medium", evidence: "Stream bed visible near the edge but not in the middle." },
      { indicator: "waterColour", value: "tea_brown", confidence: "medium", evidence: "Brownish tint consistent with leaf tannins or light silt." },
      { indicator: "surfaceFilm", value: "none", confidence: "high", evidence: "Surface is clear of foam or sheen." },
      { indicator: "algae", value: "some", confidence: "low", evidence: "A few green patches on submerged stones, partly obscured by glare." },
      { indicator: "litter", value: "few", confidence: "high", evidence: "Two plastic bottles and a bag caught on the left bank." },
      { indicator: "flow", value: "moderate", confidence: "medium", evidence: "Ripples around stones show steady movement." },
      { indicator: "bankVegetation", value: "mown_grass", confidence: "high", evidence: "Short mown grass runs right to the water's edge." },
      { indicator: "bankErosion", value: "minor", confidence: "medium", evidence: "Small bare slump on the right bank." },
      { indicator: "outfalls", value: "cannot_tell", confidence: "low", evidence: "No pipes are in frame." },
    ],
  };
}

export function demoReview(a: Assessment, score: StreamHealthScore, signals: OneHealthSignal[]): AssessmentReview {
  const top = score.contributions[0];
  return {
    plainLanguageSummary:
      `This stream scored ${score.score ?? "—"}/100 on the Stream Health Index.` +
      (top ? ` The biggest pressure you recorded was ${top.term.toLowerCase()}.` : "") +
      " Thank you — every survey adds to the picture of how this stream changes over time.",
    oneHealth: {
      human: signals.some((s) => s.lens === "human")
        ? "Some observations suggest the water may carry germs or toxins, so skin contact is best avoided until conditions improve."
        : "Nothing you recorded points to a direct risk for people, though urban streams should never be drunk from.",
      animal: a.wildlife.length
        ? `You saw ${a.wildlife.length} kind(s) of wildlife, a sign the stream still supports life.`
        : "No wildlife was recorded — that doesn't mean none is present, but a return visit could tell us more.",
      environment:
        score.band === "healthy"
          ? "The banks and water look in good shape, providing habitat and natural filtering."
          : "Pressures on the banks and water reduce the stream's ability to filter pollution and support wildlife.",
    },
    doubleCheckQuestions: [],
    nextSteps: [
      "Re-survey the same spot in two weeks, ideally after rain, to see how it responds.",
      ...(signals.length ? ["Share the flagged issues with your local environment agency."] : []),
    ],
  };
}
