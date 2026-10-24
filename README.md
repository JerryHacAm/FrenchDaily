# French Daily

A web app that teaches French to beginners through one habit: **write real sentences every day**. The user gets curated words, writes **two normal sentences and one question** for each one, and Claude AI checks, corrects, and explains each in a small, focused way. Completing at least 5 words per day keeps the streak alive.

**Developer:** Jerry (product idea, AI feedback prompt)
**Developer:** Loen (experience vibe-coder)
**Status:** MVP built (2026-10-10): the full learning loop, AI coach, word bank, quiet words, weekly role-play and pilot stats run locally. To go live: [`docs/SETUP.md`](docs/SETUP.md) (Supabase tables, Claude key, Vercel). Plan and progress: [`docs/ROADMAP.md`](docs/ROADMAP.md).

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

Instead, code picks words from a curated list of about 1,000 high-frequency French words (977 now: levels 1–2 from 2026-10-10, levels 3–5 added 2026-10-24), **random only inside a controlled pool**:

- **Level:** words are tagged by level (1 = absolute beginner, up to 5; see the level table in 3.3). Users start at level 1 and move up.
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
  "example": "Je mange une pomme.",
  "feminine": null,
  "article_f": null,
  "example_f": null,
  "note": null,
  "other_meanings": []
}
```

Extra fields:

- **Both forms, one word:** a person noun with a masculine and a feminine form is one entry with `gender: "m/f"`, for example `ami` + `feminine: "amie"`. It is shown as **l'ami / l'amie**, and either form counts as the target word. Adjectives also store their feminine form (`grand` → `grande`).
- **`example_f`:** a second example for female learners, only where "je" needs agreement (*Je suis fatiguée*). See 3.2a.
- **`note`:** a short tip for the word card, for example why a reflexive verb has "se".
- **`other_meanings`:** other common meanings of the same French word. When a meaning is worth its own practice, it is a separate entry, and the two are linked by `word_id` (*temps* = weather, *temps* = time). Otherwise `word_id` is null and it is an N.B. only (*été* = summer, also "been").

**Selection logic (pseudocode):**

```
pick(user, count):
  1. due reviews first (section 3.5)
  2. fill the rest with new words:
       level  = user.level
       theme  = user.current_theme
       pool   = words where level/theme match AND user has not seen them
       ensure the set has at least 1 verb and 1 noun (add a connector/adjective if possible)
       if the theme has no unseen verb left, borrow an unseen verb from the
         "basics" theme (same level); never serve a word the user has already
         seen as a new word. Seen words only come back through reviews (3.5).
       sort by frequency_rank, pick randomly among the top candidates
```

### 3.2 Word card

Every word is shown with:

- The French word, with article for nouns (**la pomme**, **le livre**)
- English meaning
- Gender (le/la) clearly marked, because learning nouns without gender is a common beginner mistake
- **Audio pronunciation** with a play button
- One short example sentence (the `example_f` version for female learners when there is one)
- Both forms when the word has them (**l'ami / l'amie**, **grand / grande**)
- The word's `note`, if it has one. For reflexive verbs it explains why there is "se": *lever* = to lift, *se lever* = to lift yourself = to get up.
- **N.B. for other meanings:** if the word has another meaning, show a short "N.B." line. For a linked meaning (`word_id`), show it when the user has already seen the other entry: *"N.B. You learned 'temps' = weather. Here it means time."* For an N.B.-only meaning, always show it.

### 3.2a Learner gender

French changes some words depending on who is speaking: a woman writes *je suis fatiguée* and *je suis allée*, a man writes *je suis fatigué* and *je suis allé*. To build the right habit from day one:

- The user picks once, in their profile: **male**, **female**, or **not set**.
- Word card examples use `example_f` for female learners.
- The AI check expects the matching form when the user writes about themselves with "je". Using the other form is a mistake (tag `speaker-agreement`). With **not set**, both forms are accepted.
- The AI's own example sentences match the user's gender.

**Audio options** (decide in Phase 1):

| Option | Pros | Cons |
|---|---|---|
| Browser Speech Synthesis (`speechSynthesis`, `fr-FR`) | Free, no files, fast to build | Voice quality varies by device |
| Pre-generated audio files per word (TTS or recorded) | Consistent quality | Extra build step, storage |

[Recommendation] Start with browser speech synthesis. Switch to pre-generated files if quality complains appear.

### 3.3 Required sentence structure

Without rules, users will write tiny, fast sentences ("J'aime la pomme") that teach very little. Each exercise requires a minimum structure.

**Exercise format (all levels):** for each word the user writes **2 normal sentences (statements) and 1 question**. The word is completed only when all 3 have been submitted and checked.

**Goal:** users should be able to write and speak French the way a normal French person does in daily life (friends, work, shopping, texting), not like a literary author. Templates and levels favor natural everyday French (on, ça, il y a, pronouns, informal questions) over rare or formal forms.

**Basic rule (all levels):** every sentence or question must contain
1. the **target word** (any correct form, such as plural or conjugated),
2. a **verb**,
3. for **statements only**: at least one **context element**: a reason, place, time, or description. Questions do not need one, because a question word (où, pourquoi, combien...) or a choice (ou) already gives context.

**Random sentence structures (templates).** There is no single fixed template. Each of the 3 items shows a **different, randomly chosen template** with the word filled in, so the user practices many kinds of sentences and questions. The templates live in `/data/structures.json` and are **picked by code, never by AI**, like words:

- Each template has a `type` (`statement` or `question`), a `level`, and `fits_pos` (which kinds of target word it works with).
- For each word, code picks 2 statement templates and 1 question template for the user's level, at random, from templates whose `fits_pos` includes the word's part of speech.
- The 3 templates for one word are all different, and recent templates are avoided so they do not repeat day after day.
- The user sees the template and an example for their kind of word before writing.

Template format (draft):

```json
{
  "id": "q102",
  "type": "question",
  "level": 1,
  "fits_pos": ["noun", "verb"],
  "pattern": "Où est-ce que + subject + verb + object ?",
  "examples": {
    "noun": ["pomme", "Où est-ce que tu achètes les pommes ?"],
    "verb": ["acheter", "Où est-ce que tu achètes ton pain ?"]
  }
}
```

**Slot idea:** a noun target word fills the object slot, a verb target word fills the verb slot, and an adjective target word fills the description slot. So most templates work for both nouns and verbs, and each template has one example per part of speech it fits.

**81 templates** are in `/data/structures.json`: 15 per level at levels 1–2 (9 statements and 6 questions) and 17 at levels 3–5 (2 extra adjective templates each, added 2026-10-24). It was written from standard CEFR A1, A2 and B1 grammar topics plus common spoken French. Jerry reviews and edits the list.

**Known gap:** adjectives fit only 2 to 4 templates per type and level, because they have fewer natural slots. Levels 3–5 now have at least 2 statements and 2 questions each for adjectives. Connectors and other word types (adverbs, prepositions) have no templates yet.

Matching the model example from the project idea: *"I like eating ice cream because it is really sweet and cool."*

**Progression:**

| Level | Requirement |
|---|---|
| 1 | Basic present tense: place, time, simple reason, negation, il y a, est-ce que / rising tone / où / combien. Minimum length: `MIN_SENTENCE_WORDS` (default 6). |
| 2 | Everyday connectors (mais, quand, donc, et), passé composé, near future (aller + infinitive), devoir / pouvoir / avoir envie de, reflexive verbs (se lever, s'habiller), pourquoi / comment / quel. |
| 3 | Natural spoken French: on, c'est, pronouns (le / la / les, en, y), ça fait ... que, je trouve que, pendant que, informal questions ("Tu as déjà ... ?", "Tu peux ... ?"). |
| 4 | Telling stories and comparing: imparfait with passé composé, comparatives and superlatives, relative clauses (qui / que), ne ... plus / jamais, futur simple, avant de. |
| 5 | Hypotheses and nuance: si + conditional, subjunctive after il faut que, plus-que-parfait, même si, lui / leur, polite requests, advice (tu devrais). |

The 5 levels replace the earlier 3. Words in `/data/words.json` use the same level numbers 1 to 5 (see 3.1). Formal or literary forms (for example "Mangez-vous ... ?" style inversion everywhere) are avoided; spoken French usually uses est-ce que or a rising tone instead.

**How it's enforced (cheap checks first, AI second):**

1. **Code check:** non-empty, under a max length, contains the target word (or a recognizable form), meets `MIN_SENTENCE_WORDS`.
2. **AI check:** confirms there is a verb (and a context element for statements), checks the sentence follows the template it was given, judges grammar, and returns whether the structure requirement was met.

A sentence or question that fails the structure requirement does not count yet, so the word is not completed and does not count toward the daily 5. The feedback tells the user what to add, and they can resubmit. The AI also checks that the third item really is a question and the other two are statements. See Open Decisions about what counts as "completed".

### 3.4 AI feedback: small and focused

The danger is a wall of corrections that discourages a beginner. Every response is limited to:

1. The **corrected sentence**
2. The **one or two most important mistakes**, highlighted, each with a **one-line explanation**
3. A **"More detail" tap** that expands a deeper explanation (hidden by default)
4. **Two other example sentences** using the same word, to learn from

If the sentence is already correct, say so and still give the two example sentences.

**Required AI output (JSON, validated by code):** the format as built is in `src/lib/ai/schemas.ts` (it also has `hint`, `structure_note`, `words_used`, `encouragement`). `structure_feedback` is called `structure_note` there, and `corrected_english` is not built yet (see `TASKS.md`).

```json
{
  "structure_ok": true,
  "structure_feedback": null,
  "is_correct": false,
  "corrected_sentence": "Je mange une pomme parce que j'ai faim.",
  "corrected_english": "I'm eating an apple because I'm hungry.",
  "mistakes": [
    {
      "tag": "article-gender",
      "severity": "major",
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
| Tests | Vitest | `npm test`: everything code decides (picker, streak, limits…) |
| Checks | GitHub Actions | Type check, lint, tests and build on every PR |

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
8. **Display** the feedback card. If there are mistakes: the learner sees **hints only**, tries to fix the sentence, then sees the answer and **retypes** it. Code compares these attempts, so this step costs no extra AI calls.

**Principle:** anything code can do reliably (counting, limits, streaks, word selection, scheduling) is done by code. AI only does what needs language understanding: checking and explaining sentences.

---

## 7. Data model

As built (`supabase/migrations/20261010000000_init.sql`, decided 2026-10-10 in `DECISIONS.md`):

| Table | What it holds |
|---|---|
| `learner_state` | One JSON document per learner: profile, level, every word seen (review box, due date, times used on their own, mistake tags), mistake counts per day, streak, today's progress, the current practice batch, coach notes, the current role-play. Saved with a version number so two tabs can't overwrite each other. |
| `sentences` | Every checked sentence with the full AI feedback (for the Review page). |
| `reports` | "Report this" notes for Jerry. |
| `ai_calls` | Tokens, cost, time and errors of every AI call. |
| `events` | Small activity log (item checked, word completed…) used to measure time per day. |

Words, templates, grammar rules and role-play scenarios are not in the database: they are the JSON files in `/data`. Every table has row level security: a learner can only read and write their own rows. The shape of `learner_state` is defined in `src/lib/learning/state.ts`.

---

## 8. Configuration (environment variables)

Stored in `.env` (never committed). [`.env.example`](.env.example) lists every variable with a plain explanation. Names starting with `NEXT_PUBLIC_` are visible in the browser, so never put a secret in one. The main ones:

```
APP_MODE=test
STORAGE=file                 # file (this computer) or supabase (real app)
CLAUDE_API_KEY=              # empty = mock AI (fake feedback, free)
CLAUDE_MODEL=claude-haiku-5-5
STREAK_MIN_WORDS=5
MAX_CHECKS_PER_DAY=50
MIN_SENTENCE_WORDS=6
MIN_SENTENCE_WORDS_LEVEL1=4
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=                # who can open /stats
```

**Model choice:** start with Haiku (cheapest; now `claude-haiku-5-5`), compare against Sonnet using the test set (`npm run eval`), and upgrade only if explanation quality for beginners is not good enough. The model name is never hardcoded. Before using any API parameter you are unsure about, check https://docs.claude.com instead of guessing.

---

## 9. Security and cost rules

- The Claude API key lives on the server only. Never in frontend code, never committed to GitHub. `.env` must be in `.gitignore`.
- Set a monthly spend limit in the Anthropic Console.
- Enforce `MAX_CHECKS_PER_DAY` in the backend, not only in the UI.
- Do not store more user data than needed.

---

## 10. Folder structure

```
FrenchDaily/
├── README.md, CLAUDE.md, TASKS.md, DECISIONS.md, AGENTS.md
├── .env.example              every setting, explained
├── .github/workflows/ci.yml  automatic checks on every PR
├── .claude/commands/         /note and /end
├── docs/
│   ├── ROADMAP.md            the plan, phases and status
│   ├── SETUP.md              going live: Supabase, Claude key, Vercel
│   ├── WORKFLOW.md           how we work (git, PRs, nightly save)
│   └── handoffs/             one note per session
├── data/                     content (Jerry): words, templates, grammar rules, role-play scenarios
├── prompts/                  AI instructions (Jerry): check-sentence, coach, role-play
├── tests/sentences.json      AI grader test set (npm run eval)
├── scripts/eval.ts           runs the AI grader test
├── supabase/migrations/      database tables + security rules
└── src/
    ├── app/                  pages: / (Today), /practice, /review, /progress, /roleplay, /stats, /login
    ├── components/           shared UI pieces
    └── lib/
        ├── learning/         pure rules: picker, review boxes, streak, pace, levels, coach numbers (tested)
        ├── ai/               Claude client, prompts, answer formats, mock AI
        ├── services/         the steps behind every button
        ├── store/            storage: memory (tests), file (this computer), Supabase
        └── content/          loads and checks /data
```

---

## 11. Roadmap

The full plan, with the method debate, phases A–H, owners and status, is in [`docs/ROADMAP.md`](docs/ROADMAP.md). Short version:

- **A. Foundation** (tests, automatic checks, database, login, deploy): built; deploy needs accounts.
- **B. Core loop** with read → notice → write, easier level 1, fix-after-feedback: built.
- **C. Learner model and AI coach** (review boxes, mistakes, word bank, quiet words, pace, levels): built.
- **D. Weekly role-play** (text): built. Speaking: after the pilot.
- **E. Habit** (home, streak + freezes, installable): built. Reminders: later.
- **F. Pilot** (Jerry + quantrungvu, `/stats`): ready to start.
- **G. Launch** and **H. Later**: not now.

---

## 12. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| 1 | What counts as a "completed" word? **Partly decided:** all 3 items (2 sentences + 1 question) must be done. Still open: must each item be submitted, meet structure, or be fully correct? | Each item meets the structure requirement. Requiring perfect grammar punishes beginners and kills streaks. **Built this way; confirm.** |
| 2 | Day boundary: user local time or UTC? | User local time (feels fairer), but needs care in code. **Built this way (CLAUDE.md rule).** |
| 3 | ~~Explanations in English only, or also Vietnamese?~~ | **Decided: English only.** Revisit if we add other interface languages. |
| 4 | Do review words count toward the daily 5? | Yes, so reviews do not feel like extra work. **Built this way; confirm.** |
| 5 | Audio: browser speech or generated files? | Browser speech first. **Built this way.** |
| 6 | How many words per theme and how long per theme? | About 5 to 7 days per theme to start. **Built: `THEME_DAYS=7`.** |
| 7 | ~~Production: exactly 5 words per day, or a minimum of 5?~~ | **Decided: minimum 5.** Extra words will be paid; Jerry decides the details later. |

Record final answers in `DECISIONS.md`.

---

## 13. How we work together

- Two-person team. We pair: one drives (types the prompts), one reviews the screen and the diff. Swap each session. Only one person's Claude edits code at a time.
- **Never push code to `main`.** Create a branch `feature/<task>-<name>`, commit small, push, open a **pull request (PR)**, and let the other person review before merging. (The one exception was the initial workflow-files commit.)
- Session start: run `/note` in Claude Code. It pulls the latest `main` and reads the latest handoff and `TASKS.md`.
- Session end: run `/end` to create a handoff file in `docs/handoffs/` (changes, what was done, to-do checklist, notes), update `TASKS.md`, push, and open a PR.
- Nightly safety net: a scheduled task runs at about 23:57 on each computer and does the same as `/end` if there is unpushed work, opening a draft PR. It never merges.
- Record major decisions in `DECISIONS.md`.
- Step-by-step guide with a glossary and "what to do when it goes wrong": [`docs/WORKFLOW.md`](docs/WORKFLOW.md).
- Every PR runs automatic checks (type check, lint, tests, build). A red ✗ means something must be fixed before merging.

### Getting started

```
git clone https://github.com/JerryHacAm/FrenchDaily.git
cd FrenchDaily
npm install
cp .env.example .env     # works as is: local file storage + mock AI
npm run dev              # http://localhost:3000
npm test                 # automatic tests
```

To use the real AI and database, follow [`docs/SETUP.md`](docs/SETUP.md).

---

## 14. Ownership

- **Jerry:** product vision, word list review, AI feedback prompt (`/prompts/check-sentence.md`), grammar rule set content, test sentences.
- **Loen:** architecture, setup, database, API integration, deployment.
- Both: review each other's PRs, update `TASKS.md` and `DECISIONS.md`.