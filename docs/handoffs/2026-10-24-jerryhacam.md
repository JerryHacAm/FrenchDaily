# Handoff 2026-10-24 — Jerry (jerryhacam)

Branch: `feature/finish-jerryhacam` (session started the evening of 2026-10-23)

## 1. Changes

- **Security:** Next.js 16.4.0 → 16.4.3 (and eslint-config-next). `npm audit` flagged 3 critical advisories in 16.0.0–16.4.0; now 0.
- **Learner gender:** the profile form (welcome + Progress → Settings) asks "I'm a man (fatigué) / I'm a woman (fatiguée) / Don't check this". Saved as `profile.gender`. Older saves load as "not set".
  - Every check sends `learner_gender` to the AI. `prompts/check-sentence.md` now says: a "je" form that doesn't match the learner is `speaker-agreement` (major), both forms are fine when "not set", and the AI's examples match the learner.
  - `tests/sentences.json`: j31 is no longer skipped, and j31b was added (male learner, correct sentence).
- **Word page:** shows the word's example sentence + English + audio. Female learners see `example_f` (11 words).
- **Structure box:** every template example now has an English translation (`data/structures.json`, 135 sentences, **Claude draft**). `validate.ts` requires `[word, French, English]`.
- **Fix step:** when the fix is still wrong, the answer screen shows "Your fix:" under "You wrote:".
- **AI grader tests:** t20–t27 pointed at template s201 ("… mais + contrast") but had no "mais", so the AI was right to say the structure wasn't followed. Moved to matching templates. t13 also accepts `avoir-expressions`.
- **Invite-only (`ALLOWED_EMAILS`):** with STORAGE=supabase, only those emails (+ `ADMIN_EMAILS`) can sign up, sign in or load a page. An empty list means anyone can sign up. New: `src/lib/access.ts` + tests. Also documented in `.env.example` and `docs/SETUP.md`.
- **Login:** "Sign in" and "Create account" are now clearly different (tabs, different heading and text, "type the password again", server checks they match).
- DECISIONS.md: new entry (personal app + invited friends, Jerry's own Supabase). TASKS.md updated.
- Tests: 96 pass (was 92).

## 2. What I did

I added a real Claude key. The app logs every AI call, and the log shows the checks really go to `claude-haiku-5-5` (each costs about $0.001). Then I fixed what bothered me while practising: I couldn't understand the structure examples (now in English), I couldn't compare my fix with the answer (now shown), and the app didn't know I'm a man or a woman (now it does, and Claude checks it). The 5 failed AI tests turned out to be wrong tests, not a wrong AI.

The plan changed: this is my personal app, plus a few friends. So I made **my own Supabase project**, ran the SQL, and the app works with it on my laptop: sign up, practise, a row appears in `learner_state`. To keep my Claude credit safe, the online app is invite-only. Last, I made the login screens less confusing.

## 3. To do next

- [ ] quantrungvu: review and merge this PR (it includes the Next.js security update)
- [ ] Jerry: after the merge, Vercel: import `JerryHacAm/FrenchDaily`, add every `.env` line except `DATA_DIR` (STORAGE=supabase), deploy
- [ ] Jerry: Supabase → Authentication → URL Configuration: Site URL = the Vercel link, Redirect URLs + `https://<link>/**`
- [ ] Jerry: put friends' emails in `ALLOWED_EMAILS` (in Vercel), send them the link
- [ ] Later: show the word's `note` and N.B. on the word page; `corrected_english` in the AI answer

## 4. Notes

- **Don't deploy today's `main` to Vercel.** It has no invite-only list yet, so anyone with the link could sign up. Deploy after this PR is merged. Branch preview links on Vercel are locked to the Vercel team by default, so friends need the `main` (production) link.
- **Supabase project changed.** The app now uses Jerry's own project, not the earlier one. quantrungvu: your `.env` still points to the old project. Ask Jerry for the new URL + publishable key if you want to use the shared online data; never share the secret key in chat.
- **`.env` gotchas this session:** the publishable and secret keys were swapped (a secret key in a `NEXT_PUBLIC_` variable would be sent to every browser), and a new key got pasted into the middle of the old one. Rule: publishable → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, secret → `SUPABASE_SERVICE_ROLE_KEY`, no space after `=`.
- Local progress in `.data/store.json` does not move to Supabase. Online starts fresh.
- On Windows, stopping `npm run dev` from Claude can leave the real server running. "Another next dev server is already running" → `taskkill /PID <pid> /F /T`.
- On start, Next.js printed a security warning with a `next upgrade --agent=security …` command. I didn't run that command; I checked with `npm audit` and updated the version by hand.
- The "Your fix" line only shows for fix attempts made after this change.
- Jerry reviewed the English translations in `data/structures.json`. "verb-avoir" and "avoir-expressions" both mention age **on purpose**: they have different purposes (conjugating avoir vs. using avoir instead of être). Keep both, and keep accepting either tag in tests like t13.

---

# Later session 2026-10-24: the app is online

Branch: `feature/go-live-jerryhacam` (only this handoff + TASKS.md)

## 1. Changes

- No code changes. PR #8 and PR #9 are merged into `main`.
- **The app is live:** https://french-daily-seven.vercel.app (Vercel project `french-daily`, production branch `main`).
- Vercel environment variables: every `.env` line (STORAGE=supabase, real Claude key, ADMIN_EMAILS, ALLOWED_EMAILS). Pasted in one go from `.env`.
- Supabase → Authentication → URL Configuration: Site URL = the Vercel link, Redirect URLs include `https://french-daily-seven.vercel.app/**` (and `http://localhost:3000/**`).

## 2. What I did

I put the app online with Vercel. At first the domain said "No Deployment"; after that was sorted, the app opened on my phone and works. I told Supabase about the new address so login email links go to the online app, not my laptop. I updated the invite list (`ALLOWED_EMAILS`) in Vercel and redeployed so it takes effect.

## 3. To do next

- [ ] Jerry: send the link to friends; they tap **Create account** with the exact email on the list
- [ ] Jerry: practise daily on the phone; note anything confusing
- [ ] Later: show the word's `note` and N.B. on the word page; `corrected_english` in the AI answer

## 4. Notes

- The "Don't deploy today's `main`" note above is outdated: invite-only is on `main` now and deployed.
- **Use the domain link, not the deployment link.** `french-daily-seven.vercel.app` stays the same forever. The long `french-daily-<random>-ratt.vercel.app` links change with every deploy and ask visitors to log in to Vercel.
- **Changing a Vercel setting does nothing until you redeploy** (Deployments → ⋯ → Redeploy, leave "Use existing Build Cache" unticked).
- Vercel saves variables as **Secret**: the value box looks empty when you edit it. Whatever you type **replaces** the whole value, so type the full email list. Never save `ALLOWED_EMAILS` empty (empty = anyone can sign up).
- Every merge into `main` now redeploys the live app automatically.

---

# Third session 2026-10-24: word tips, English corrections, basics verbs, test code

Branch: `feature/tips-bypass-jerryhacam`

## 1. Changes

- **Word page:** shows the word's `note` (💡 tip) and N.B. lines for `other_meanings`. An N.B.-only meaning (word_id null, e.g. *sale*) always shows. A linked meaning (e.g. *temps* = time ↔ weather) shows only once the learner has seen the other entry: "You learned 'temps' = weather. Here it means time." (README 3.2). Code: `nbLines()` in `src/lib/learning/view.ts`, `ReadStep` in `PracticeClient.tsx`, `note`/`other_meanings` added to `Word` in `content/types.ts`.
- **`corrected_english`:** new field in the AI answer (`schemas.ts`, `feedback.ts`, `state.ts`, mock). Shown under the corrected sentence in `FeedbackCard` (practice + Review). Not shown in the hint step (it would give the answer away). Old saved feedback has no translation and just shows none. `prompts/check-sentence.md`: one new line + the example answer, **marked Claude draft**.
- **Word picker:** when the theme has no unseen verb at the learner's level, it now always borrows one from "basics" (`BORROW_VERBS_FROM` in `picker.ts`). Before, it took the most common verb from any theme; with today's word list that was almost always basics by luck.
- **Test code (`TEST_BYPASS_CODE` in `.env`):** typing it in any answer box (sentence, question, fix, retype, role-play) skips the code checks and the AI, uses no daily check, and accepts the item. Role-play gets a fixed reply ("D'accord !") and, if every message was the code, a fixed summary. Works only with APP_MODE=test, for admins + `ALLOWED_EMAILS` (an empty invite list = admins only), and always locally with STORAGE=file. Code: `isBypass()` in `services/common.ts`, `canUseBypass()` in `access.ts`, used in `practice.ts`, `roleplay.ts`, `deps.ts`. Documented in `.env.example`.
- Tests: 102 pass (was 96). New: picker borrows from basics, N.B. lines, test code (practice, fix/retype, role-play, who may use it).
- `npm run eval` (prompt changed): 65/67, then 67/67 on a second run. The first-run failures (j15, j23) were the AI being inconsistent; in j23 it called a missing accent a major mistake. ~$0.08 total.

## 2. What I did

Claude built the three "pair" tasks from TASKS.md: the word page shows the tips and N.B. reminders already in words.json, the AI now also gives the English meaning of the corrected sentence, and new verbs come from "basics" when a theme runs out. I also asked for a secret test code: typing it instead of a sentence skips the AI, so I can test the flow and the streak without spending time or Claude credit. It works for admins and invited friends.

## 3. To do next

- [ ] quantrungvu: review and merge this PR
- [ ] Jerry: in Vercel, add `TEST_BYPASS_CODE` (the code is in Jerry's `.env`), then Redeploy, so the code works on the phone
- [ ] Jerry: review the `corrected_english` line in `prompts/check-sentence.md` (Claude draft)
- [ ] Jerry: try the word page on *se lever* (tip) and *sale* (N.B.) in the browser; not checked in a browser yet, only by tests
- [ ] Look at the AI grading accent-only slips as major (eval j23), if it keeps happening

## 4. Notes

- **The test code changes real progress.** Items done with it count as completed, move the word up a review box, and appear on the Review page as the code word. Use a test account if you don't want that in your real learning.
- Invited friends can use the code too (Jerry's choice, to test as a normal user). They could fake streaks if they learn it; it costs no Claude credit.
- The code is only in `.env` (never committed). quantrungvu: ask Jerry for it and add `TEST_BYPASS_CODE=...` to your own `.env`.
- It is off when APP_MODE=production or when `TEST_BYPASS_CODE` is empty.

---

# Fourth session 2026-10-24: accents, invites table, levels 3–5, word matcher

Branches: `feature/content-review-jerryhacam` (PR #12), `feature/invite-table-jerryhacam` (PR #13), `feature/levels3-5-jerryhacam` (PR #14), all merged. This branch: only this handoff + TASKS.md.

## 1. Changes

- **Accent slips are always minor (PR #12):** the AI sometimes called "a l'ecole → à l'école" a major mistake (2 of 9 runs of eval j23), which sends the word back to review box 1. Code now makes any mistake whose original and fix differ only in accents `minor` with the tag `spelling-accent` (`feedback.ts`, `onlyAccentsDiffer()` in `text.ts`). There's also a new line in `prompts/check-sentence.md`. Jerry reviewed it and the `corrected_english` line.
- **Invite list in Supabase (PR #13):** new table `invites` (`supabase/migrations/20261024000000_invites.sql`). An email in the table **or** in `ALLOWED_EMAILS` may use the app. Only the server can read the table. If it can't be read, the app stays invite-only. The list is cached for 30 seconds (`src/lib/invites.ts`, `mergeInvites()` in `access.ts`). Jerry ran the SQL, and the table has 4 emails.
- **Levels 3–5 (PR #14):**
  - `data/words.json`: 644 new words (w0334–w0977, **977 in total**). Level 3 = 247, level 4 = 219, level 5 = 178. 4 new themes that only exist at levels 3–5: opinions-ideas, money-admin, culture-media, society-environment.
  - `data/structures.json`: 6 adjective templates (s310, q307, s410, q407, s510, q507). There are 81 templates in total.
  - `data/grammar_rules.json`: 10 rules for level 3–5 grammar (c-est-il-est, depuis-ca-fait, venir-de-en-train-de, negation-plus-jamais-rien, futur-simple, infinitive-after-preposition, plus-que-parfait, tense-after-quand, conditional-polite, indirect-pronoun). The older level 3–5 rules also got a severity.
  - `tests/sentences.json`: c01–c10. New picker test: level 3–5 learners get words and templates of their own level.
- **Word matcher (PR #14, `src/lib/learning/text.ts`):**
  - Verbs match only with a real French ending ("dans" ≠ danser, "cuisine" ≠ cuire).
  - When a word without its accent is another common word (ne/né, sur/sûr, sale/salé, marche/marché…), the accent must match.
  - New optional words.json field `not_forms` (grandir: grand…).
  - This fixed two bugs: *naître* matched every "ne", and *mot de passe* matched every "de".
- Docs: README, ROADMAP, DECISIONS (2 entries), SETUP.md, .env.example.
- Tests: 117 pass (was 106). `npm run eval`: 77/77.

## 2. What I did

I made sure a missing accent can never reset a word's progress. I moved the invite list into Supabase, so adding a friend is now just one row in the Table Editor, with no Vercel change or redeploy. Then Claude built levels 3–5: 644 everyday words (written by 6 helper agents, each checked by the app's own validator), the missing adjective templates and grammar rules. While checking the new words, we found and fixed look-alike matching in the word checker. I tested on my phone: after changing my level to 5 and finishing the batch I was in, I got level 5 words, and the 💡 tip on *se lever* shows.

## 3. To do next

- [ ] quantrungvu: review and merge this handoff PR
- [ ] Jerry: review the level 3–5 drafts as you meet them (words, templates s310–q507, the 10 new rules, tests c01–c10). No need to read all 644 at once.
- [ ] Jerry: check *sale* (N.B. line) on the word page when it comes up
- [ ] Jerry: send the link to the invited friends; practise daily

## 4. Notes

- **Changing your level** saves straight away, but the batch you're in keeps its old words. The next batch uses the new level (reviews first, then new words of that level). The automatic level change waits 7 days after a manual change.
- **Jumping from level 1 to 5 skips levels 2–4.** Lower-level words only come after every level 5 word has been seen.
- **Adding a friend:** Supabase → Table Editor → `invites` → Insert row → email → Save. It works within about 30 seconds. To remove someone, delete their row (and remove them from `ALLOWED_EMAILS` too, if they're there).
- **Look-alikes the matcher can't separate:** real homographs like *il lit* / *le lit* and *cours*. The AI judges these from the meaning.
- Level 3–5 content is all **Claude drafts**. Frequency ranks are estimates (no free official B1/B2 list was found). Only nouns, verbs and adjectives are included, because there are no templates for adverbs or connectors.
- In eval, test c08 first failed on `structure_ok`: its template asked for "lui", and the test sentence used "l'". The test was moved to a neutral template. When a test fails, check whether the template matches the mistake before blaming the AI.
