# Handoff 2026-10-09 — quantrungvu (Loen)

## 1. Changes (files and behavior changed)
- New Next.js 16 app in the repo root (TypeScript, Tailwind, App Router, `src/` folder): `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `public/`, `src/app/`.
- `src/lib/config.ts`: the only place that reads `.env`. Exports `APP_MODE`, `STREAK_MIN_WORDS`, `MAX_CHECKS_PER_DAY`, `MIN_SENTENCE_WORDS` and the keys. Wrong values (e.g. `APP_MODE=prod`) stop the app with a clear error.
- `src/lib/supabase/server.ts`: server-only Supabase admin client and `checkSupabase()` health check (needs no tables).
- `src/app/page.tsx`: temporary setup page showing mode, limits and Supabase status (connected / not set up / error).
- `.env.example`: every variable, with comments on which key is which.
- `.gitignore`: Next.js rules + ours. `.env*` is ignored, except `.env.example`.
- `prompts/` and `tests/` folders created (empty, with `.gitkeep`).
- `AGENTS.md` (from Next.js): warns AI tools that Next.js 16 differs from what they know. CLAUDE.md points to it.
- `.claude/launch.json`: lets Claude start the dev server in its browser pane.
- Docs: CLAUDE.md (commands + code layout), README (status, env names, getting started), TASKS.md.

## 2. What I did (plain-language summary)
Created the empty app and a small page that proves it runs. Settings come from `.env` through one file, so nothing like "5" or "50" is typed into the code. The Supabase connection code is ready; it just needs the keys. Type check, lint and production build all pass.

## 3. To do next (checklist)
- [ ] quantrungvu: create the Supabase project, copy `.env.example` to `.env`, fill in the 3 Supabase values, run `npm run dev` and see "Supabase: connected".
- [ ] quantrungvu: connect the repo to Vercel, add the same env variables there, deploy the blank page.
- [ ] Jerry: review PR #3 (workflow) first, then this PR.
- [ ] Add a test runner (e.g. Vitest) with the first real logic (word picker), so `npm test` works.
- [ ] Decide README section 12 open questions (day boundary first, it affects the database design).

## 4. Notes
- **Env names changed:** `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Next.js only sends `NEXT_PUBLIC_` variables to the browser, and login (Phase 2) needs these two there. They are not secret. The service-role key stays server-only.
- Newer Supabase dashboards call the keys "publishable" (= anon) and "secret" (= service_role).
- **Next.js 16 gotcha:** a page that loads live data must wrap that part in `<Suspense>`, or `npm run build` fails ("blocking-prerender-dynamic"). See `src/app/page.tsx`.
- This branch is built on top of `feature/workflow-quantrungvu` (PR #3). Merge #3 first; then this PR shows only the setup changes.
- `npm install` reports 5 high vulnerabilities, all in dev tools (eslint). `npm audit --omit=dev` = 0. Don't run `npm audit fix --force`, it can break the setup.
- `CLAUDE_MODEL` default is still `claude-haiku-4-5-20251001` as in the README; compare newer models before Phase 1.
