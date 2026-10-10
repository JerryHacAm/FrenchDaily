# Tasks

The full plan with phases and status lives in docs/ROADMAP.md.
Going live, step by step: docs/SETUP.md.

## In progress
- [ ] Merge main into the content branch (Loen's formats, Jerry's content, m/f in code) — Jerry drives, quantrungvu reviews — branch: feature/content-jerryhacam (PR #7)
- [ ] Go live: rotate Supabase secret key, run the SQL, Claude key + `npm run eval`, deploy to Vercel (docs/SETUP.md) — quantrungvu

## Next up
- [ ] Review the Claude drafts in data/words.json: example_en and mini_text for ~310 words, forms — @jerry
- [ ] Review the merged data/grammar_rules.json (quantrungvu's tag names, Jerry's explanations) and tests/sentences.json — @jerry
- [ ] Review data/roleplay_scenarios.json and prompts/coach.md, prompts/roleplay.md — @jerry
- [ ] Confirm the open decisions built as recommended (README section 12: completed word, review words count, local day) — @jerry
- [ ] Learner gender in the profile (male / female / not set): send it to the AI check, use example_f on the word card, un-skip test j31 — pair
- [ ] Word card: show the note and the N.B. for other meanings — pair
- [ ] Add corrected_english to the AI answer (schemas.ts + FeedbackCard) — pair
- [ ] Check the word picker borrows an unseen verb from "basics" when a theme has none left (DECISIONS 2026-10-10) — pair
- [ ] Grow the word list toward ~1000 words (levels 3–5 have no words yet) — @jerry
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
- [x] Grammar rules, 35 test sentences, 330-word list (levels 1-2), AI prompt draft; learner gender, m/f words, N.B. meanings, reflexive verbs at level 2 (2026-10-10, Jerry)
- [x] Write detailed README, trim CLAUDE.md, record English-only feedback decision (2026-10-07, Jerry)
- [x] 2 sentences + 1 question per word, 5 levels, first draft of /data/structures.json (2026-10-08, Jerry)
- [x] Capsule skill for AI session handoff (2026-10-08, Jerry)
