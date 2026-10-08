# French Daily

A web app that teaches French to beginners through one habit: **write real sentences every day**. The user gets curated words, writes **two normal sentences and one question** for each one, and Claude AI checks, corrects, and explains each in a small, focused way. Completing at least 5 words per day keeps the streak alive.

**Owner / learner:** Jerry (product, AI feedback prompt)
**Developer:** Loen
**Status:** Pre-build. Repo and workflow files set up. No app code yet.

> This README is the full project description for humans. Rules for Claude Code live in `CLAUDE.md`. Current work lives in `TASKS.md`. Past choices live in `DECISIONS.md`.

---

## 1. Why this app exists

Jerry wants to learn French, and teach others, as fast and efficiently as possible. The bet: **producing sentences is the fastest way for a beginner to learn**, more than flashcards or multiple choice, because it forces the learner to recall vocabulary, pick a grammar structure, and apply both at once. AI makes this practical because it can give instant, personal feedback on any sentence.

The product succeeds if a user who spends about 10 minutes a day is writing noticeably better French after a few weeks, and wants to come back tomorrow.

---

## 2. Core learning loop

1. The app serves a set of **curated words** matched to the user's level.
2. Each word is shown on a **word card** (meaning, gender, audio).
3. The user writes **two normal sentences and one question per word** (3 in total), following a **required sentence structure**.
4. Code runs quick checks, then **Claude AI** reviews each sentence or question.
5. The user sees **small, focused feedback** for each one: the corrected sentence, one or two key mistakes, and two example sentences to learn from.
6. Corrected sentences are **saved** for later review.
7. Words and mistakes **come back later** through spaced repetition.
8. Completing at least **5 words** in a day continues the **streak**.

---

## 3. Features in detail

### 3.1 Word selection (curated, not random)

AI does **not** choose words. Fully random words are the biggest risk: a beginner could get "gouvernement", "cependant", and "parapluie" on day one, which is frustrating and builds on nothing.

Instead, code picks words from a curated list of about 1,000 high-frequency French words, **random only inside a controlled pool**:

- **Level:** words are tagged by level (1 = absolute beginner, 2, 3). Users start at level 1 and move up.
- **Theme:** words are grouped into themes (food, travel, family, home, daily routine...). Run one theme for about a week so words reinforce each other.
- **Frequency first:** the most common words come before rare ones.
- **Part-of-speech mix:** every set includes a mix of nouns, verbs, and connectors/adjectives, so the words can actually form sentences together.
- **No repeats of new words** in the same stretch, except through spaced repetition (section 3.5).

**Word data format** (`/data/words.json`):

```json
{
  "id": "w0042",
  "french": "pomme",
  "english": "apple",
  "pos": "noun",
  "gender": "f",
  "article": "la",
  "level": 1,
  "theme": "food",
  "frequency_rank": 812,
  "audio": null,
  "example": "Je mange une pomme."
}
```

**Selection logic (pseudocode):**

```
pick(user, count):
  1. due reviews first (section 3.5)
  2. fill the rest with new words:
       level  = user.level
       theme  = user.current_theme
       pool   = words where level/theme match AND user has not seen them
       ensure the set has at least 1 verb and 1 noun (add a connector/adjective if possible)
       sort by frequency_rank, pick randomly among the top candidates
```

### 3.2 Word card

Every word is shown with:

- The French word, with article for nouns (**la pomme**, **le livre**)
- English meaning
- Gender (le/la) clearly marked, because learning nouns without gender is a common beginner mistake
- **Audio pronunciation** with a play button
- One short example sentence

**Audio options** (decide in Phase 1):

| Option | Pros | Cons |
|---|---|---|
| Browser Speech Synthesis (`speechSynthesis`, `fr-FR`) | Free, no files, fast to build | Voice quality varies by device |
| Pre-generated audio files per word (TTS or recorded) | Consistent quality | Extra build step, storage |

[Recommendation] Start with browser speech synthesis. Switch to pre-generated files if quality complains appear.

### 3.3 Required sentence structure

Without rules, users will write tiny, fast sentences ("J'aime la pomme") that teach very little. Each exercise requires a minimum structure.

**Exercise format (all levels):** for each word the user writes **2 normal sentences (statements) and 1 question**. The word is completed only when all 3 have been submitted and checked.

**Level 1 rule:** every sentence or question must contain
1. the **target word** (any correct form, such as plural or conjugated),
2. a **verb**,
3. at least one **context element**: a reason, place, time, or description.

The user sees a visible template with the word:

```
Subject + verb + [pomme] + context
Example: "Je mange une pomme parce que j'ai faim."
```

Matching the model example from the project idea: *"I like eating ice cream because it is really sweet and cool."*

**Progression:**

| Level | Requirement |
|---|---|
| 1 | Target word + verb + one context element. Minimum length: `MIN_SENTENCE_WORDS` (default 6). |
| 2 | Also use a connector (parce que, mais, et, quand, donc). |
| 3 | Harder question forms (est-ce que..., inversion) and more varied statements. |

**How it's enforced (cheap checks first, AI second):**

1. **Code check:** non-empty, under a max length, contains the target word (or a recognizable form), meets `MIN_SENTENCE_WORDS`.
2. **AI check:** confirms there is a verb and a context element, judges grammar, and returns whether the structure requirement was met.

A sentence or question that fails the structure requirement does not count yet, so the word is not completed and does not count toward the daily 5. The feedback tells the user what to add, and they can resubmit. The AI also checks that the third item really is a question and the other two are statements. See Open Decisions about what counts as "completed".

### 3.4 AI feedback: small and focused

The danger is a wall of corrections that discourages a beginner. Every response is limited to:

1. The **corrected sentence**
2. The **one or two most important mistakes**, highlighted, each with a **one-line explanation**
3. A **"More detail" tap** that expands a deeper explanation (hidden by default)
4. **Two other example sentences** using the same word, to learn from

If the sentence is already correct, say so and still give the two example sentences.

**Required AI output (JSON, validated by code):**

```json
{
  "structure_ok": true,
  "is_correct": false,
  "corrected_sentence": "Je mange une pomme parce que j'ai faim.",
  "mistakes": [
    {
      "tag": "article-gender",
      "original": "un pomme",
      "fix": "une pomme",
      "short_explanation": "'Pomme' is feminine, so it takes 'une'.",
      "detail": "Longer explanation shown only when the user taps 'More detail'."
    }
  ],
  "example_sentences": [
    { "french": "La pomme est rouge.", "english": "The apple is red." },
    { "french": "Tu veux une pomme ?", "english": "Do you want an apple?" }
  ]
}
```

Rules for the AI prompt (owned by Jerry, file: `/prompts/check-sentence.md`):

- Never return more than 2 mistakes in the main view. If there are more, pick the most important ones.
- Write all explanations in **English** (decided). Use simple, plain English (short sentences, no grammar jargon unless the term is explained). French appears only in the corrected sentence, the highlighted fixes, and the example sentences.
- Use the `tag` values from the grammar rule set (section 3.7) so mistakes can be tracked.
- Be encouraging. Never mock.
- Respond with JSON only.

### 3.5 Spaced repetition and mistake reuse

Words seen once are forgotten. This is probably the biggest accelerator of learning speed, so it is a core feature, not an extra.

**Word repetition (simple Leitner-style boxes):**

| Box | Next review after |
|---|---|
| 1 | 1 day |
| 2 | 3 days |
| 3 | 7 days |
| 4 | 14 days |
| 5 | 30 days |

- All 3 items (2 sentences + 1 question) accepted without a major mistake: move up one box.
- Any item with a major mistake: back to box 1.
- Each user-word pair stores `box` and `due_date`. Due words are served **before** new words.

**Mistake reuse:**

- Each mistake is saved with its `tag` (for example `article-gender`, `verb-etre-conjugation`, `adjective-agreement`).
- Later sessions prefer words and exercises connected to the user's most frequent mistake tags.
- The AI may also be given the user's recent mistakes to craft a targeted prompt ("write a sentence using a feminine noun with 'une'").

### 3.6 Streaks (forgiving, not punishing)

Streaks motivate, but strict ones make people quit after a single missed day.

- **Streak day:** completing at least `STREAK_MIN_WORDS` words that day (default 5; always use the named constant, never hardcode 5).
- **Streak freeze:** protects the streak when a day is missed.
  - Earn 1 freeze for every 7-day streak.
  - Bank at most 2 freezes.
  - A freeze is applied automatically the first time a day is missed, and the user is told.
- **Day definition:** user's local time or UTC. Not decided yet. Timezone bugs are the most common streak bug, so decide before building.

### 3.7 AI reliability and trust

AI sometimes marks correct French as wrong or explains something incorrectly. Mitigations:

- **"Report this" button** on every feedback card. Saves the sentence, the AI response, and a note into a `reports` table so Jerry can review and improve the prompt.
- **Fixed grammar rule set** (`/data/grammar_rules.json`) covering common beginner topics (definite/indefinite articles and gender, être/avoir, regular -er verbs, adjective agreement, negation with ne...pas, basic question forms, prepositions of place). The rule set is included in the AI prompt as the reference, so explanations stay consistent, and its IDs are used as mistake `tag`s.
- **Saved corrected sentences:** every sentence, correction, and mistake is stored. A **Review page** lets the user revisit them.
- **Test set:** keep 20 to 30 sample sentences (correct and wrong) with known answers in `/tests/sentences.json`. Re-run them whenever the prompt or model changes.

---

## 4. Modes

Controlled by the environment variable `APP_MODE` (`test` or `production`).

### Test mode (current)

For Jerry's own testing.

- Unlimited words per day. A "Give me more words" button is always available.
- Words never repeat for the user except through spaced repetition.
- Hard cap `MAX_CHECKS_PER_DAY` (default 50) to control API cost.

### Production mode (later, do not build yet)

- Minimum 5 words per day (`STREAK_MIN_WORDS`) to continue the streak, the same for all users, stored in the database. Doing more than the minimum is a paid option; Jerry will decide the details later.
- Per-user daily check limit.
- Rules finalized in `DECISIONS.md` before launch.

---

## 5. Tech stack

A stack is the set of technologies an app is built from.

| Layer | Choice | Role |
|---|---|---|
| Language | TypeScript | One language for everything |
| Frontend + Backend | Next.js | UI and server logic in one project |
| Database + Auth | Supabase (Postgres) | Users, words seen, sentences, streaks |
| AI | Claude API | Sentence checking and feedback, called server-side only |
| Hosting | Vercel | Auto-deploys from GitHub |

---

## 6. System workflow (how one sentence or question is checked)

Code drives the flow. AI is called at one step only. This flow runs once for each of the 3 items per word (2 sentences + 1 question), so one word uses 3 checks from `MAX_CHECKS_PER_DAY`.

1. **Input:** user submits the target word, their sentence or question, and which type it is (statement or question).
2. **Code checks:** checks remaining for today (cap), input not empty or too long, target word present, minimum length met, and a question ends with "?" (for the question item).
3. **Build prompt:** combine the prompt file, grammar rule set, level, target word, and the user's sentence (optionally recent mistake tags).
4. **Call Claude API** from the backend. Model comes from `CLAUDE_MODEL`.
5. **Require JSON** output in the format in section 3.4.
6. **Validate result in code:** parse JSON, check required fields, limit mistakes to 2. If invalid, retry once, then show a friendly error. This step must never be skipped, or the app breaks mid-streak.
7. **Save and update:** store the sentence and feedback, update the word's box and due date, update daily progress and streak.
8. **Display** the feedback card.

**Principle:** anything code can do reliably (counting, limits, streaks, word selection, scheduling) is done by code. AI only does what needs language understanding: checking and explaining sentences.

---

## 7. Data model (draft)

| Table | Key fields |
|---|---|
| `users` | id, email, level, current_theme, created_at |
| `words` | (loaded from `words.json`, or a mirrored table) id, french, english, pos, gender, level, theme, frequency_rank |
| `user_words` | user_id, word_id, box, due_date, times_seen, last_seen |
| `sentences` | id, user_id, word_id, original, corrected, structure_ok, is_correct, mistakes (json), examples (json), created_at |
| `mistake_stats` | user_id, tag, count, last_seen |
| `daily_progress` | user_id, date, completed_count, checks_used |
| `streaks` | user_id, current, longest, freezes, last_completed_date |
| `reports` | id, user_id, sentence_id, note, status, created_at |

[Draft only] Loen should adjust this freely when setting up Supabase.

---

## 8. Configuration (environment variables)

Stored in `.env` (never committed). Provide `.env.example` with empty values.

```
APP_MODE=test
CLAUDE_API_KEY=
CLAUDE_MODEL=claude-haiku-4-5-20251001
STREAK_MIN_WORDS=5
MAX_CHECKS_PER_DAY=50
MIN_SENTENCE_WORDS=6
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**Model choice:** start with Haiku (cheapest), compare against Sonnet using the test set, and upgrade only if explanation quality for beginners is not good enough. The model name is never hardcoded. Before using any API parameter you are unsure about, check https://docs.claude.com instead of guessing.

---

## 9. Security and cost rules

- The Claude API key lives on the server only. Never in frontend code, never committed to GitHub. `.env` must be in `.gitignore`.
- Set a monthly spend limit in the Anthropic Console.
- Enforce `MAX_CHECKS_PER_DAY` in the backend, not only in the UI.
- Do not store more user data than needed.

---

## 10. Planned folder structure

```
french-daily/
├── README.md
├── CLAUDE.md
├── TASKS.md
├── DECISIONS.md
├── .env.example
├── .claude/
│   └── commands/
│       ├── note.md
│       └── end.md
├── docs/
│   └── handoffs/
├── data/
│   ├── words.json
│   └── grammar_rules.json
├── prompts/
│   └── check-sentence.md
├── tests/
│   └── sentences.json
└── src/            (Next.js app, created in setup)
```

---

## 11. Roadmap

**Phase 0: Setup** (Loen drives, Jerry reviews)
- Next.js project, Supabase connection, `.env.example`, deploy a blank page to Vercel.

**Phase 1: Core loop (MVP, test mode)**
- Build `words.json` (~1,000 words with level, theme, gender, frequency).
- Word picker with level, theme, and part-of-speech mix.
- Word card with meaning, gender, and audio.
- Sentence input (2 sentences + 1 question per word) with structure template and code checks.
- Claude check with JSON output, validation, and the 50-check cap.
- Small feedback card with "More detail" and two example sentences.
- Save corrected sentences.

**Phase 2: Accounts and habit**
- Supabase login.
- Daily progress, streak with `STREAK_MIN_WORDS`, streak freezes, timezone rule.
- Review page for saved sentences.
- "Report this" button.

**Phase 3: Retention**
- Spaced repetition boxes and due-word serving.
- Mistake tags and mistake-aware exercises.
- Grammar rule set expansion.
- Level 2 and 3 sentence rules.

**Phase 4: Production**
- Switch to a minimum of 5 shared words per day (more words are a paid option, details to be decided).
- Per-user limits, cost review, spend caps.
- Public launch decisions.

---

## 12. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| 1 | What counts as a "completed" word? **Partly decided:** all 3 items (2 sentences + 1 question) must be done. Still open: must each item be submitted, meet structure, or be fully correct? | Each item meets the structure requirement. Requiring perfect grammar punishes beginners and kills streaks. |
| 2 | Day boundary: user local time or UTC? | User local time (feels fairer), but needs care in code. |
| 3 | ~~Explanations in English only, or also Vietnamese?~~ | **Decided: English only.** Revisit if we add other interface languages. |
| 4 | Do review words count toward the daily 5? | Yes, so reviews do not feel like extra work. |
| 5 | Audio: browser speech or generated files? | Browser speech first. |
| 6 | How many words per theme and how long per theme? | About 5 to 7 days per theme to start. |
| 7 | ~~Production: exactly 5 words per day, or a minimum of 5?~~ | **Decided: minimum 5.** Extra words will be paid; Jerry decides the details later. |

Record final answers in `DECISIONS.md`.

---

## 13. How we work together

- Two-person team. We pair: one drives (types the prompts), one reviews the screen and the diff. Swap each session. Only one person's Claude edits code at a time.
- **Never push code to `main`.** Create a branch `feature/<task>-<name>`, commit small, push, open a **pull request (PR)**, and let the other person review before merging. (The one exception was the initial workflow-files commit.)
- Session start: `git pull`, then run `/note` in Claude Code to read the latest handoff and `TASKS.md`.
- Session end: run `/end` to create a handoff file in `docs/handoffs/` (changes, what was done, to-do checklist, notes), update `TASKS.md`, push, and open a PR.
- Record major decisions in `DECISIONS.md`.

### Getting started (once code exists)

```
git clone <repo-url>
cd french-daily
npm install
cp .env.example .env     # then fill in the values
npm run dev
```

---

## 14. Ownership

- **Jerry:** product vision, word list review, AI feedback prompt (`/prompts/check-sentence.md`), grammar rule set content, test sentences.
- **Loen:** architecture, setup, database, API integration, deployment.
- Both: review each other's PRs, update `TASKS.md` and `DECISIONS.md`.