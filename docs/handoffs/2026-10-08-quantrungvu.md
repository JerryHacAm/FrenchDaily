# Handoff 2026-10-08 — quantrungvu (Loen)

## 1. Changes (files and behavior changed)
- `docs/WORKFLOW.md` (new): plain-language guide for both of us: glossary, a normal day, how to review a PR, the nightly save, golden rules, fixes for common git problems, one-time setup.
- `CLAUDE.md`: Team table mapping git names to handoff/branch suffixes (`jerryhacam`, `quantrungvu`); note that we're vibe coders so Claude should explain; workflow now mentions /note, the full /end, and the nightly 23:59 save.
- `.claude/commands/end.md`: finds the name from the Team table, refuses to commit on `main`, appends to today's handoff if it exists, and after confirmation runs tests, checks for secrets, commits, pushes and opens the PR.
- `.claude/commands/note.md`: now fetches/pulls first, lists open PRs, and suggests a branch name.
- `TASKS.md`: setup branch renamed to `feature/setup-quantrungvu`; added this workflow task; structures.json changed from "write" to "Jerry reviews" (draft exists); "Fixed 5" changed to "Minimum 5"; Done list caught up.
- `DECISIONS.md`: added the minimum-5 production decision (it was only in the README and the 10-07 handoff), the daily GitHub sync decision, and put the entries in date order. The old "5 per day" entry has an update note.
- `README.md` section 13: mentions the nightly save and links WORKFLOW.md.
- No app code changed.

## 2. What I did (plain-language summary)
Cloned the repo and read all the docs. Made the team workflow clearer and set up a nightly 23:59 auto-save on my computer, because our Claude sessions can't be shared and GitHub is our only shared place. Fixed a few places where TASKS.md and DECISIONS.md disagreed with the README.

## 3. To do next (checklist)
- [ ] Jerry: review this PR. If you like the nightly save, set up the same scheduled task on your computer (ask your Claude to copy it from docs/WORKFLOW.md section 5).
- [ ] Jerry: confirm I have write access (Settings → Collaborators).
- [ ] Loen: start `feature/setup-quantrungvu` (Next.js + Supabase).
- [ ] Pair: decide the open questions below and README section 12.

## 4. Notes
- **Conflict to decide:** CLAUDE.md says "A day uses user local time", but README 3.6 and open decision #2 say local vs UTC is not decided yet. Which one is true?
- **Model:** README 8 defaults `CLAUDE_MODEL` to `claude-haiku-4-5-20251001`. Newer models exist now (for example `claude-haiku-5-5`). Compare them on the test set before picking.
- **Setup:** `.gitignore` only has `.env` and `.claude/capsule.md`. When we create the Next.js app, also ignore `node_modules/`, `.next/` and `.env*.local`.
- The remote branch `feature/readme-handoff-jerry` is already merged and can be deleted on GitHub.
- The 10-07 handoff says `gh` is installed. That's true on Jerry's computer, not on mine yet.
