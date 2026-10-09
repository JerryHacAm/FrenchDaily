# Handoff 2026-10-10 — quantrungvu (Loen)

## 1. Changes (files and behavior changed)
- No new code this session. The app work from 2026-10-09 is on `feature/setup-quantrungvu` (PR #4, still a draft).
- `.env` created locally with the Supabase project values and the Claude/app settings. It is git-ignored and was never committed.
- `README.md` and `TASKS.md` were updated on 2026-10-09 to match the Next.js setup.

## 2. What I did (plain-language summary)
Connected the app to the Supabase project. The setup page now reads "Supabase: connected" when run locally. I also checked the Supabase table settings with you (Data API on, auto-expose off, automatic RLS on). Jerry's workflow PR #3 has been merged into `main`.

## 3. To do next (checklist)
- [ ] quantrungvu: **Rotate the Supabase secret key.** It was pasted into the chat, so treat it as exposed. In Supabase: Settings → API Keys → Secret keys → regenerate. Then update `SUPABASE_SERVICE_ROLE_KEY` in your local `.env` and restart `npm run dev`.
- [ ] quantrungvu: Connect the repo to Vercel, add the same variables there, and deploy the blank page.
- [ ] Jerry: review PR #4 and mark it ready when it looks right.
- [ ] Add a test runner (for example Vitest) with the first real logic, so `npm test` works.
- [ ] Decide README section 12 open questions. Start with the day boundary (local time or UTC), because it changes the database design.

## 4. Notes (bugs, blockers, decisions, gotchas)
- **Secret key exposed in chat (2026-10-10).** Only the local `.env` holds it. Rotate it (see checklist). Never paste secret keys into chat. The publishable key is safe to share, but it is still better kept in `.env`.
- **Supabase URL format:** use only `https://<project-id>.supabase.co`. Do not add `/rest/v1/`, the client adds it.
- **Env var names:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are visible in the browser by design (Next.js rule). Only `SUPABASE_SERVICE_ROLE_KEY` must stay server-only.
- **Dev server needs a restart after editing `.env`.** Next.js reads it only at startup.
- **Browser pane issue:** the built-in browser showed an error page for `localhost:3000` once, but the server returned 200 and the page text said "connected" over curl. This is a preview-pane problem, not an app problem. Check it by opening http://localhost:3000 in your normal browser.
- Supabase table defaults: "Automatically expose new tables" is off, and "Automatic RLS" is on. Every new table stays locked until a rule is written for it (Phase 2).

---

# Session 2 (2026-10-10): roadmap + MVP build — quantrungvu (Loen) with Claude

Branches: `feature/roadmap-quantrungvu` (PR #5, docs only) and
`feature/mvp-quantrungvu` (built on top of it). Merge PR #5 first.

## 1. Changes (files and behavior changed)
- **Roadmap:** `docs/ROADMAP.md` (method debate, agreed fixes, AI ideas, phases A–H with status), 3 decisions in `DECISIONS.md`.
- **The app works end to end** (locally, `STORAGE=file` + mock AI):
  - Today (`/`): welcome steps with self-chosen level, streak + freezes, today's progress, AI coach note with "Practise this", weekly role-play status, quiet words.
  - Practice (`/practice`): read the word + mini-text with audio → write 2 sentences + 1 question (template, example, level-1 starter, word bank) → AI check → if mistakes: hints only → one fix try → answer + retype. Batch of 5 words; reviews first, one quiet word, new words by pace; "Give me more words" in test mode.
  - Review (`/review`), Progress (`/progress`: words you can really use, mistakes with trends, boxes, weekly report, settings), Role-play (`/roleplay`, 6 scenarios), Pilot stats (`/stats`), Login (`/login`, Supabase only).
- **Engine** `src/lib/learning/` (pure, tested), **services** `src/lib/services/`, **AI** `src/lib/ai/` (Claude with structured JSON + prompt caching, or mock), **storage** `src/lib/store/` (file or Supabase).
- **Content drafts for Jerry:** `data/words.json` (98 words, levels 1–2), `data/grammar_rules.json` (31 rules = mistake tags), `data/roleplay_scenarios.json` (6), `prompts/check-sentence.md`, `prompts/coach.md`, `prompts/roleplay.md`, `tests/sentences.json` (31).
- **Database:** `supabase/migrations/20261010000000_init.sql` (5 tables + row level security). Not applied yet.
- **Quality:** 87 Vitest tests (`npm test`), `npm run check`, `npm run eval` (AI grader), GitHub Actions CI on every PR.
- **Docs:** `docs/SETUP.md` (go live step by step), README (status, data model, config, folders, roadmap), CLAUDE.md (commands, code layout, gotchas), `.env.example` (every setting explained), TASKS.md.
- Local `.env`: only `CLAUDE_MODEL` changed to `claude-haiku-5-5` (git-ignored, no keys touched).

## 2. What I did (plain-language summary)
Wrote down the plan we agreed on, then built every phase that doesn't need an account: the full daily practice loop with all of Jerry's fixes and AI ideas, the coach, the word bank, quiet words, the weekly role-play, progress and review pages, and a stats page for the pilot. Everything is tested (87 automatic tests) and was clicked through in a browser: welcome → practice with a real mistake → self-fix → show answer → retype → word complete → review → progress → weekly report → role-play → stats, in dark and light mode. The AI part runs on a fake "mock" until we add the Claude key.

## 3. To do next (checklist)
- [ ] Jerry: review and merge PR #5 (roadmap), then the MVP PR.
- [ ] quantrungvu: follow `docs/SETUP.md`: rotate the Supabase secret key → run the SQL → login settings → Claude key + spend limit → `npm run eval` → `STORAGE=supabase` locally → deploy to Vercel.
- [ ] Jerry: review the content drafts (words, grammar rules, scenarios, the 3 prompts, the 31 test sentences). Run `npm test` after editing any JSON.
- [ ] Jerry: confirm the open decisions I built as recommended (README section 12: completed word = structure ok; review words count; local day).
- [ ] Both: start the 2-week pilot, then decide the daily load from `/stats` (ROADMAP F3).
- [ ] Jerry: add words for levels 3–5 (none yet; those learners get lower-level words).

## 4. Notes (bugs, blockers, decisions, gotchas)
- **Not tested against the real Supabase or Claude yet** (needs SETUP steps 2–4). The Supabase store and login code are written to the docs and type-checked, but only the file store ran for real. Expect small fixes on first real use.
- **Mock AI is not a French checker**: it only catches le/la/un/une gender and j'/l' elision. The yellow bar says so. `npm run eval` on the mock passes 15/31 (expected).
- **Tech decisions** (details in DECISIONS.md): one JSON document per learner (`learner_state`); `STORAGE=file|supabase`; default model `claude-haiku-5-5`; fix/retype compared by code (no extra AI cost); using a due word on your own counts as its review.
- **Content I added beyond the original plan:** `intro` field in role-play scenarios (learner-facing text), `hint` + `severity` fields in the AI feedback format (needed for the fix step and the review boxes), `words_used` (for "words you can really use").
- **Gotchas:** see CLAUDE.md "Gotchas": the dev server sometimes misses edits made by Claude's edit tool (restart it); write effects with braces (newer browsers return a Promise from `scrollIntoView`); the hidden browser pane can show "Loading…" until a screenshot.
- **Stats minutes** are estimated from activity (gaps over 5 min = break), and AI cost per day groups by UTC date.
