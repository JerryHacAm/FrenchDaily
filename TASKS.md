# Tasks

## In progress
- [ ] Set up Next.js project + Supabase connection — Loen drives, Jerry reviews — branch: feature/setup-quantrungvu (PR #4 draft; app and Supabase connection done locally; Vercel deploy left; rotate the Supabase secret key first)
- [ ] Clearer team workflow (docs/WORKFLOW.md, /note and /end, nightly 23:59 save) — Loen, Jerry reviews — branch: feature/workflow-quantrungvu

## Next up
- [ ] Create /data/grammar_rules.json and /tests/sentences.json — @jerry
- [ ] Decide README open decisions (section 12) and record in DECISIONS.md — pair
- [ ] Build curated word list (/data/words.json, ~1000 common words) — @jerry
- [ ] Draft the AI feedback prompt for sentence checking — @jerry
- [ ] Review /data/structures.json (75-template draft, 15 per level) — @jerry
- [ ] Template picker: random, different templates per word (2 statements + 1 question), matched to the word's part of speech — pair
- [ ] Word picker: serve unseen words on demand, "Give me more words" button (test mode) — pair
- [ ] Sentence input page (three boxes per word: 2 sentences + 1 question) — pair
- [ ] Connect Claude API to check/correct sentences, with MAX_CHECKS_PER_DAY cap — pair
- [ ] Streak tracking using STREAK_MIN_WORDS = 5, decide timezone rule — pair
- [ ] Login/accounts (Supabase auth) — pair
- [ ] Deploy to Vercel — pair

## Later (production mode, not now)
- [ ] Minimum 5 words per day (same for all users), stored in DB; extra words are paid
- [ ] Per-user daily check limit
- [ ] Review and revise cost controls before public launch

## Done
- [x] Write detailed README, trim CLAUDE.md, record English-only feedback decision (2026-10-07, Jerry)
- [x] 2 sentences + 1 question per word, 5 levels, first draft of /data/structures.json (2026-10-08, Jerry)
- [x] Capsule skill for AI-to-AI session handoff (2026-10-08, Jerry)
