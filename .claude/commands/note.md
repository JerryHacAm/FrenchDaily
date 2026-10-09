Start of session. Do the following:
1. Run `git fetch` and `git status`. If I have no uncommitted changes, switch
   to `main` and `git pull` so I have the other person's merged work. Tell me
   in plain words which branch I'm on and whether anything is waiting.
2. If `gh` works, list open PRs (`gh pr list`) and say which ones wait for my review.
3. Read the 2 most recent files in docs/handoffs/ and TASKS.md.
4. Print the latest handoff's 4 sections, then summarize what the other person
   left for me to continue.
5. Suggest the branch name for my next task (`feature/<task>-<suffix>`, suffix
   from the Team table in CLAUDE.md).
