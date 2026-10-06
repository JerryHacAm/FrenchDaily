# Tasks

## In progress
- [ ] Set up Next.js project + Supabase connection — Loen drives, Jerry reviews — branch: feature/setup-loen

## Next up
- [ ] Fix double bullet in CLAUDE.md feedback-language rule — @jerry
- [ ] Move README commit off main onto a feature branch, get Loen's review — @jerry
- [ ] Create /data/grammar_rules.json, /tests/sentences.json and .env.example — @jerry
- [ ] Decide README open decisions (section 12) and record in DECISIONS.md — pair
- [ ] Build curated word list (/data/words.json, ~1000 common words) — @jerry
- [ ] Draft the AI feedback prompt for sentence checking — @jerry
- [ ] Word picker: serve unseen words on demand, "Give me more words" button (test mode) — pair
- [ ] Sentence input page (one box per word) — pair
- [ ] Connect Claude API to check/correct sentences, with MAX_CHECKS_PER_DAY cap — pair
- [ ] Streak tracking using STREAK_MIN_WORDS = 5, decide timezone rule — pair
- [ ] Login/accounts (Supabase auth) — pair
- [ ] Deploy to Vercel — pair

## Later (production mode, not now)
- [ ] Fixed 5 shared words per day, stored in DB
- [ ] Per-user daily check limit
- [ ] Review and revise cost controls before public launch

## Done
- [x] Write detailed README, trim CLAUDE.md, record English-only feedback decision (2026-10-07, Jerry)