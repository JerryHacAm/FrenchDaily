---
name: capsule
description: Compress the current Claude Code session into a minimal, token-efficient context capsule that a fresh Claude session can load to continue the work. Use when the user wants to summarize the session, start a new session/chat, hand context to a new Claude, says the context is getting long, "save context", "pack this up", "continue in a new session", or similar. This is AI-to-AI context, not the human handoff that /end writes for teammates.
---

# Capsule

Write a context capsule: the smallest text that lets a fresh Claude session continue this work without re-asking or re-discovering anything. The reader is another Claude, not a human, so optimize for information per token, not readability.

## What to include (only what is non-obvious)

The next session automatically loads CLAUDE.md and can read the repo, git log and files. Do not restate any of that. Include only what lives in this conversation and would be lost:

- **Goal**: what the user is trying to achieve right now, one line.
- **State**: what is done, what is half-done (exact file and spot), what is not started.
- **Decisions**: choices made this session and the reason for each, especially ones the user made or corrected. A decision without its reason gets re-litigated.
- **Rejected**: approaches tried or discussed and dropped, and why, so they are not retried.
- **Gotchas**: surprises found (bugs, env quirks, commands that failed and the fix).
- **User prefs**: how the user wants things done, learned this session (tone, scope limits, "don't touch X").
- **Next**: the concrete next action(s), in order.
- **Open**: unanswered questions waiting on the user.

Skip any empty section. Skip pleasantries, narration of what was explored, and code that is already saved in files (point to `path:line` instead). Quote code or text only if it is not on disk yet.

## Format

Terse key-value lines and bullets. Fragments, not sentences. Abbreviate freely when unambiguous. Use `path:line` refs. No headings beyond the section labels, no bold, no blank lines between bullets.

Example:

```
CAPSULE 2026-10-08 branch=feature/picker-loen uncommitted=src/lib/picker.ts
GOAL: word picker w/ level+theme+pos mix (TASKS.md #3)
DONE: pickWords() src/lib/picker.ts:12-60; tests tests/picker.test.ts pass
WIP: pos-mix guarantee picker.ts:44 — fails when theme pool has 0 verbs
DECISIONS:
- fallback to any-theme verb if theme has none (user: streak > theme purity)
- seeded RNG via param, not Math.random, for tests
REJECTED: pre-shuffling words.json at load (breaks frequency_rank order)
GOTCHA: npm test needs --runInBand on Windows, else Supabase mock collides
PREFS: Jerry wants plain-English comments; no edits outside src/lib without asking
NEXT: 1) fix verb fallback 2) add test for empty-theme 3) /end
OPEN: should adjectives count as "connector" for the mix? (asked, no answer)
```

## Steps

1. Run `git status -sb` and `git log --oneline -5` to get branch and uncommitted files for the header line.
2. Review the conversation and draft the capsule. Aim for under ~300 tokens; go longer only when the session truly holds more unsaved state.
3. Reread it as the new Claude: could you continue with no questions? Add what's missing, cut anything derivable from the repo.
4. Save to `.claude/capsule.md` (overwrite; one capsule at a time). This file is personal session state, so it should be in `.gitignore`. If it is not, tell the user once.
5. Reply with the capsule in a code block, then the line to paste into the new session:
   `Read .claude/capsule.md and continue.`
