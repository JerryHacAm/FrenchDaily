# French Daily — Roadmap

Written 2026-10-10 by quantrungvu (Loen) with Claude, after a debate with Jerry.
This file is the plan for everything after setup. It is written so that a
Claude session that has never seen our chats can work from it. Read
`CLAUDE.md` and `README.md` first; this file adds the *why* and the *order*.

**Status legend:** ✅ done · 🟡 partly done / draft · ⬜ not started · ⏸ later (on purpose)

---

## 1. Our method, and what we changed after debating it

**The method:** the learner gets curated words and writes 2 sentences + 1
question per word. AI checks each one and gives small, focused feedback.

**Why it works:** writing your own sentence forces you to *recall* words and
*build* grammar yourself. Recall and production stick far better than
recognising the right answer in a multiple-choice list. Spaced repetition,
frequency-first words and "max 2 mistakes" feedback are also well supported.

**Where it was weak, and what Jerry and quantrungvu agreed (2026-10-10):**

| Risk | Agreed fix |
|---|---|
| You can't write what you never read or heard. Beginners copy English word order. | **Read → notice → write.** Every word comes with a short text (2–3 sentences) and audio *before* the learner writes. |
| Level 1 is a wall for an absolute beginner. | **Make level 1 easier** (shorter minimum length, visible example, sentence starter, word bank). |
| Seeing a correction is not learning it. | **Fix after feedback:** hint first → the learner tries to fix it → then the answer → the learner retypes it. |
| Single sentences have no purpose. | **Weekly role-play** with the AI (café, work, shopping…) using that week's words. Corrections at the end. |
| Code decides a lot (picker, streak, limits); bugs there break trust. | **Tests (Vitest)** for everything code decides. |

**The AI ideas (Jerry + quantrungvu):**

1. **AI coach.** It tracks progress, tells the learner their *repeating*
   mistake, and recommends what to do next. Rule: **code counts, AI
   explains.** Code computes the numbers; the AI only turns them into friendly
   advice, one focus at a time, and the advice is a button ("Practise this").
2. **Word bank.** Recent words (from the last few days) stay on screen while
   writing, so the learner can reuse them and gets ideas. French only; tap to
   see the meaning (otherwise it becomes copying, not recall).
3. **Quiet words come back.** We track which words the learner *uses on their
   own* (not just the target word). Words they learned but never use come back
   on later days. Headline number for the learner: **"Words you can really use"**.

**What we did not change (decided 2026-10-10):**
- Daily minimum stays **5 words** (`STREAK_MIN_WORDS`). We time the pilot and
  decide again with real data.
- The **AI grader test set** stays (`tests/sentences.json`). A wrong correction
  teaches wrong French, which is our biggest trust risk.
- **Pilot = Jerry and quantrungvu** before anyone else uses it.

**Our positioning:** we will not beat Duolingo at games. We aim to be the best at
one thing: *after a month you can write and say your own French.* Our edge is
that every sentence tells us **why** the learner is wrong (mistake tags), and
which words they can **actually use**.

---

## 2. The learning loop (what the app does every day)

```
read mini-text (+ audio) → write 3 items (word bank visible) → code checks → AI check
   → if mistakes: hint → learner fixes → answer → retype
   → code updates: review box, mistake counts, words used on their own
   → short coach note → quiet words + weak grammar shape the next words
weekly: role-play + coach report
```

Principle (unchanged): **anything code can do reliably is done by code**
(counting, limits, streaks, word choice, scheduling). AI only does what needs
language understanding: checking, explaining, coaching text, role-play replies.

---

## 3. Phases

**Build update 2026-10-10 (quantrungvu with Claude):** phases A–F are built
and tested locally (file storage + mock AI). What is left needs accounts or
people: apply the database SQL, add the Claude key, deploy to Vercel
(docs/SETUP.md), Jerry reviews the content drafts, then the pilot starts.
How the agreed fixes were built:

- **Read → notice → write:** every word opens on a card with its mini-text
  (2–3 sentences) and a Listen button (browser speech, free).
- **Easier level 1:** minimum 4 words instead of 6 (`MIN_SENTENCE_WORDS_LEVEL1`),
  a "start like this" sentence starter, the template example, and the word bank.
- **Fix after feedback:** the first view shows only *where* and a hint. One
  try to fix it; if it isn't right, the answer is shown and the learner
  retypes it (accents count). Code compares the attempts: no extra AI cost.
- **Word bank:** words from the last 3 days, French only, tap for meaning;
  quiet words first with a dot. Using a word that is due counts as its review.
- **Quiet words:** learned 4+ days ago, never used on the learner's own. One
  comes back per batch, and they show on Home and Progress.
- **AI coach:** a short note on Home each day (cached), a weekly report on
  Progress, and "Practise this" buttons that start a focus batch (words that
  had the mistake + new words of a kind that trains the rule).
- **Weekly role-play:** 6 scenarios, up to 10 messages, translate button,
  corrections only at the end; the mistakes feed the coach's numbers.

Each task has an owner and a "done when". Loen = tech, Jerry = content and the
AI prompt. "Pair" = both.

### Phase A — Foundation (tech track, Loen)

| # | Task | Done when | Status |
|---|---|---|---|
| A1 | Test runner (Vitest), tests for picker, streak, limits, etc. | `npm test` runs in CI and locally | ✅ 87 tests |
| A2 | Automatic checks on every PR (GitHub Actions) | type check + lint + tests + build run on each PR | ✅ `.github/workflows/ci.yml` |
| A3 | Database schema as files in the repo + row-level security | SQL in `supabase/migrations/`, applied to the project | 🟡 SQL written; apply it (SETUP step 2) |
| A4 | Storage layer: local file for development, Supabase for the real app | app runs locally with no database, and on Supabase when switched | ✅ `STORAGE=file` / `supabase` |
| A5 | Log every AI call (tokens, cost, user) | cost per user per day is visible | ✅ `ai_calls` + `/stats` |
| A6 | Login (Supabase Auth) | Jerry and quantrungvu can sign in on the deployed app | 🟡 built; test after SETUP steps 2–3 |
| A7 | Deploy to Vercel + a preview link for every PR | live URL works; PRs get preview links | ⬜ needs accounts (SETUP step 6) |
| A8 | Rotate the Supabase secret key (it was pasted in a chat) | new key in `.env` and Vercel | ⬜ quantrungvu (SETUP step 1) |
| A9 | Error monitoring (e.g. Sentry) | errors reach us without asking users | ⏸ |

### Phase B — Core loop with the agreed fixes (pair)

| # | Task | Done when | Status |
|---|---|---|---|
| B1 | Content: `data/words.json`, mini-texts, `data/grammar_rules.json`, `prompts/check-sentence.md`, `tests/sentences.json` | Jerry has reviewed the drafts; word list grows toward ~1000 | 🟡 drafts: 98 words, 31 rules, 6 scenarios, 3 prompts, 31 test sentences; Jerry reviews |
| B2 | Word picker (level, theme, part-of-speech mix, reviews first) + template picker (2 statements + 1 question, all different, recent ones avoided) | covered by tests | ✅ |
| B3 | Read → notice → write: mini-text + audio before writing | shown for every word | ✅ mini-text + browser audio |
| B4 | Easier level 1 | shorter minimum, starter, example, word bank at level 1 | ✅ min 4 words, starter, example, word bank |
| B5 | Code checks + AI check with strict JSON output, validation, retry once, daily cap | bad input never reaches the AI; invalid AI output never reaches the user | ✅ |
| B6 | Feedback card: corrected sentence, max 2 mistakes, "More detail", 2 examples, "Report this" | — | ✅ |
| B7 | Fix after feedback: hint → fix → answer → retype | no extra AI calls needed for this step | ✅ one try, then answer + retype; skip after 2 tries |
| B8 | Save every sentence; Review page | learner can reread past corrections | ✅ |
| B9 | AI grader eval script (`npm run eval`) over `tests/sentences.json` | run before any prompt or model change | ✅ needs a Claude key for a real score |

### Phase C — Learner model and AI coach (Jerry's AI idea)

| # | Task | Done when | Status |
|---|---|---|---|
| C1 | Spaced repetition boxes (1, 3, 7, 14, 30 days); due words first | covered by tests | ✅ |
| C2 | Mistake counts per grammar tag, with trends | progress page shows them | ✅ |
| C3 | Word bank: recent words, French only, tap for meaning; using one counts as a review | — | ✅ |
| C4 | "Words you can really use" + quiet words come back | counted from words used on the learner's own | ✅ |
| C5 | Adaptive pace: accuracy decides how many *new* words vs. reviews | covered by tests | ✅ |
| C6 | Level gates: move up on good accuracy, suggest down on poor accuracy | covered by tests | ✅ |
| C7 | AI coach: short note after practice, weekly report, "Practise this" button | numbers from code, words from AI | ✅ AI with a key, code-written note without |
| C8 | Starting level: self-assessment at onboarding (real placement test later) | — | ✅ |

### Phase D — Weekly role-play

| # | Task | Done when | Status |
|---|---|---|---|
| D1 | Text role-play: scenario, the week's words, ~10 turns, corrections at the end | — | ✅ |
| D2 | Speaking ("say it") and dictation | — | ⏸ decide after the pilot |

### Phase E — Habit and experience

| # | Task | Done when | Status |
|---|---|---|---|
| E1 | Home: streak, today's progress, "done for today" moment | — | ✅ |
| E2 | Streak in the learner's local time + streak freezes (1 per 7 days, max 2) | covered by tests | ✅ |
| E3 | Mobile-first layout, installable on the phone home screen | — | ✅ |
| E4 | Reminders (email / push) | — | ⏸ |

### Phase F — Pilot and measurement (pilot = Jerry + quantrungvu)

| # | Task | Done when | Status |
|---|---|---|---|
| F1 | Log events (item checked, word completed…) to measure time per day | — | ✅ |
| F2 | `/stats` page for us: minutes per day, words, accuracy, AI cost | — | ✅ |
| F3 | After 2 weeks of pilot: decide the daily load (keep 5 words?) | recorded in DECISIONS.md | ⬜ (pair, after 2 weeks) |
| F4 | Monthly re-test to measure real progress | — | ⏸ |

### Phase G — Launch readiness (later, on purpose: CLAUDE.md says no production mode yet)

Privacy policy, terms, data export/delete (GDPR), age limit, per-user limits,
rate limiting, spending caps, pricing and payments, landing page.

### Phase H — Later opportunities

Other languages (the method is language-agnostic), teacher/class mode,
sharing progress. Only if French works.

---

## 4. Open decisions (README section 12 + new)

| # | Question | Current state |
|---|---|---|
| 1 | What counts as a completed word? | Recommendation: each item meets the structure rule (not perfect grammar). |
| 2 | Day boundary | CLAUDE.md says user local time. Use it. |
| 4 | Do review words count toward the daily 5? | Recommendation: yes. |
| 5 | Audio | Browser speech first. |
| 6 | Theme length | ~7 days per theme. |
| new | Speaking / dictation | Decide after the pilot. |
| new | Learner language (English vs Vietnamese speakers) | Decide later; explanations stay English. |

---

## 5. Rules for whoever (human or Claude) works from this file

- Follow `CLAUDE.md` (branches, PRs, never main, never commit secrets).
- Content (`data/*.json`, `prompts/`, `tests/sentences.json`) belongs to
  Jerry: Claude may draft it, but mark drafts and let Jerry review.
- Update the **Status** column in this file in the same PR that does the work.
- New decisions go in `DECISIONS.md` with "Why" and "Revisit if".
