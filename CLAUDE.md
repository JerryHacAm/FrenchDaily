# French Daily

README.md has the full project description (open it when a task needs the details; it is not auto-loaded).

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
- Before pushing: `npm run check` (type check + lint + tests) and `npm run build`
- AI grader test: `npm run eval` (real AI calls if CLAUDE_API_KEY is set; run
  before changing prompts/ or CLAUDE_MODEL)
- Going live (Supabase, Claude key, Vercel): docs/SETUP.md

## Code layout
- Next.js 16 (App Router) in `src/`. This version is newer than most AI
  training data: read @AGENTS.md and the docs it points to before writing
  Next.js code. `cacheComponents` is on: anything that reads cookies, the
  user or today's date must sit inside `<Suspense>` (pages call
  `getContext()`/`appDeps()` inside a Suspense child).
- All settings and secrets are read in `src/lib/config.ts` only. Import
  constants from there; never read `process.env` elsewhere (exception:
  `src/proxy.ts`, see its comment).
- Server-only code starts with `import "server-only"` (keys, Supabase,
  Claude calls).
- `src/lib/learning/`: pure rules (no I/O), every function takes `Rules` and
  "today" as parameters. Everything code decides lives here and is tested.
- `src/lib/services/`: the steps behind each button (load → change → save).
  They receive `Deps` (store, ai, clock…) so tests run them with MemoryStore +
  MockAi. `src/app/actions.ts` is a thin wrapper around them.
- `src/lib/ai/`: Claude calls with structured JSON output (`schemas.ts`),
  prompt text from `/prompts`, and `mock.ts` for no-key development.
- `src/lib/store/`: `STORAGE=file` (local JSON, no login) or `supabase`.
- Content in `/data` and `/prompts` belongs to Jerry: Claude may draft or fix
  it, but marks drafts. `npm test` validates every JSON file in `/data`.
- Rule for the coach: code counts, AI explains. Never let the AI invent
  numbers; give it the numbers from `coachStats()`.

## Gotchas (learned the hard way)
- Claude's file-edit tool sometimes isn't noticed by the dev server: if a
  change doesn't show, touch the file from the shell or restart `npm run dev`.
- In client components, write `useEffect(() => { ... })` with braces: newer
  browsers return a Promise from `scrollIntoView`, and an effect returning a
  Promise crashes React.
- The built-in browser pane may stay on "Loading…" while hidden; take a
  screenshot (or open the page in a normal browser) before assuming a bug.
- Supabase URL is `https://<project-id>.supabase.co` (no `/rest/v1`).

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