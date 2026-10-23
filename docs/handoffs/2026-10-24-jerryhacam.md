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
- [ ] Jerry: review the English translations in `data/structures.json` (Claude draft)
- [ ] Jerry: `grammar_rules.json`: "verb-avoir" and "avoir-expressions" both mention age; keep it in one
- [ ] Later: show the word's `note` and N.B. on the word page; `corrected_english` in the AI answer

## 4. Notes

- **Don't deploy today's `main` to Vercel.** It has no invite-only list yet, so anyone with the link could sign up. Deploy after this PR is merged. Branch preview links on Vercel are locked to the Vercel team by default, so friends need the `main` (production) link.
- **Supabase project changed.** The app now uses Jerry's own project, not the earlier one. quantrungvu: your `.env` still points to the old project. Ask Jerry for the new URL + publishable key if you want to use the shared online data; never share the secret key in chat.
- **`.env` gotchas this session:** the publishable and secret keys were swapped (a secret key in a `NEXT_PUBLIC_` variable would be sent to every browser), and a new key got pasted into the middle of the old one. Rule: publishable → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, secret → `SUPABASE_SERVICE_ROLE_KEY`, no space after `=`.
- Local progress in `.data/store.json` does not move to Supabase. Online starts fresh.
- On Windows, stopping `npm run dev` from Claude can leave the real server running. "Another next dev server is already running" → `taskkill /PID <pid> /F /T`.
- On start, Next.js printed a security warning with a `next upgrade --agent=security …` command. I didn't run that command; I checked with `npm audit` and updated the version by hand.
- The "Your fix" line only shows for fix attempts made after this change.
