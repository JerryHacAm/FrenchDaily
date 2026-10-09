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

## 2026-10-09 — PROPOSED (needs Loen): a "day" is the user's local calendar date
Proposal: the browser sends the user's timezone (for example "Europe/Paris",
from `Intl.DateTimeFormat().resolvedOptions().timeZone`). The server works
out today's date in that timezone and saves each check under that date as a
plain date (2026-10-09), not a timestamp. Streaks compare these dates.
Each user's timezone is saved in their profile. If it changes (travel), the
new one is used from the next check, and a day is never counted twice.
Why: local time feels fair ("I did it before bed"). UTC would end Jerry's
day at 7am Vietnam time. Saving a plain date keeps streak math simple.
Options we did not pick: UTC for everyone (simple, but unfair); the
server's clock (wrong for anyone in a different timezone).
Open for Loen: is a plain date column OK in the Supabase design (README 7,
daily_progress.date)?
Revisit if: people abuse timezone changes to gain extra days.

## 2026-10-09 — Major vs minor mistakes
Why: Jerry's choice. Major = wrong meaning or core grammar (gender or
article, conjugation, agreement, wrong word, unclear meaning). Minor =
accents, small spelling, punctuation, elision, a dropped "ne" in a negative.
Only major mistakes send a word back to box 1 in spaced repetition. The
default for each tag is in /data/grammar_rules.json ("severity").
Revisit if: the test set shows the AI judging severity inconsistently.

## 2026-10-09 — Feedback adds corrected_english, severity, structure_feedback
Why: corrected_english lets learners check that their meaning came through.
severity feeds spaced repetition. structure_feedback tells the user what to
add when an item doesn't meet the structure. Format in README 3.4 and
/prompts/check-sentence.md.
Revisit if: the feedback card feels too busy.

## 2026-10-09 — Word themes (17)
food, home, family, daily-routine, travel, work-school, time,
people-feelings, city-shopping, basics, hobbies-sport, body-health,
weather-nature, clothes, transport, phone-internet, colors-numbers.
Why: Jerry's pick, checked against common CEFR A1/A2 and DELF themes.
words.json starts with levels 1-2 only (~300 words); levels 3-5 come later.
Only nouns, verbs and adjectives for now, because structures.json has no
templates for other word types.
Revisit if: a theme feels too thin or too long for a week.

## 2026-10-10 — Words with masculine and feminine forms are one word
Why: Jerry's choice. "ami" and "amie" are the same word to learn. Stored as
one entry (gender "m/f", feminine "amie") and shown as "l'ami / l'amie".
Either form counts as the target word. Adjectives also store their
feminine form (grand / grande).
Revisit if: a pair is too irregular to feel like one word.

## 2026-10-10 — Learner picks a gender; their own sentences must match it
Why: Jerry wants learners to build the habit of writing about themselves
correctly (je suis fatiguée vs fatigué). Profile option: male, female, or
not set. Word examples have a female version where needed (example_f). The
AI marks the wrong form as a mistake (tag speaker-agreement, major). With
"not set", both forms are accepted.
Revisit if: learners find it annoying, or we need other options.

## 2026-10-10 — Same word, different meaning: separate entries plus an N.B.
Why: Jerry's choice. When a word comes back with another meaning, remind the
learner of the meaning they already know. Meanings worth practicing get their
own entry, linked both ways (temps weather/time, femme wife/woman, fille
daughter/girl, garçon boy/waiter, souvenir gift/memory, gagner win/earn,
rose pink/flower). Smaller ones are an N.B. only (été, cher, sale).
Revisit if: the N.B. lines get noisy.

## 2026-10-10 — Reflexive verbs are level 2, with an explanation of "se"
Why: reflexive verbs need their own grammar (se changes with the person,
and the past uses être), which is a level 2 topic. Every reflexive verb has a
"note" explaining why "se" is there, and the AI prompt explains it again when
the learner leaves it out.
Revisit if: daily-routine feels too thin at level 1 without them.
