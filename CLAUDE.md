# French Daily

See @README.md for the full project description

## Team
- Jerry: idea owner, learner, owns the AI feedback prompt.
- Loen: more experienced with vibe coding.
- We usually pair. One drives, one reviews. Only one person's Claude edits at a time.

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
- Run: `npm run dev`
- Test: `npm test`

## Team workflow (follow every session)
1. Start: `git pull`, read TASKS.md and the newest 2 files in docs/handoffs/.
2. Never work on main (except the one-time initial setup commit). Branch name:
   `feature/<task>-<name>`.
3. Make small commits. Run tests before pushing.
4. End: run /end, push, open a PR. The other person reviews before merging.
5. Record major decisions in DECISIONS.md.

## Do not
- Edit files outside the task scope without asking.
- Commit secrets or .env files.
- Build production-mode behavior until we say so.