import type { Metadata } from "next";
import { PencilMark } from "@/components/ui";
import { INDICATORS } from "@/lib/protocol";

export const metadata: Metadata = { title: "How the AI works | StreamSense" };

// `ai` marks the steps where the AI is involved, drawn in pencil blue.
const FLOW: { title: string; body: string; ai?: boolean }[] = [
  { title: "The volunteer takes photos", body: "Photos are made smaller on the phone to save mobile data." },
  { title: "The photo assistant looks", body: "The AI suggests answers for the 9 questions a photo can show, each with how sure it is and what it saw. It can say \"can't tell\", and it never guesses smell or chemistry.", ai: true },
  { title: "Safety checks", body: "Server code checks every suggestion against the survey, drops anything it doesn't recognise, and keeps one suggestion per question." },
  { title: "The volunteer decides", body: "Suggestions sit next to the question but are never filled in. Every accept or reject is saved for reviewers." },
  { title: "Fixed scoring", body: "The health score and alerts come from the published rules below. The same answers always give the same result." },
  { title: "Data checks", body: "Impossible values, answers that clash, and places where the volunteer and the AI disagree are flagged with friendly prompts to double check." },
  { title: "AI second opinion", body: "An optional plain English explanation of the results and what they mean for people, animals and nature. It can read the score but can't change it.", ai: true },
  { title: "Human reviewer", body: "Flagged reports wait in the review queue, where an expert verifies them or asks for a follow up visit." },
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">How the AI works</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">
        Volunteer observations can vary. A common fix is to let AI &ldquo;correct&rdquo; them, but that throws away what only a person at the stream can know, and it hides the AI&apos;s own mistakes. StreamSense uses AI to prompt, explain and cross check. Every decision stays with a person.
      </p>

      <h2 className="mt-14 font-display text-3xl font-semibold">Step by step</h2>
      <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
        <PencilMark className="h-4 w-4 text-pencil" /> Steps in pencil blue involve the AI.
      </p>
      <ol className="mt-6 border-l-2 border-line">
        {FLOW.map((f, i) => (
          <li key={f.title} className="relative pb-7 pl-8 last:pb-0">
            <span
              className={`absolute top-0 -left-[1.05rem] flex h-8 w-8 items-center justify-center rounded-full border-2 bg-card font-display font-bold ${f.ai ? "border-dashed border-pencil text-pencil" : "border-river text-river-deep"}`}
              aria-hidden
            >
              {i + 1}
            </span>
            <p className={`pt-1 font-semibold ${f.ai ? "text-pencil" : ""}`}>{f.title}{f.ai && <span className="sr-only"> (uses AI)</span>}</p>
            <p className="mt-1 text-ink-soft">{f.body}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-14 font-display text-3xl font-semibold">The health score formula</h2>
      <p className="mt-3 text-ink-soft">
        Each answer has a stress level from 0 (no pressure) to 3 (severe). The score is <code className="rounded-sm bg-river-wash px-1.5 py-0.5 text-ink">100 × (1 − Σ(weight × stress) / (3 × Σ weight))</code>, counting answered questions only. It needs at least 3 answers.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <li className="border-l-4 border-emerald-600 bg-card py-2 pl-3"><span className="font-semibold">Healthy</span><br />75 and above</li>
        <li className="border-l-4 border-amber-500 bg-card py-2 pl-3"><span className="font-semibold">Moderate</span><br />50 to 74</li>
        <li className="border-l-4 border-orange-600 bg-card py-2 pl-3"><span className="font-semibold">Stressed</span><br />25 to 49</li>
        <li className="border-l-4 border-rose-600 bg-card py-2 pl-3"><span className="font-semibold">Critical</span><br />below 25</li>
      </ul>
      <div className="mt-6 overflow-x-auto rounded-md border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-soft">
              <th className="px-4 py-3 font-normal">What is measured</th>
              <th className="px-4 py-3 font-normal">Weight</th>
              <th className="px-4 py-3 font-normal">Can the AI suggest it?</th>
            </tr>
          </thead>
          <tbody>
            {INDICATORS.map((i) => (
              <tr key={i.id} className="border-b border-line/60 last:border-b-0">
                <td className="px-4 py-2.5 font-semibold">{i.term}</td>
                <td className="px-4 py-2.5 tabular-nums">{i.weight}</td>
                <td className={`px-4 py-2.5 ${i.visual ? "text-pencil" : "text-ink-soft"}`}>{i.visual ? "Yes, from the photo" : "No, volunteer only"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-14 font-display text-3xl font-semibold">Known limits</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft marker:text-silt">
        <li>Photos can&apos;t show smell, chemistry or anything outside the frame. That&apos;s why those questions are for the volunteer only.</li>
        <li>Glare, shade and camera colour settings change how the water looks. The assistant is told to lower its confidence when this happens.</li>
        <li>The score is a screening tool for volunteers. It doesn&apos;t replace lab testing.</li>
        <li>Without an API key the app runs in demo mode with sample AI answers, and these are clearly marked.</li>
      </ul>
    </div>
  );
}
