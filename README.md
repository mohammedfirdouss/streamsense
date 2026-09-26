# 〰️ StreamSense

**AI-supported citizen stream assessment. The AI suggests and explains; people decide.**

> *From streams to systems: turning citizen science into actionable One Health intelligence.*

StreamSense helps anyone check the health of an urban stream in about 10 minutes. A photo assistant powered by Claude suggests answers with a confidence level and the visual evidence behind them. The volunteer confirms or overrides each one. Transparent rules calculate a Stream Health Index and flag risks to **people, animals and the environment**. Unusual reports go to a human reviewer before they're published.

---

## 🎯 Track alignment: Track 3, AI-Supported Assessment

| Challenge | How StreamSense addresses it |
|---|---|
| Citizen observations can be inconsistent and error-prone | Photo-based **AI prompts**, deterministic **validation checks** (impossible values, contradictions) and a **data confidence score** that shows volunteers what makes data trustworthy |
| Use AI responsibly, without replacing human judgment | AI suggestions are **never pre-filled**. The observer's answer always wins, every accept or reject is **logged as an audit trail**, and disagreements go to an **expert reviewer** |
| Explainable AI | Each suggestion shows its **confidence and visual evidence**, and the model can answer "can't tell". The health score comes with a **"why this score" breakdown** |
| Human-in-the-loop workflows | Observer decides, then automated checks run, then an optional AI second opinion, then **reviewer queue** (verify / request follow-up visit) |

## 🧩 Problem

Urban streams are under pressure from sewage misconnections, runoff, litter and habitat loss. Citizen science can monitor far more sites than professionals can, but volunteer data is often dismissed as unreliable. Volunteers get little feedback, and ecological jargon puts newcomers off. Meanwhile, the **One Health** links (toxic algae and dogs, sewage and paddling children) are rarely made explicit.

## 💡 Solution

1. **Guided survey:** 10 plain-language questions. Each one shows the scientific term it maps to (e.g. *turbidity*, *riparian vegetation*) and why it matters for people, animals and nature.
2. **Photo assistant (Claude vision):** suggests answers for the 9 photo-assessable indicators. It is told to prefer "can't tell" over guessing and never to judge smell or chemistry.
3. **Deterministic Stream Health Index:** a published weighted formula (not AI) with a per-indicator breakdown.
4. **One Health signals:** rule-based alerts that link observations to exposure pathways. For example, sewage signs combined with children playing becomes an **urgent** human-health alert.
5. **Validation and data confidence:** friendly double-check prompts instead of rejections.
6. **AI second opinion:** a plain-language summary, a One Health explanation and next steps. It reads the score but can't change it.
7. **Reviewer queue:** flagged records with the full human-vs-AI audit trail, plus a live **human–AI agreement rate**.

## 👥 Target users

- **Citizen scientists:** residents, schools, angling clubs and river trusts.
- **Reviewers:** coordinators and ecologists who check unusual reports.
- **Decision-makers:** environment and public-health agencies who get trusted, triaged signals.

## 🌍 Expected impact

- **Ecosystem:** more sites monitored more often, with better data. Pollution incidents such as misconnected outfalls and algal blooms are caught sooner.
- **Human and animal health:** the app turns observations into concrete exposure warnings for people and pets, plus clear actions to take.
- **Participation:** plain language, instant feedback and visible data quality help volunteers learn and come back.

---

## 🛠 Architecture

```
Browser (Next.js client)                     Server (Next.js route handlers)
┌──────────────────────────┐                 ┌───────────────────────────────────┐
│ Guided wizard            │  photos (≤1568px)│ /api/analyze-photo                │
│  ├ resize photos on-device├───────────────▶│  zod-validate → Claude vision     │
│  ├ show AI suggestion    │◀───────────────┤  (structured output) → guardrail  │
│  │  (never pre-filled)   │  suggestions    │  sanitizer (protocol whitelist)   │
│  ├ scoring.ts  ◀─ same deterministic code ─▶ scoring.ts                        │
│  ├ validation.ts         │                 │                                   │
│  └ AI second opinion ────┼────────────────▶│ /api/review                       │
│                          │                 │  recompute score server-side →    │
│ Reviewer queue           │                 │  Claude (structured output)       │
│  └ audit trail, verify   │                 └───────────────────────────────────┘
└──────────────────────────┘
```

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Anthropic TypeScript SDK · Zod · Vitest
- **Model:** `claude-opus-5` with adaptive thinking, **structured outputs** (Zod schemas) and server-side refusal fallbacks
- **Domain logic** (`src/lib/`) is pure TypeScript shared by client and server and covered by unit tests:
  - `protocol.ts`: indicators, plain-language questions, scientific terms, One Health lenses
  - `scoring.ts`: Stream Health Index and One Health signal rules
  - `validation.ts`: data checks, human-vs-AI disagreement detection, data confidence
  - `ai/`: prompts, schemas, guardrail sanitiser, demo-mode responses
- **Demo mode:** without `ANTHROPIC_API_KEY`, the AI routes return clearly labelled sample responses, so the whole flow can be demoed offline.
- **Persistence (prototype):** browser `localStorage`, with seeded example reports. See the roadmap below.

## 🚀 Getting started

```bash
git clone https://github.com/mohammedfirdouss/streamsense.git
cd streamsense
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY, or leave it blank for demo mode
npm run dev                  # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm test` | Unit tests (scoring, validation, AI guardrails) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## 🎬 Demo script (3–5 min)

1. **Landing page (30s):** the problem and the "suggest, never decide" principles.
2. **New survey (2 min):** name the site, use GPS, add a photo, click **Ask the photo assistant**, accept one suggestion and override another, then add wildlife and people in the water.
3. **Report (1 min):** the score dial with its "why this score" breakdown, One Health signals, data checks, the confidence meter and the AI second opinion.
4. **Reviewer queue (1 min):** the seeded sewage report, the human-vs-AI audit trail, then **Verify & publish**. Point out the agreement-rate metric.
5. **How the AI works (30s):** the pipeline, the published formula and the known limits.

## 📈 Scalability and roadmap

- Swap `localStorage` for Postgres/PostGIS, with offline-first sync for surveying at the stream bank.
- Export records in **OGC SensorThings** or **FHIR Observation** formats so they work with environmental and public-health systems (Tracks 2 and 7).
- Calibrate indicator weights against laboratory and agency monitoring data, and track AI suggestion accuracy against reviewer verdicts over time.
- Build a map and trends view per site, with alerts routed to the relevant authority.
- Add multilingual prompts and UI (Claude handles translation of the explanations).

## 📄 License

MIT
