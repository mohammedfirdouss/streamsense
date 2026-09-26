import Link from "next/link";
import { LensMark } from "@/components/insights";
import { BUTTON_BASE, BUTTON_VARIANTS, cx, PencilMark } from "@/components/ui";
import type { Lens } from "@/lib/protocol";

const STEPS = [
  ["You look", "Answer 10 simple questions at the stream. Each one explains the science word behind it and why it matters."],
  ["The AI suggests", "A photo assistant suggests answers and shows how sure it is. Nothing is filled in until you agree."],
  ["People check", "Fixed rules work out the score and raise health alerts. Unusual reports go to a reviewer before they are published."],
];

const PRINCIPLES = [
  ["The AI suggests, you decide", "Suggestions are never filled in for you. Your answer always wins, and every choice is saved for reviewers."],
  ["Everything is explained", "Each suggestion shows how confident the AI is and what it saw. Every score shows what lowered it."],
  ["The AI never scores", "The health score and alerts come from fixed, published rules the AI can't change."],
  ["People have the last word", "When the volunteer and the AI disagree, an expert reviewer takes a look."],
];

const LENSES: [Lens, string, string][] = [
  ["human", "People", "Signs of sewage or toxic algae near places where children play or people paddle are flagged as urgent."],
  ["animal", "Animals", "Dead fish, oily films and algae that can poison dogs raise animal health alerts."],
  ["environment", "Nature", "Bank plants, erosion and flow show how well the stream can clean water and support wildlife."],
];

export default function Home() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-14 sm:py-20 md:grid-cols-[1.05fr_1fr]">
          <div>
            <h1 className="font-display text-5xl leading-[1.05] font-bold text-river-deep sm:text-6xl">
              Anyone can check the health of their local stream.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-soft">
              StreamSense guides volunteers through a 10 minute stream survey. A photo assistant suggests answers and explains why. You make the final call.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/assess" className={cx(BUTTON_BASE, BUTTON_VARIANTS.primary, "px-6 text-base")}>Start a survey</Link>
              <Link href="/review" className={cx(BUTTON_BASE, BUTTON_VARIANTS.secondary, "px-6 text-base")}>Open the review queue</Link>
            </div>
          </div>
          <FieldRecord />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-3xl font-semibold">How it works</h2>
        <ol className="mt-8 grid gap-10 sm:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title}>
              <p className="font-display text-5xl leading-none font-bold text-silt" aria-hidden>{i + 1}</p>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="font-display text-3xl font-semibold">Using AI responsibly</h2>
          <dl className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {PRINCIPLES.map(([t, d]) => (
              <div key={t} className="border-l-2 border-river pl-4">
                <dt className="font-semibold text-river-deep">{t}</dt>
                <dd className="mt-1 text-ink-soft">{d}</dd>
              </div>
            ))}
          </dl>
          <Link href="/how-it-works" className="mt-10 inline-block font-semibold text-river-deep underline underline-offset-4">Read how the AI works</Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-3xl font-semibold">One stream, three kinds of health</h2>
        <div className="mt-8 grid gap-10 sm:grid-cols-3">
          {LENSES.map(([lens, title, body]) => (
            <div key={lens}>
              <LensMark lens={lens} className="h-8 w-8 text-river" />
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** An example survey card: the volunteer's ticks in ink, the AI's notes in pencil. */
function FieldRecord() {
  return (
    <figure className="graph-paper rounded-md border border-line p-5 shadow-[0_1px_0_var(--color-line),0_12px_24px_-16px_rgb(27_39_33/0.35)] sm:p-6 md:rotate-1">
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-river pb-2">
        <p className="font-display text-xl font-bold text-river-deep">Field record</p>
        <p className="text-sm text-ink-soft">Example</p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 text-sm">
        <div><dt className="text-ink-soft">Site</dt><dd className="font-semibold">Millbrook, by the footbridge</dd></div>
        <div><dt className="text-ink-soft">Weather</dt><dd className="font-semibold">Rained in the last day</dd></div>
      </dl>

      <ul className="mt-4 space-y-4 text-sm">
        <RecordRow question="How clear is the water?" answer="Murky, hard to see into">
          <Pencil note="Murky. Brown plume below the pipe." meta="High confidence. Volunteer agreed." />
        </RecordRow>
        <RecordRow question="Can you see any pipes flowing into the stream?" answer="Pipe pouring out smelly water">
          <Pencil note="Pipe pouring out clear water." meta="Medium confidence. Volunteer chose differently, and their answer counts." />
        </RecordRow>
        <RecordRow question="What does it smell like?" answer="Sewage or toilets">
          <p className="mt-1 text-ink-soft">Volunteer only. Photos can&apos;t show smell.</p>
        </RecordRow>
      </ul>

      <figcaption className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-3">
        <span className="font-display text-3xl font-bold tabular-nums">38</span>
        <span className="font-semibold text-orange-800">Stressed</span>
        <span className="basis-full text-sm font-semibold text-rose-800">Urgent: signs of sewage where children paddle</span>
      </figcaption>
    </figure>
  );
}

function RecordRow({ question, answer, children }: { question: string; answer: string; children: React.ReactNode }) {
  return (
    <li>
      <p className="text-ink-soft">{question}</p>
      <p className="mt-0.5 flex items-center gap-2 font-semibold">
        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-river" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="1.5" y="1.5" width="13" height="13" rx="1" />
          <path d="M4.5 8.5l2.5 2.5 4.5-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {answer}
      </p>
      {children}
    </li>
  );
}

function Pencil({ note, meta }: { note: string; meta: string }) {
  return (
    <div className="ink-in-late mt-1.5 border-l-2 border-dashed border-pencil pl-3 text-pencil">
      <p className="flex items-center gap-1.5"><PencilMark className="h-3.5 w-3.5 shrink-0" /><span><span className="font-semibold">AI:</span> {note}</span></p>
      <p className="text-xs text-ink-soft">{meta}</p>
    </div>
  );
}
