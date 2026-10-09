Wrap up this session. Do the following:
1. Find my name: match `git config user.name` against the Team table in CLAUDE.md.
   If it is not in the table, ask me whether I'm Jerry or Loen.
2. Run `git status` and check the branch. If I'm on `main`, stop and create a
   branch `feature/<task>-<suffix>` first (uncommitted changes move with it).
3. Look at `git diff`, `git status` and `git log` for this session's work.
4. Create `docs/handoffs/<today's date>-<suffix>.md` (suffix from the Team table) with:
   ## 1. Changes (files and behavior changed)
   ## 2. What I did (plain-language summary)
   ## 3. To do next (checklist, `- [ ]` format)
   ## 4. Notes (bugs, blockers, decisions, gotchas)
   If today's file already exists, add to it instead of replacing it.
5. Update TASKS.md to match.
6. Show me the handoff file and ask me to confirm before committing.
7. After I confirm: run `npm test` if a package.json exists, check that no
   `.env` file or API key is staged, commit, `git push -u origin <branch>`,
   then open a PR with `gh pr create --base main` (or show the existing one
   with `gh pr view`). Use the handoff as the PR description. Never merge.
8. Explain in one or two plain sentences what you just did and give me the PR link.
