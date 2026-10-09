# Setup: from "works on my computer" to the real app

Plain steps for quantrungvu and Jerry. Each step says **why**. Do them in order.
Nothing here needs code changes.

---

## 0. Run it on your computer (2 minutes, no accounts)

```bash
npm install
```
```bash
npm run dev
```
Open http://localhost:3000. With `STORAGE=file` and no `CLAUDE_API_KEY`, the
app saves to `.data/store.json` on your computer and uses the **mock AI**
(fake feedback that only catches le/la and j' mistakes). Good for clicking
around; not for learning.

Useful commands:

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app on http://localhost:3000 |
| `npm test` | Runs the 87 automatic tests (about 2 seconds) |
| `npm run check` | Type check + lint + tests: run before pushing |
| `npm run eval` | Tests the AI checker on 31 known sentences (uses the real AI if there is a key) |

---

## 1. Rotate the Supabase secret key (do this first)

**Why:** the old secret key was pasted into a chat, so treat it as public.

1. supabase.com → your project → **Project Settings → API Keys**.
2. Under **Secret keys**, use the ⋮ menu → create a new secret key, then delete the old one.
3. Put the new key in `.env` as `SUPABASE_SERVICE_ROLE_KEY=…`.

## 2. Create the database tables (one time)

**Why:** the app needs tables to store progress, sentences and costs.

1. Supabase → **SQL Editor** → **New query**.
2. Open `supabase/migrations/20261010000000_init.sql`, copy all of it, paste, click **Run**.
3. You should see "Success. No rows returned".

## 3. Set up login in Supabase

**Why:** each of us gets our own progress, protected by row level security.

1. Supabase → **Authentication → URL Configuration**:
   - Site URL: your Vercel URL (step 6), or `http://localhost:3000` for now.
   - Redirect URLs: add `http://localhost:3000/**` and later `https://<your-app>.vercel.app/**`.
2. For the pilot it's easier to turn off email confirmation:
   **Authentication → Sign In / Providers → Email → Confirm email: off**.
   (If you keep it on, the confirmation email link works too.)

## 4. Get a Claude API key

**Why:** real feedback needs the real AI. The default model (`claude-haiku-5-5`)
is very cheap: a full day of practice costs a fraction of a cent.

1. console.anthropic.com → **API Keys** → create a key.
2. **Billing → Limits**: set a monthly spend limit (README section 9).
3. Put it in `.env` as `CLAUDE_API_KEY=…`. Keep `CLAUDE_MODEL=claude-haiku-5-5`.
4. Restart `npm run dev`, then run `npm run eval`. Expect most of the 31
   tests to pass. Tell Jerry about any that fail: they show what to fix in
   `prompts/check-sentence.md`.

## 5. Switch your computer to the real database

1. In `.env`: `STORAGE=supabase` and `ADMIN_EMAILS=you@example.com,jerry@example.com`.
2. Restart `npm run dev`. You'll see a **Sign in** page: create your account.
3. Practise one word, then check Supabase → **Table Editor** → `learner_state`
   has a row. Your local `.data/store.json` progress does not move over.

## 6. Deploy to Vercel

**Why:** a real URL so Jerry and you can practise on your phones.

1. vercel.com → sign in with GitHub → **Add New → Project** → import `JerryHacAm/FrenchDaily`.
2. Before deploying, open **Environment Variables** and add everything from
   your `.env` **except** that `STORAGE` must be `supabase`. Never add `DATA_DIR`.
3. **Deploy**. Every PR now also gets its own preview link (handy for reviews).
4. Copy the URL into Supabase (step 3: Site URL and Redirect URLs).
5. On your phone: open the URL → browser menu → **Add to Home Screen**.

## 7. Start the pilot

- Both of you practise every day for 2 weeks.
- `/stats` (footer link "Pilot stats") shows minutes per day, words, accuracy
  and AI cost for each of you. After 2 weeks, decide the daily load together
  (ROADMAP F3) and write it in `DECISIONS.md`.

---

## When something goes wrong

| What you see | What to do |
|---|---|
| Yellow "Mock AI" bar at the top | `CLAUDE_API_KEY` is empty. Add it to `.env` (or Vercel) and restart. |
| "Content files have problems" | Someone broke a JSON file in `/data`. Run `npm test`: it lists the exact problem. |
| "Database error (…): permission denied" | The SQL in step 2 wasn't run, or ran only partly. Run it again. |
| Sign-in page keeps coming back | Check the Supabase URL/key in `.env`, and the Redirect URLs (step 3). |
| A PR shows a red ✗ | Open **Details** on the PR: it says which check failed (type check, lint, tests or build). |
