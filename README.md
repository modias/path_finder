# DS Pathway — UNC Charlotte prototype

A 3-step mockup: a self-reflection intake, a semester-by-semester course
roadmap, and flip cards for related careers. Includes a Gemini-powered
advisor chat assistant.

## Run it locally

1. Copy `.env.example` to `.env` and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Get a free key at https://aistudio.google.com/apikey

2. Install and start (runs both the React app and API server):
   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:5173

## What's inside

- `src/App.jsx` — main app (all four steps)
- `src/components/AdvisorChat.jsx` — floating Gemini chat widget
- `src/data/curriculum.js` — shared course/career data (used by UI + API)
- `server/index.js` — Express API that proxies requests to Gemini
- `vite.config.js` — proxies `/api` to the backend in dev

## Advisor chat

- Click **Ask advisor** (bottom-right) on any page, or **Ask your advisor** on the roadmap.
- The assistant is grounded in the app's curriculum data and your Step 1 answers.
- This is a planning tool only — not official degree certification.

## Notes

- Course list and credit hours come from the uploaded curriculum deck.
- Salary ranges on the career cards are approximate, entry-level, U.S.
  national figures — not location- or employer-specific.
- The "electives" (DTSC 4420 / 4430 / 4440) are proposed/hypothetical, not
  real catalog entries — they're flagged as such in the UI.
