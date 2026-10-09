# Tasks

## In progress
- [ ] Set up Next.js project + Supabase connection — Loen drives, Jerry reviews — branch: feature/setup-quantrungvu (PR #4 draft; app and Supabase connection done locally; Vercel deploy left; rotate the Supabase secret key first)
- [ ] Clearer team workflow (docs/WORKFLOW.md, /note and /end, nightly 23:59 save) — Loen, Jerry reviews — branch: feature/workflow-quantrungvu
- [ ] Content set: grammar rules, test sentences, word list (levels 1-2), AI feedback prompt — Jerry, Loen reviews — branch: feature/content-jerryhacam (PR open; Jerry still to read through words.json and the prompt)

## Next up
- [ ] Review day-boundary proposal in DECISIONS.md — Loen
- [ ] Extend /data/words.json to levels 3-5 (toward ~1000 words) — @jerry
- [ ] Run tests/sentences.json against the Claude API once the check is connected — pair
- [ ] Decide README open decisions (section 12) and record in DECISIONS.md — pair
- [ ] Review /data/structures.json (75-template draft, 15 per level) — @jerry
- [ ] Template picker: random, different templates per word (2 statements + 1 question), matched to the word's part of speech — pair
- [ ] Word picker: serve unseen words on demand, "Give me more words" button (test mode) — pair
- [ ] Learner gender in the profile (male / female / not set); use example_f and pass it to the AI check — pair
- [ ] Word card: show both forms, the note, and the N.B. for other meanings — pair
- [ ] Sentence input page (three boxes per word: 2 sentences + 1 question) — pair
- [ ] Connect Claude API to check/correct sentences, with MAX_CHECKS_PER_DAY cap — pair
- [ ] Streak tracking using STREAK_MIN_WORDS = 5, timezone rule proposed in DECISIONS.md — pair
- [ ] Login/accounts (Supabase auth) — pair
- [ ] Deploy to Vercel — pair

## Later (production mode, not now)
- [ ] Minimum 5 words per day (same for all users), stored in DB; extra words are paid
- [ ] Per-user daily check limit
- [ ] Review and revise cost controls before public launch

## Done
- [x] Grammar rules, 35 test sentences, 330-word list (levels 1-2), AI prompt draft; learner gender, m/f words, N.B. meanings, reflexive verbs at level 2 (2026-10-10, Jerry)
- [x] Write detailed README, trim CLAUDE.md, record English-only feedback decision (2026-10-07, Jerry)
- [x] 2 sentences + 1 question per word, 5 levels, first draft of /data/structures.json (2026-10-08, Jerry)
- [x] Capsule skill for AI-to-AI session handoff (2026-10-08, Jerry)
