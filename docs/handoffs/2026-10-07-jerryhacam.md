# Handoff 2026-10-07 — JerryHacAm

## 1. Changes (files and behavior changed)
- `README.md`: new full project description (idea, learning loop, word selection, sentence rules, AI feedback format, spaced repetition, streaks, modes, stack, workflow, data model draft, env vars, roadmap, open decisions, ownership).
- `CLAUDE.md`: renamed title to "French Daily". Now points to `@README.md` instead of repeating the project description and stack. Added rules: feedback in plain English only, `CLAUDE_MODEL` is never hardcoded, check docs before using unsure API parameters.
- `DECISIONS.md`: added "2026-10-07 — AI explanations are in English only".
- No app code changed. No behavior change.

## 2. What I did (plain-language summary)
Wrote the detailed README so the whole team and Claude share one description of the product. Trimmed CLAUDE.md to keep only rules for Claude and link to the README. Recorded the English-only feedback decision. All of this was committed as "Add detailed README" (3742014).

## 3. To do next (checklist)
- [ ] Fix the stray `- - Feedback language` line in CLAUDE.md (double bullet)
- [ ] Move the README commit onto a feature branch / get Loen to review it (see Notes)
- [ ] Set up Next.js project + Supabase connection (Loen, `feature/setup-loen`)
- [ ] Build curated word list `/data/words.json` (~1000 words) (Jerry)
- [ ] Draft AI feedback prompt `/prompts/check-sentence.md` (Jerry)
- [ ] Create `/data/grammar_rules.json` and `/tests/sentences.json` (Jerry)
- [ ] Create `.env.example` with the variables listed in README section 8
- [ ] Decide open questions in README section 12 (what counts as completed, day boundary, review words and daily 5, words per theme) and record in DECISIONS.md

## 4. Notes
- **Workflow slip:** the README commit (3742014) was made directly on `main`, which our rules only allow for the one-time initial setup. Not pushed yet as far as git status shows. Decide with Loen whether to move it to a branch (e.g. `feature/readme-jerry`) before pushing.
- README says the README's "Status" is pre-build; update it once the Next.js project exists.
- README section 4 says production gives "exactly 5" words per day, while CLAUDE.md says "minimum 5". Reconcile when production rules are decided.
- Handoffs folder had no earlier files.
