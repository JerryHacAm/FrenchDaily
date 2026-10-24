# Tasks

The full plan with phases and status lives in docs/ROADMAP.md.
Going live, step by step: docs/SETUP.md.

## In progress
- [ ] Send the live link (https://french-daily-seven.vercel.app) to invited friends; practise daily on the phone — @jerry

## Next up
- [ ] Review and merge PR "invite list in a Supabase table" — @quantrungvu
- [ ] Supabase → SQL Editor: run supabase/migrations/20261024000000_invites.sql, then add new friends in Table Editor → invites — @jerry
- [ ] See *se lever* (💡 tip) and *sale* (N.B.) on the word page when they come up (level 2) — @jerry
- [ ] Review the Claude drafts in data/words.json: example_en and mini_text for ~310 words, forms — @jerry
- [ ] Review the merged data/grammar_rules.json (quantrungvu's tag names, Jerry's explanations) and tests/sentences.json — @jerry
- [ ] Review data/roleplay_scenarios.json and prompts/coach.md, prompts/roleplay.md — @jerry
- [ ] Confirm the open decisions built as recommended (README section 12: completed word, review words count, local day) — @jerry
- [ ] Review the level 3–5 drafts: 644 new words in data/words.json (w0334–w0977), 6 new templates (s310, q307, s410, q407, s510, q507), 10 new grammar rules, tests c01–c10 — @jerry
- [ ] (Lower priority now: personal app, see DECISIONS 2026-10-24) Start the 2-week pilot, then decide the daily load from /stats (ROADMAP F3) — pair
- [ ] Improve the AI prompt with `npm run eval` until the test set passes — @jerry, pair
- [ ] Error monitoring (ROADMAP A9) and reminders (E4) — later

## Later (production mode, not now)
- [ ] Minimum 5 words per day (same for all users), stored in DB; extra words are paid
- [ ] Per-user daily check limit
- [ ] Review and revise cost controls before public launch

## Done
- [x] Levels 3–5: 644 new words (977 total, 4 new themes), 6 adjective templates, 10 grammar rules, 10 AI grader tests; eval 77/77 (2026-10-24, Jerry)
- [x] Word matcher: verbs need a real ending (dans ≠ danser, cuisine ≠ cuire); accents count where they change the word (ne ≠ né, sur ≠ sûr, sale ≠ salé); new optional `not_forms` (grand ≠ grandir) (2026-10-24, Jerry)
- [x] Invite list also in a Supabase table `invites`: add friends without a redeploy (2026-10-24, Jerry)
- [x] Accent-only slips (a → à) are always minor: code safety net + prompt line; corrected_english line reviewed; TEST_BYPASS_CODE added in Vercel; eval 67/67 (2026-10-24, Jerry)
- [x] Word page shows note + N.B.; corrected_english in the AI answer; picker borrows verbs from "basics"; test code TEST_BYPASS_CODE for admins + invited emails (2026-10-24, Jerry)
- [x] App online: Vercel (https://french-daily-seven.vercel.app) + Jerry's Supabase, invite-only; PRs #8 and #9 merged (2026-10-24, Jerry)
- [x] Learner gender in the profile, sent to the AI check; female examples on the word page; tests j31 + j31b (2026-10-24, Jerry)
- [x] English translations for all structure examples (Claude draft, reviewed by Jerry); fix step shows "Your fix" next to the answer (2026-10-24, Jerry)
- [x] AI grader: 9 tests pointed at the wrong template, fixed (full run 65/67, then the 2 left were fixed and pass) (2026-10-24, Jerry)
- [x] Invite-only access (ALLOWED_EMAILS), separate Sign in / Create account screens, Next.js 16.4.3 security update (2026-10-24, Jerry)
- [x] MVP: phases A–F of the roadmap built and tested locally (2026-10-10, quantrungvu) — branch feature/mvp-quantrungvu
- [x] Roadmap after the method debate (2026-10-10, quantrungvu + Jerry) — docs/ROADMAP.md, PR #5
- [x] Next.js + Supabase setup (2026-10-09, quantrungvu, PR #4)
- [x] Clearer team workflow, /note and /end, nightly save (2026-10-09, quantrungvu, PR #3)
- [x] Grammar rules, 35 test sentences, 330-word list (levels 1-2), AI prompt draft; learner gender, m/f words, N.B. meanings, reflexive verbs at level 2 (2026-10-10, Jerry)
- [x] Write detailed README, trim CLAUDE.md, record English-only feedback decision (2026-10-07, Jerry)
- [x] 2 sentences + 1 question per word, 5 levels, first draft of /data/structures.json (2026-10-08, Jerry)
- [x] Capsule skill for AI session handoff (2026-10-08, Jerry)
