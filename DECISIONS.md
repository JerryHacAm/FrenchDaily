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

## 2026-10-09 — A "day" is the user's local calendar date
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
Update 2026-10-10: built this way by quantrungvu (browser time zone, plain
dates in learner_state instead of a daily_progress table).

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
Update 2026-10-10: severity is built. structure_feedback is built under the
name structure_note. corrected_english is not built yet (TASKS.md).

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
Update 2026-10-10: not built yet (TASKS.md). Until then the AI accepts both
forms, as with "not set".

## 2026-10-10 — Same word, different meaning: separate entries plus an N.B.
Why: Jerry's choice. When a word comes back with another meaning, remind the
learner of the meaning they already know. Meanings worth practicing get their
own entry, linked both ways (temps weather/time, femme wife/woman, fille
daughter/girl, garçon boy/waiter, souvenir gift/memory, gagner win/earn,
rose pink/flower). Smaller ones are an N.B. only (été, cher, sale).
Revisit if: the N.B. lines get noisy.
Update 2026-10-10: the data is in words.json; the word card does not show
note, N.B. or example_f yet (TASKS.md).

## 2026-10-10 — Reflexive verbs are level 2, with an explanation of "se"
Why: reflexive verbs need their own grammar (se changes with the person,
and the past uses être), which is a level 2 topic. Every reflexive verb has a
"note" explaining why "se" is there, and the AI prompt explains it again when
the learner leaves it out.
Revisit if: daily-routine feels too thin at level 1 without them.

## 2026-10-10 — Every theme has a level-1 verb; borrow from basics, never repeat
Why: the word picker needs at least 1 verb per set. Added or moved level-1
verbs so each theme has one (vivre, embrasser, marcher; sourire, monter,
compter moved down from level 2). If a theme runs out of unseen verbs, the
picker borrows an unseen verb from "basics". A word is never served twice as
a new word; it only comes back through spaced-repetition reviews (for
example after mistakes).
Revisit if: basics runs out of level-1 verbs.
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

## 2026-10-10 — Merging Jerry's content with the built app
Why: both sides wrote words, grammar rules, the AI prompt and the AI test set
on the same day, in different formats. Jerry's choices:
- Content: Jerry's 330 words (ids w0001…) are the word list, plus the 3 words
  only quantrungvu had (vacances, projet, sortir = w0331–w0333). Tests now use
  these ids.
- Grammar tags: quantrungvu's tag names win (they are used by code, stats and
  the coach), for example partitive, elision, negation, futur-proche. Jerry's
  explanations, severities and examples moved under those names, and his extra
  rules were added (article-after-negation, avoir-expressions,
  speaker-agreement, question-words, il-y-a, reflexive-verbs…).
- "m/f" words: changed the code now so they work (checker, word card, word
  matching, AI prompt, mock AI).
- example_en and mini_text: Claude drafted them for every word that didn't
  have them; Jerry reviews.
- The AI prompt keeps Jerry's teaching rules in the format the app sends and
  expects (no {{slots}}).
Revisit if: a tag name feels wrong to Jerry (change it together with
tests/sentences.json, and old saved mistakes keep the old name).
