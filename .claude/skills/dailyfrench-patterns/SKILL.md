---
name: dailyfrench-patterns
description: "Use when working in DailyFrench, especially before changing a prompt in /prompts, a content type or JSON file in /data, a setting in config.ts, or an AI schema, and before writing a commit message: which other files usually have to change with it, measured from git history"
metadata:
  version: "1.0.0"
  source: local-git-analysis
  analyzed_commits: "83"
---

# DailyFrench Patterns

CLAUDE.md holds the rules (layout, modes, team workflow). This skill adds only
what the git history shows on top of it: which files move together, and how
commits are written.

## Commit Conventions
- Plain-English sentence, no `feat:`/`fix:` prefix (only 2 of 65 non-merge
  commits used one). Say what changed for the learner or the team.
- Optional area prefix with a colon when one area is touched:
  `Speech: ...`, `Login: ...`, `Security: ...`, `Test: ...`,
  `Word matcher: ...`, `Levels 3-5: ...`.
- Security bumps name the version jump and the advisory:
  `Security: zod 4.6.5 -> 4.6.7 (npm audit high, GHSA-...)`.
- Content reviewed by Jerry gets its own commit: `Jerry reviewed ...`.
- Session-end commits: `Handoff YYYY-MM-DD: <topics>` (written by /end).

## Change Together (co-change checklists)
When you edit the file on the left, check the files on the right; history
shows they almost always move in the same commit.

| You change | Also check |
|---|---|
| `prompts/check-sentence.md` | `tests/sentences.json` (AI grader cases), then `npm run eval`; often `src/lib/learning/feedback.ts`, `src/lib/services/practice.ts` |
| `src/lib/ai/schemas.ts` | `src/lib/ai/mock.ts` (mock must return the new shape), `src/lib/services/services.test.ts`, the service that reads the field |
| `src/lib/content/types.ts` | `src/lib/content/validate.ts`, `src/lib/learning/view.ts`, `src/lib/learning/session.test.ts`, `src/app/practice/PracticeClient.tsx` |
| `src/lib/config.ts` (new setting) | `.env.example`, `docs/SETUP.md` if it must be set when going live, `src/lib/deps.ts` / `src/lib/context.ts` if services need it |
| `data/words.json` / `data/grammar_rules.json` | `tests/sentences.json` when new words or rule ids appear in cases; `TASKS.md` / `DECISIONS.md` when the content plan changed |
| Anything user-visible or a decision | `TASKS.md` (most-changed file: 24 of 83 commits), `DECISIONS.md` |

## Testing Patterns
- Unit tests sit next to the code as `*.test.ts` (Vitest):
  `src/lib/learning/*.test.ts`, `src/lib/services/services.test.ts`,
  `src/lib/access.test.ts`, `src/lib/content/content.test.ts`.
- `tests/sentences.json` is not a unit test: it is the AI grader case set
  run by `npm run eval`. When a grader case fails, history shows the case
  itself was often wrong ("Fix 5 AI grader tests that expected the wrong
  thing"): check the expected answer before changing the prompt.
- Word-matcher fixes come with a regression test for the exact phrase
  (`Test: mot de passe doesn't match a lone "de"`).

## Workflows seen in history
- Bug in AI feedback: add or fix a case in `tests/sentences.json` → edit the
  prompt, plus a code safety net in `src/lib/learning/` when the rule can be
  checked by code (accent-only slips were made "minor" in both places).
- New setting that must work online: `config.ts` + `.env.example` +
  `docs/SETUP.md` in one commit; invite and access changes also touch
  `src/lib/access.ts` and its test.
- Content that has to change without a redeploy moves to a Supabase table
  (invite list did this), keeping the env var as fallback.
