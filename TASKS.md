# Tasks

The full plan with phases and status lives in docs/ROADMAP.md.
Going live, step by step: docs/SETUP.md.

## In progress
- [ ] Review and merge PR #5 (roadmap), then the MVP PR — Jerry
- [ ] Go live: rotate Supabase secret key, run the SQL, Claude key + `npm run eval`, deploy to Vercel (docs/SETUP.md) — quantrungvu

## Next up
- [ ] Review the content drafts: data/words.json (98 words), data/grammar_rules.json, data/roleplay_scenarios.json, prompts/*.md, tests/sentences.json — @jerry
- [ ] Confirm the open decisions built as recommended (README section 12: completed word, review words count, local day) — @jerry
- [ ] Grow the word list toward ~1000 words (levels 1–5; levels 3–5 have no words yet) — @jerry
- [ ] Start the 2-week pilot (Jerry + quantrungvu), then decide the daily load from /stats (ROADMAP F3) — pair
- [ ] Improve the AI prompt with `npm run eval` until the test set passes — @jerry, pair
- [ ] Error monitoring (ROADMAP A9) and reminders (E4) — later

## Later (production mode, not now)
- [ ] Minimum 5 words per day (same for all users), stored in DB; extra words are paid
- [ ] Per-user daily check limit
- [ ] Review and revise cost controls before public launch

## Done
- [x] MVP: phases A–F of the roadmap built and tested locally (2026-10-10, quantrungvu) — branch feature/mvp-quantrungvu
- [x] Roadmap after the method debate (2026-10-10, quantrungvu + Jerry) — docs/ROADMAP.md, PR #5
- [x] Next.js + Supabase setup (2026-10-09, quantrungvu, PR #4)
- [x] Clearer team workflow, /note and /end, nightly save (2026-10-09, quantrungvu, PR #3)
- [x] Write detailed README, trim CLAUDE.md, record English-only feedback decision (2026-10-07, Jerry)
- [x] 2 sentences + 1 question per word, 5 levels, first draft of /data/structures.json (2026-10-08, Jerry)
- [x] Capsule skill for AI session handoff (2026-10-08, Jerry)
