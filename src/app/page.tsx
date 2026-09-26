import Link from "next/link";

const STEPS = [
  { icon: "📷", title: "You observe", body: "A guided 10-minute survey in plain language. Every ecological term is explained, with why it matters for people, animals and nature." },
  { icon: "✦", title: "AI suggests, you decide", body: "A photo assistant proposes answers with its confidence and evidence. Nothing is filled in until you agree — you're the one standing at the stream." },
  { icon: "🔎", title: "Checked, scored, reviewed", body: "Transparent rules score stream health and flag One Health risks. Unusual reports go to a human reviewer before publishing." },
];

const PRINCIPLES = [
  ["Suggest, never decide", "AI suggestions are opt-in. The observer's answer always wins, and every accept or reject is logged."],
  ["Explain everything", "Each suggestion shows confidence and visual evidence. Scores come with a breakdown of what lowered them."],
  ["AI never scores", "The Stream Health Index and One Health signals come from fixed, published rules the AI can't change."],
  ["Humans in the loop", "Disagreements and unusual findings are sent to expert reviewers, not silently fixed by the AI."],
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-cyan-900 to-cyan-800 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-200">Track 3 · AI-Supported Assessment</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Anyone can check the health of their local stream.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-cyan-50">
            StreamSense guides citizen scientists through urban stream assessments with an AI assistant that explains its reasoning and leaves the final call to people. The result is better data and a clearer view of risks to people, animals and ecosystems.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/assess" className="rounded-lg bg-white px-5 py-3 font-medium text-cyan-900 hover:bg-cyan-50">Start a survey</Link>
            <Link href="/review" className="rounded-lg px-5 py-3 font-medium text-white ring-1 ring-cyan-300 hover:bg-cyan-700">Open the reviewer queue</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-2xl" aria-hidden>{s.icon}</p>
              <h3 className="mt-2 font-semibold">{i + 1}. {s.title}</h3>
              <p className="mt-1 text-sm text-slate-700">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Responsible AI by design</h2>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            {PRINCIPLES.map(([t, d]) => (
              <div key={t}>
                <dt className="font-semibold text-cyan-900">{t}</dt>
                <dd className="mt-1 text-sm text-slate-700">{d}</dd>
              </div>
            ))}
          </dl>
          <Link href="/how-it-works" className="mt-6 inline-block text-sm font-medium text-cyan-800 underline">Read how the AI works →</Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold">One stream, three kinds of health</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["🧍", "People", "Sewage signs and toxic algae near places where children play or people paddle are flagged as urgent."],
            ["🐟", "Animals", "Dead fish, oily sheens and blooms that are dangerous to dogs trigger animal-health alerts."],
            ["🌿", "Environment", "Bank habitat, erosion, nutrients and flow show how well the stream can filter water and support life."],
          ].map(([i, t, d]) => (
            <div key={t} className="rounded-xl bg-cyan-50 p-5">
              <p className="text-2xl" aria-hidden>{i}</p>
              <h3 className="mt-2 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-slate-700">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
