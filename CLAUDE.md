# French Daily

See @README.md for the full project description

## Team
- Jerry: idea owner, learner, owns the AI feedback prompt.
- Loen: more experienced with vibe coding. Prefers to be called "quantrungvu".
- We usually pair. One drives, one reviews. Only one person's Claude edits at a time.
- Both are vibe coders, not professional developers. Explain git and terminal
  steps in plain words and say why, not just what.

| Person | `git config user.name` | Handoff file / branch suffix |
|---|---|---|
| Jerry | JerryHacAm | `jerryhacam` |
| Loen | quantrungvu0701-ops | `quantrungvu` |

## Modes (controlled by env var APP_MODE = "test" | "production")
### Test mode (current, for Jerry's own testing)
- Unlimited words per day. The user can press "Give me more words" any time.
- Words are picked by code from /data/words.json, never repeating a word the
  user has already seen.
- Hard cap: MAX_CHECKS_PER_DAY (default 50) to control Claude API cost.
### Production mode (later, do not build yet)
- Minimum 5 words per day to continue the streak, the same for all users, stored in the database. For more words, which Jerry will decide in the future, the user will need to pay.
- Daily check limit per user. Details in DECISIONS.md when decided.

## Streak rule
- STREAK_MIN_WORDS = 5 (keep it as one named constant, never hardcode 5).
- Each word needs 2 normal sentences and 1 question from the user.
- A word counts as completed when all 3 (2 sentences + 1 question) have been
  submitted and checked by AI.
- A streak day = completing at least STREAK_MIN_WORDS words that day.
- A "day" uses user local time.

## Key rules
- Sentence structures (templates) come from /data/structures.json, chosen at
  random by code per item (2 statements + 1 question per word). AI does NOT
  choose them.
- Words come from our curated list of ~1000 common French words in
  /data/words.json, chosen by code. AI does NOT choose words. AI only checks
  and improves sentences.
- The Claude API key lives in .env only. Never commit it, never use it in frontend code.
- Feedback language: English only, in simple plain English. French appears only
  in corrected sentences, highlighted fixes, and example sentences.
- The Claude model name is set in .env as CLAUDE_MODEL. Never hardcode it.
  Before using any API parameter you are not 100% sure about, check the docs
  at https://docs.claude.com instead of guessing.

## Commands
- Install: `npm install`
- Run: `npm run dev` (then open http://localhost:3000)
- Check before pushing: `npx tsc --noEmit`, `npm run lint`, `npm run build`
- Test: `npm test` (no test runner yet; add one with the first real logic)

## Code layout
- Next.js 16 (App Router) in `src/`. This version is newer than most AI
  training data: read @AGENTS.md and the docs it points to before writing
  Next.js code.
- All settings and secrets are read in `src/lib/config.ts` only. Import
  constants from there; never read `process.env` elsewhere.
- Server-only code starts with `import "server-only"` (keys, Supabase admin,
  Claude calls). Supabase server code lives in `src/lib/supabase/`.

## Team workflow (follow every session)
Step-by-step guide for humans: docs/WORKFLOW.md.
1. Start: run /note (it pulls, then reads TASKS.md and the newest 2 handoffs).
2. Never work on main (except the one-time initial setup commit). Branch name:
   `feature/<task>-<suffix>` (suffix from the table above).
3. Make small commits. Run tests before pushing.
4. End: run /end. It writes the handoff, commits, pushes and opens a PR.
   The other person reviews before merging. Only a human merges.
5. Nightly safety net: a scheduled task on each person's computer runs at
   about 23:57 and does the same as /end without asking, if there is unsaved work.
   Its PRs are drafts. It never merges, never force-pushes, never touches main.
6. Record major decisions in DECISIONS.md.

## Do not
- Edit files outside the task scope without asking.
- Commit secrets or .env files.
- Build production-mode behavior until we say so.