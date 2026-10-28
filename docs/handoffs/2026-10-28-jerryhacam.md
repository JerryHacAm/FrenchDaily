# Handoff 2026-10-28 — Jerry (jerryhacam)

Branches: `feature/french-chat-jerryhacam` (this PR) and `feature/zod-fix-jerryhacam` (its own PR, one line).

## 1. Changes

- **"Ask about French" chatbot:** a round blue button at the bottom right of every page (only when signed in) opens a small chat. The learner asks anything about French (a word, a number, a structure, "is this sentence right?") and Claude answers in short plain English.
  - French words in the answer are **bold**; tapping one reads it aloud (browser voice). Simple "- " lists are shown as lists.
  - Empty chat shows 3 example questions. "New chat" clears it, "−" minimises.
  - Off-topic questions get a cheeky "I only do French".
  - **Tone: a sarcastic French friend** (Jerry's choice): one short joke at most, about the question, the mistake or French itself, never personal. The answer always comes first. If the learner seems upset or asks to stop, it turns kind. The sentence checker is unchanged (still encouraging).
  - **Each question uses one AI check** from `MAX_CHECKS_PER_DAY` (like role-play). The panel shows how many are left.
  - The chat is **not saved**: it stays while moving between pages, gone after a reload. Only the check count and a `question_asked` event are saved. The last 8 messages go to the AI as context.
  - Code: `src/components/AskFrench.tsx` (UI), `AskFrenchSlot.tsx` (only for signed-in users, inside `<Suspense>` in `layout.tsx`), `src/lib/services/ask.ts`, `askFrenchAction` in `actions.ts`, `askFrench` in the AI client (`claude.ts`, `mock.ts`, `schemas.ts` → `AskReplySchema`, `prompts.ts` → `askUserMessage`). `speakFrench()` is now exported from `Speak.tsx`.
  - New prompt `prompts/ask-french.md`, **Claude draft for Jerry**; Jerry chose the sarcastic tone.
  - Mock AI (no key): only translates words from the word list ("What is apple in French?" → **la pomme**).
- **Security (separate branch/PR):** zod 4.6.5 → 4.6.7 in `package-lock.json` (npm audit high, GHSA-mrhx-c7xc-m3w5). `npm audit`: 0.
- DECISIONS.md: the chat shares the 50 daily checks and is sarcastic on purpose.
- This branch also contains the zod commit (merged in, so the lock file matches what's installed).
- Tests: 120 pass (was 117). New: answer + check counted + event, empty/too long/daily cap, browser history cleaned and trimmed.

## 2. What I did

I wanted a small helper like the chat bubbles on other websites, where I can ask any French question while practising. Claude built it on top of the existing AI code, so it uses the same key, model, cost log and daily limit. We tried 5 real questions with Claude (apple, 25, il y a, a wrong sentence, an off-topic question): all answers were correct and short, about $0.0005 each. I decided to keep the 50 daily checks shared, and asked for a sarcastic, funny French tone instead of "never mock". Tried again: it jokes about French ("80 = four twenties, oh là là") and turns kind when I say French is too hard. `npm audit` also flagged a zod problem; it's fixed in its own small PR.

## 3. To do next

- [ ] quantrungvu: review and merge the zod PR (`feature/zod-fix-jerryhacam`) first, it's one line
- [ ] quantrungvu: review and merge the chatbot PR (this one)
- [ ] Jerry: try the chat in a real browser and on the phone (not clicked through in a browser yet, only tests + real Claude answers from a script)
- [ ] Jerry: review `prompts/ask-french.md` (Claude draft, sarcastic tone): are the jokes funny, not too much?

## 4. Notes

- **Merge order:** merge the zod PR first. The chatbot PR also contains the zod commit; after the zod PR is merged, it disappears from the chatbot PR's changes. No conflict expected.
- **`node_modules` was broken, now fixed:** at the start, `npm test` crashed with "Cannot find module … vitest/dist/chunks/…". Several packages (vitest, vite) had lost files. `npm install` did not fix it; deleting `node_modules` and running `npm ci` did. Checked afterwards: `npm ls` finds no problems, `npm audit` 0. If it happens again: delete `node_modules`, run `npm ci` (it only re-downloads packages, from the lock file).
- quantrungvu: after pulling, run `npm ci` once (zod changed).
- To try the app locally without login: `STORAGE=file` for one run only (your `.env` stays on supabase). The Claude key still works, so answers are real.
- Bold = French is a rule in the prompt. If the AI bolds English words, they become "tap to hear" buttons that speak English with a French voice. Fix it in the prompt if you see it.
- The bubble sits over the bottom right corner; the footer got extra space so nothing is hidden at the end of a page. On the phone, check it doesn't cover the practice Send button.
