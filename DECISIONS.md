# Decisions

## 2026-10-06 — Words picked by code from a curated list, not by AI
Why: AI is unreliable at randomness and can serve words too hard for beginners.
Revisit if: the curated list feels stale or too small.

## 2026-10-06 — Test mode: unlimited words; production: 5 per day
Why: Jerry is testing the app first. Streak needs at least 5 completed words
(STREAK_MIN_WORDS). Switched by APP_MODE env var.
Revisit if: we decide on the production rules or launch publicly.
Update: production is a minimum of 5, not exactly 5. See 2026-10-07 below.

## 2026-10-06 — Test mode check cap of 50 per day
Why: unlimited words means unlimited Claude API cost.
Revisit if: the cap blocks normal testing.

## 2026-10-07 — AI explanations are in English only
Why: Jerry's choice for the first version; simplest to build and test.
Revisit if: we add users who need explanations in another language.

## 2026-10-07 — Production: minimum 5 words per day, extra words are paid
Why: Jerry's choice. The same minimum for all users keeps the streak rule
simple. Doing more than 5 is a paid option; Jerry decides the details later.
Revisit if: we set pricing or launch publicly.

## 2026-10-08 — Each word needs 2 normal sentences and 1 question
Why: Jerry wants learners to practice both statements and questions for every
word. A word is completed only when all 3 are submitted and checked, so the
daily minimum of 5 words (STREAK_MIN_WORDS) means 15 checks. Whether a
completed item must also meet the structure rule or be fully correct is still
open (README section 12, decision 1).
Revisit if: 3 items per word feels too long for 10 minutes a day, or the
MAX_CHECKS_PER_DAY cap (50, about 16 words) blocks normal testing.

## 2026-10-08 — Random sentence templates, 5 levels, context rule for statements only
Why: one fixed template teaches little. Code picks a different random template
for each of the 3 items per word from /data/structures.json (75 templates, 15
per level). Goal is everyday French a normal person uses, so levels go from 1 to
5 in smaller steps instead of 3. Only statements need a context element;
questions get context from the question word or a choice.
Revisit if: level 5 feels too advanced, adjective variety is too low, or the
context rule lets too many weak sentences through.

## 2026-10-08 — Sync through GitHub every day, with a nightly 23:59 save
Why: Claude Code sessions can't be shared between our computers, so GitHub is
the only shared place. A scheduled task on each computer saves unpushed work
at 23:59 (handoff, commit, push, draft PR) so nothing is lost and the other
person always sees the latest state. It never merges; a human reviews every PR.
Revisit if: the nightly drafts create noise, or we stop pairing on one screen.

## 2026-10-10 — Method fixes after the method debate (full plan: docs/ROADMAP.md)
Why: writing sentences is the core, but alone it fails beginners. Jerry and
quantrungvu agreed: read → notice → write (mini-text + audio before writing),
an easier level 1, fix-after-feedback (hint → fix → answer → retype), a weekly
AI role-play, and tests for everything code decides.
Revisit if: the pilot shows a step adds time without helping.

## 2026-10-10 — AI coach, word bank and "quiet words"
Why: our edge is knowing *why* a learner is wrong and which words they can
*really use*. Code counts mistakes and words used on the learner's own; the AI
only explains the numbers and recommends one focus. Recent words stay on
screen as a word bank; words the learner never uses come back on later days.
Revisit if: the coach advice feels generic or the word bank turns into copying.

## 2026-10-10 — Keep 5 words per day; pilot is Jerry + quantrungvu
Why: Jerry wants to keep the daily minimum. The new steps make a session
longer, so we time the pilot and decide again with real data (ROADMAP F3).
The AI grader test set stays: a wrong correction is our biggest trust risk.
Revisit if: the pilot shows a day takes much more than ~15 minutes.

## 2026-10-10 — Each learner's progress is one JSON document (learner_state)
Why: the learning rules (picker, boxes, streak, coach numbers) are pure code
that works on one object, which makes them easy to test (87 tests). One row
per learner with a version number is simple and safe for the pilot. Things
that only grow (sentences, AI calls, events, reports) are normal tables.
Replaces the draft table list in README section 7.
Revisit if: we need cross-learner queries on progress, or a state gets big
(it should stay well under 1 MB even with 1000 words).

## 2026-10-10 — Two storage modes and a mock AI
Why: STORAGE=file lets anyone run the app with no database and no login;
STORAGE=supabase is the real app. Without CLAUDE_API_KEY a mock AI gives fake
feedback (only le/la and j'), so screens can be built and tested for free.
A yellow bar shows when the mock is on, so nobody mistakes it for real feedback.
Revisit if: the two modes drift apart (the same tests run on both stores).

## 2026-10-10 — Default model claude-haiku-5-5
Why: the README said "start with Haiku (cheapest)". Haiku 5.5 is the current
Haiku and about 10× cheaper than Haiku 4.5 ($0.10 / $0.50 per million tokens).
The model stays in .env (CLAUDE_MODEL); `npm run eval` compares models.
Revisit if: `npm run eval` shows explanation quality is not good enough.

## 2026-10-10 — Built the open-decision recommendations (Jerry to confirm)
Why: the code needed an answer to run. Completed word = all 3 items meet the
structure rule (grammar does not have to be perfect). Review words count
toward the daily 5. Day = the learner's local time (browser time zone).
Browser speech for audio. 7 days per theme. Each is one setting or one
function, easy to change.
Revisit if: Jerry disagrees with any of them (README section 12).

## 2026-10-10 — Fix-after-feedback costs no extra AI calls
Why: the AI's first answer already contains the fixes, so code compares the
learner's fix and retype with it. One try to fix, then the answer; after 2
failed retypes the learner may skip. A word used on the learner's own counts
as its review only when it was due (so spacing stays honest).
Revisit if: learners fix sentences in a different but correct way and get
told "not quite" too often (then add one AI re-check for the fix).
