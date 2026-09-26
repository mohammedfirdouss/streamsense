# StreamSense Details

## Using AI responsibly

* AI answers are never filled in for you. Your answer always wins.
* Every time you accept or reject a suggestion, it is saved so reviewers can see it.
* Each suggestion shows how confident the AI is and what it saw in the photo.
* The AI never guesses smell or water chemistry.
* The AI second opinion can read the health score but cannot change it.
* When you and the AI disagree, the report goes to an expert.
* The app tracks how often people and the AI agree.

## Expected impact

* More streams checked, more often, with better data.
* Pollution caught sooner.
* Clear warnings and actions for people and pet owners.
* Volunteers learn as they go and are more likely to come back.

## How it is built

* **Stack:** Next.js 16, TypeScript, Tailwind CSS 4, Anthropic SDK, Zod and Vitest.
* **AI model:** `claude-opus-5`, with answers checked against a fixed format.
* **Main logic** lives in `src/lib/` and has unit tests:
  * `protocol.ts`: the questions, science words and health links
  * `scoring.ts`: the health score and alert rules
  * `validation.ts`: data checks and human vs AI disagreement
  * `ai/`: prompts, response formats, safety checks and demo answers
* **Server routes:** `/api/analyze-photo` for photo suggestions and `/api/review` for the second opinion. The server works out the score again itself.
* **Demo mode:** if no `ANTHROPIC_API_KEY` is set, the app uses clearly marked sample answers, so it works offline.
* **Storage:** reports are saved in the browser for now, with some example reports included.

## Getting started

```bash
git clone https://github.com/mohammedfirdouss/streamsense.git
cd streamsense
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY, or leave it empty for demo mode
npm run dev                  # open http://localhost:3000
```

Other commands:

* `npm test` runs the unit tests
* `npm run typecheck` checks the TypeScript
* `npm run lint` runs ESLint
* `npm run build` makes a production build

## Demo (3 to 5 minutes)

1. **Home page:** explain the problem and the rule that AI suggests but never decides.
2. **New survey:** name the site, use GPS, add a photo and click **Ask the photo assistant**. Accept one suggestion and change another.
3. **Report:** show the score and why it was given, the health alerts, the data checks and the AI second opinion.
4. **Reviewer queue:** open the example sewage report, show the record of human and AI choices, then click **Verify & publish**.
5. **How the AI works:** show the steps, the score formula and the known limits.

## Next steps

* Move storage to a real database, with offline support for use at the stream.
* Export data in standard formats used by environment and health systems.
* Tune the score using lab and agency data, and track how accurate the AI is over time.
* Add a map and trends for each site, with alerts sent to the right authority.
* Support more languages.
