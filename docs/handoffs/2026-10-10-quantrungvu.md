# Handoff 2026-10-10 — quantrungvu (Loen)

## 1. Changes (files and behavior changed)
- No new code this session. The app work from 2026-10-09 is on `feature/setup-quantrungvu` (PR #4, still a draft).
- `.env` created locally with the Supabase project values and the Claude/app settings. It is git-ignored and was never committed.
- `README.md` and `TASKS.md` were updated on 2026-10-09 to match the Next.js setup.

## 2. What I did (plain-language summary)
Connected the app to the Supabase project. The setup page now reads "Supabase: connected" when run locally. I also checked the Supabase table settings with you (Data API on, auto-expose off, automatic RLS on). Jerry's workflow PR #3 has been merged into `main`.

## 3. To do next (checklist)
- [ ] quantrungvu: **Rotate the Supabase secret key.** It was pasted into the chat, so treat it as exposed. In Supabase: Settings → API Keys → Secret keys → regenerate. Then update `SUPABASE_SERVICE_ROLE_KEY` in your local `.env` and restart `npm run dev`.
- [ ] quantrungvu: Connect the repo to Vercel, add the same variables there, and deploy the blank page.
- [ ] Jerry: review PR #4 and mark it ready when it looks right.
- [ ] Add a test runner (for example Vitest) with the first real logic, so `npm test` works.
- [ ] Decide README section 12 open questions. Start with the day boundary (local time or UTC), because it changes the database design.

## 4. Notes (bugs, blockers, decisions, gotchas)
- **Secret key exposed in chat (2026-10-10).** Only the local `.env` holds it. Rotate it (see checklist). Never paste secret keys into chat. The publishable key is safe to share, but it is still better kept in `.env`.
- **Supabase URL format:** use only `https://<project-id>.supabase.co`. Do not add `/rest/v1/`, the client adds it.
- **Env var names:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are visible in the browser by design (Next.js rule). Only `SUPABASE_SERVICE_ROLE_KEY` must stay server-only.
- **Dev server needs a restart after editing `.env`.** Next.js reads it only at startup.
- **Browser pane issue:** the built-in browser showed an error page for `localhost:3000` once, but the server returned 200 and the page text said "connected" over curl. This is a preview-pane problem, not an app problem. Check it by opening http://localhost:3000 in your normal browser.
- Supabase table defaults: "Automatically expose new tables" is off, and "Automatic RLS" is on. Every new table stays locked until a rule is written for it (Phase 2).
