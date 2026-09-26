"use client";

import type { AssessmentReview } from "./ai/schemas";
import { type Assessment, emptyAssessment } from "./protocol";
import { validateAssessment, needsExpertReview } from "./validation";

export type ReviewStatus = "needs_review" | "verified" | "follow_up" | "published";

export interface Submission {
  assessment: Assessment;
  status: ReviewStatus;
  aiReview?: AssessmentReview;
  reviewerNote?: string;
  reviewedAt?: string;
}

const KEY = "streamsense.submissions.v1";

function read(): Submission[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Submission[];
  } catch {
    // Storage unavailable (private mode) — fall through to seed data.
  }
  return seedSubmissions();
}

function write(list: Submission[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Quota exceeded (large photos) — retry without photos so the record survives.
    try {
      localStorage.setItem(KEY, JSON.stringify(list.map((s) => ({ ...s, assessment: { ...s.assessment, photos: [] } }))));
    } catch {}
  }
}

export function listSubmissions(): Submission[] {
  return read().sort((a, b) => b.assessment.createdAt.localeCompare(a.assessment.createdAt));
}

export function saveSubmission(assessment: Assessment, aiReview?: AssessmentReview): Submission {
  const checks = validateAssessment(assessment);
  const sub: Submission = {
    assessment,
    aiReview,
    status: needsExpertReview(assessment, checks) ? "needs_review" : "published",
  };
  write([sub, ...read().filter((s) => s.assessment.id !== assessment.id)]);
  return sub;
}

export function updateStatus(id: string, status: ReviewStatus, reviewerNote?: string) {
  write(
    read().map((s) =>
      s.assessment.id === id ? { ...s, status, reviewerNote, reviewedAt: new Date().toISOString() } : s,
    ),
  );
}

export function resetDemoData() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

function seed(overrides: Partial<Assessment>, daysAgo: number): Assessment {
  const base = emptyAssessment();
  return {
    ...base,
    ...overrides,
    id: `seed-${daysAgo}`,
    createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  };
}

function seedSubmissions(): Submission[] {
  return [
    {
      status: "needs_review",
      assessment: seed(
        {
          observer: "Amara (Year 9 class)",
          site: { name: "Millbrook, footbridge by the school", lat: 51.5412, lng: -0.1421 },
          weather: "dry",
          answers: {
            waterClarity: "murky",
            waterColour: "grey_black",
            odour: "sewage",
            surfaceFilm: "soapy_foam",
            algae: "some",
            litter: "lots",
            flow: "slow",
            bankVegetation: "mown_grass",
            bankErosion: "minor",
            outfalls: "dirty_discharge",
          },
          wildlife: ["waterbirds"],
          humanContact: ["dogs_in_water", "children_playing"],
          tests: { temperatureC: 17, ph: 7.4 },
          aiSuggestions: [
            { indicator: "waterClarity", value: "murky", confidence: "high", evidence: "Bottom not visible anywhere in frame." },
            { indicator: "outfalls", value: "dirty_discharge", confidence: "medium", evidence: "Grey plume from a pipe on the right bank." },
            { indicator: "litter", value: "few", confidence: "medium", evidence: "Several plastic items near the bridge footing." },
          ],
          aiDecisions: { waterClarity: "accepted", outfalls: "accepted", litter: "rejected" },
          notes: "Pipe under the footbridge was pouring grey water even though it hasn't rained for a week.",
        },
        1,
      ),
    },
    {
      status: "published",
      assessment: seed(
        {
          observer: "Jonas",
          site: { name: "Alder Brook, nature reserve", lat: 51.5528, lng: -0.1609 },
          weather: "dry",
          answers: {
            waterClarity: "clear",
            waterColour: "tea_brown",
            odour: "earthy",
            surfaceFilm: "natural_foam",
            algae: "none",
            litter: "none",
            flow: "moderate",
            bankVegetation: "dense_natural",
            bankErosion: "none",
            outfalls: "none",
          },
          wildlife: ["fish", "invertebrates", "waterbirds"],
          humanContact: ["none_seen"],
          tests: { temperatureC: 13, ph: 7.1, nitrateMgL: 4 },
          notes: "Saw a kingfisher!",
        },
        3,
      ),
    },
    {
      status: "needs_review",
      assessment: seed(
        {
          observer: "Priya",
          site: { name: "Canal feeder, Station Road tunnel" },
          weather: "dry",
          answers: {
            waterClarity: "clear",
            waterColour: "green",
            odour: "none",
            algae: "bloom",
            litter: "few",
            flow: "still",
            bankVegetation: "hard_engineered",
          },
          wildlife: ["dead_animals"],
          humanContact: ["dogs_in_water"],
          tests: { temperatureC: 24, ph: 9.8 },
          notes: "Three dead fish near the culvert. Bright green scum on the surface.",
        },
        5,
      ),
    },
  ];
}
