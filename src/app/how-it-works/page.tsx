import type { Metadata } from "next";
import { INDICATORS } from "@/lib/protocol";

export const metadata: Metadata = { title: "How the AI works — StreamSense" };

const FLOW = [
  ["Observer takes photos", "Photos are resized on the phone (~1568px) to save mobile data."],
  ["Photo assistant (Claude vision)", "Returns structured suggestions for the 9 visual indicators, each with confidence and evidence. It can answer 'can't tell', and it never judges smell or chemistry."],
  ["Guardrail layer", "Server code validates every suggestion against the protocol, drops anything it doesn't recognise, and keeps one suggestion per indicator."],
  ["Observer decides", "Suggestions are shown next to the question but never pre-filled. Each accept or reject goes into the audit trail."],
  ["Deterministic scoring", "The Stream Health Index and One Health signals come from published rules (below). Same inputs, same outputs, every time."],
  ["Automated checks", "Impossible values, internal contradictions and human–AI disagreements are flagged with friendly double-check prompts."],
  ["AI second opinion", "An optional plain-language explanation of the results and the One Health connections. It reads the score but can't change it."],
  ["Human reviewer", "Flagged records wait in a reviewer queue, where an expert verifies them or asks for a follow-up visit."],
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">How the AI works</h1>
      <p className="mt-2 text-slate-700">
        Citizen observations can be inconsistent. The usual fix is to let AI &ldquo;correct&rdquo; them, but that throws away what only a person at the stream can know, and it hides mistakes the AI makes. StreamSense uses AI to <strong>prompt, explain and cross-check</strong>, and leaves every decision to a person.
      </p>

      <h2 className="mt-10 text-xl font-semibold">The pipeline</h2>
      <ol className="mt-4 space-y-3">
        {FLOW.map(([t, d], i) => (
          <li key={t} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-800 text-sm font-semibold text-white">{i + 1}</span>
            <div><p className="font-medium">{t}</p><p className="text-sm text-slate-700">{d}</p></div>
          </li>
        ))}
      </ol>

      <h2 className="mt-10 text-xl font-semibold">The Stream Health Index formula</h2>
      <p className="mt-2 text-sm text-slate-700">
        Each observation has a stress level from 0 (no pressure) to 3 (severe). The index is <code className="rounded bg-slate-100 px-1">100 × (1 − Σ(weight × stress) / (3 × Σ weight))</code>, counting answered indicators only. It needs at least 3 answers.
        Bands: Healthy ≥ 75 · Moderate ≥ 50 · Stressed ≥ 25 · Critical &lt; 25.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-200"><th className="py-2">Indicator</th><th>Weight</th><th>AI can suggest?</th></tr></thead>
          <tbody>
            {INDICATORS.map((i) => (
              <tr key={i.id} className="border-b border-slate-100">
                <td className="py-2">{i.term}</td>
                <td className="tabular-nums">{i.weight}</td>
                <td>{i.visual ? "Yes, from photo" : "No, observer only"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Known limits</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        <li>Photos can&apos;t show smell, chemistry or conditions outside the frame. That&apos;s why those questions are for the observer only.</li>
        <li>Glare, shade and camera white balance change how water colour looks. The assistant is told to lower its confidence when this happens.</li>
        <li>The index is a screening tool for citizen science. It doesn&apos;t replace laboratory monitoring.</li>
        <li>Without an API key the app runs in <em>demo mode</em> with sample AI responses, and these are clearly labelled.</li>
      </ul>
    </div>
  );
}
