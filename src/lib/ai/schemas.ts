import { z } from "zod";
import { INDICATOR_IDS } from "../protocol";

export const PhotoAnalysisSchema = z.object({
  showsWaterbody: z.boolean().describe("True if the photos show a stream, river, pond or its banks."),
  photoQuality: z.object({
    usable: z.boolean(),
    issues: z.array(z.string()).describe("e.g. 'too dark', 'water surface not visible', 'glare'"),
    retakeTip: z.string().describe("One friendly sentence on how to take a better photo, or empty string."),
  }),
  suggestions: z.array(
    z.object({
      indicator: z.enum(INDICATOR_IDS),
      value: z.string().describe("One option value from the protocol, or 'cannot_tell'."),
      confidence: z.enum(["low", "medium", "high"]),
      evidence: z.string().describe("What in the photo supports this, in plain language, max 25 words."),
    }),
  ),
  summary: z.string().describe("Two sentences describing what the photo shows, for a non-expert."),
});

export type PhotoAnalysis = z.infer<typeof PhotoAnalysisSchema>;

export const AssessmentReviewSchema = z.object({
  plainLanguageSummary: z
    .string()
    .describe("3 sentences max: what this survey says about the stream, for the person who made it."),
  oneHealth: z.object({
    human: z.string().describe("How this stream's condition may affect people. One or two sentences."),
    animal: z.string().describe("How it may affect wildlife and pets. One or two sentences."),
    environment: z.string().describe("What it says about the ecosystem. One or two sentences."),
  }),
  doubleCheckQuestions: z
    .array(
      z.object({
        question: z.string().describe("A gentle, specific question prompting the observer to re-check something."),
        reason: z.string().describe("Why this is worth checking, one sentence."),
      }),
    )
    .describe("0-3 questions. Empty if the record is internally consistent."),
  nextSteps: z.array(z.string()).describe("1-3 practical actions for the observer or community."),
});

export type AssessmentReview = z.infer<typeof AssessmentReviewSchema>;
