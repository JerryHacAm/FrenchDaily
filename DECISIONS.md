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
