# Handoff 2026-10-10 — Jerry (jerryhacam)

Branch: `feature/content-jerryhacam`

## 1. Changes

- `data/grammar_rules.json` (new): 37 rules for levels 1-2. Each rule id is also a mistake `tag`. Each rule has a default `severity` (major / minor).
- `data/words.json` (new): 330 words, levels 1-2 (177 / 153), 17 themes, nouns, verbs and adjectives only. New fields beyond README's draft: `feminine`, `article_f`, `example_f`, `note`, `other_meanings`.
- `prompts/check-sentence.md` (new): the AI feedback prompt, with `{{slots}}` that code fills in (word, template, level, learner gender, grammar rules, recent mistakes).
- `tests/sentences.json` (new): 35 test cases: 10 correct, 15 with known mistakes, 5 that fail the structure rule, 5 for gender and word forms.
- `README.md`: feedback JSON format (3.4) adds `structure_feedback`, `corrected_english`, `severity`. Word format (3.1) adds new fields. New section 3.2a Learner gender. Word card (3.2) shows both forms, a note, and an N.B. for other meanings. Reflexive verbs are a level 2 topic. `users` table gets `gender`. The word picker borrows unseen verbs from "basics".
- `DECISIONS.md`: 9 new entries (one is a proposal, see Notes).
- `TASKS.md`: updated to match.

## 2. What I did

I created the four content files that the app will need, so Loen and I can start building the core loop. The grammar rules give each kind of mistake a name. The prompt uses those names, and the test sentences check that the AI uses them correctly. Through Q&A with Claude I decided:
- **Major vs minor mistakes:** major means wrong meaning or core grammar. Minor means accents, small spelling, or punctuation.
- **17 word themes:** checked against common A1/A2 course themes.
- **Word list:** levels 1-2 first, with the rest later.
- **Feedback:** also shows an English translation of the corrected sentence.
- **Masculine/feminine:** a word with both forms is one word (l'ami / l'amie).
- **Learner gender:** learners pick male, female, or not set. Their sentences about themselves must match it.
- **Double meanings:** a word with two meanings gets an N.B. reminder when it comes back.
- **Reflexive verbs:** they move to level 2, with an explanation of "se".
- **Verbs:** every theme has a level-1 verb now, and a word is never served twice as new.

## 3. To do next

- [ ] Loen: review the PR, especially the day-boundary proposal at the bottom of DECISIONS.md
- [ ] Jerry: read through words.json (genders, examples, levels). Claude flagged frequency ranks as estimates.
- [ ] Jerry: read the prompt and the test cases. Change anything that doesn't sound like you.
- [ ] Run the 35 test cases against the real Claude API once the check is connected
- [ ] Extend words.json to levels 3-5 (toward ~1000 words)
- [ ] Build: learner gender in profile, word card (both forms, note, N.B.), word picker with the "borrow from basics" rule

## 4. Notes

- **Day boundary is only a proposal.** It's marked "PROPOSED (needs Loen)" in DECISIONS.md: use the user's local date, from the browser's timezone, saved as a plain date. README 3.6 still says "not decided" until Loen agrees.
- Only nouns, verbs and adjectives are in the word list, because structures.json has no templates for other word types.
- `speaker-agreement` (a woman writing "je suis fatigué") is a **major** mistake, so the word goes back to box 1. We chose this on purpose, to build the habit.
- Some tests use sentences that the app's own quick checks would stop first (e.g. too short). That's on purpose, to test the AI on its own.
- Every `frequency_rank` in words.json is an estimate, not from a real word-count source. It's only used for ordering.
- Possible conflict: Loen has a branch `feature/roadmap-quantrungvu`. If it also changes TASKS.md or README.md, the second PR to merge may need a small fix.
