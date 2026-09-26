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

* **Stack:** Next.js 16, TypeScript, Tailwind CSS 4, Google Gen AI SDK, Zod and Vitest.
* **AI model:** Google Gemini (`gemini-flash-latest` by default, change it with `GEMINI_MODEL`), with answers checked against a fixed format. The free tier is enough for testing.
* **Main logic** lives in `src/lib/` and has unit tests:
  * `protocol.ts`: the questions, science words and health links
  * `scoring.ts`: the health score and alert rules
  * `validation.ts`: data checks and human vs AI disagreement
  * `ai/`: prompts, response formats, safety checks and demo answers
* **Server routes:** `/api/analyze-photo` for photo suggestions and `/api/review` for the second opinion. The server works out the score again itself.
* **Demo mode:** if no `GEMINI_API_KEY` is set, the app uses clearly marked sample answers, so it works offline.
* **Storage:** reports are saved in the browser for now, with some example reports included.

## Getting started

```bash
git clone https://github.com/mohammedfirdouss/streamsense.git
cd streamsense
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY, or leave it empty for demo mode
npm run dev                  # open http://localhost:3000
```

Other commands:

* `npm test` runs the unit tests
* `npm run typecheck` checks the TypeScript
* `npm run lint` runs ESLint
* `npm run build` makes a production build


## Next steps

* Move storage to a real database, with offline support for use at the stream.
* Export data in standard formats used by environment and health systems.
* Tune the score using lab and agency data, and track how accurate the AI is over time.
* Add a map and trends for each site, with alerts sent to the right authority.
* Support more languages.
