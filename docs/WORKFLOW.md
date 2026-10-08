# How we work (plain-language guide)

For Jerry and quantrungvu (Loen). No coding background needed. Rules for Claude
live in `CLAUDE.md`; this file is for us humans.

---

## 1. The big picture

Our Claude Code sessions live on our own computers and can't be shared. So
**GitHub is our shared notebook**: everything we want the other person to see
must be pushed there.

```
 your computer                    GitHub                     teammate's computer
 ─────────────                    ──────                     ───────────────────
 edit on a branch  ──push──►  your branch + PR  ──review──►  merged into main
                                                                    │
 git pull  ◄───────────────────────  main  ◄────────────────────────┘
```

## 2. Words you need to know

| Word | What it means |
|---|---|
| **repo** (repository) | The project folder, with its full history. Ours: `JerryHacAm/FrenchDaily`. |
| **commit** | A saved snapshot of your changes, with a short message. Like "Save" in a game. |
| **branch** | A separate copy of the project where you can work without touching anyone else's work. |
| **main** | The official branch. Only reviewed work goes here. **Never commit to main directly.** |
| **push** | Upload your commits from your computer to GitHub. |
| **pull** | Download the latest commits from GitHub to your computer. |
| **PR** (pull request) | A request on GitHub: "please review my branch and merge it into main". |
| **draft PR** | A PR marked "not finished yet". The nightly save opens these. |
| **merge** | Accept a PR, so its changes join `main`. Only a human does this, after review. |
| **conflict** | Two people changed the same lines. Git can't pick a winner, so a human must. |
| **handoff** | A note in `docs/handoffs/` that says what you did and what is next. |

## 3. A normal day

**Start (2 minutes)**
1. Open Claude Code in `F:\FrenchDaily` (or your own folder).
2. Type `/note`. Claude pulls the latest `main`, reads the newest handoffs and
   `TASKS.md`, tells you what the other person left, and suggests a branch name.
3. Tell Claude what to work on. It creates the branch, e.g.
   `feature/word-picker-quantrungvu`.

**During**
- Vibe code as usual. Ask Claude to commit every time something works
  ("commit this"). Small commits are easy to review and easy to undo.
- Decided something important? Ask Claude to add it to `DECISIONS.md`.

**End**
- Type `/end`. Claude writes the handoff, updates `TASKS.md`, shows you the
  handoff, and after your OK commits, pushes and opens (or updates) the PR.
- Send the PR link to the other person.

**Forgot `/end`?** The nightly save does it for you at 23:59 (section 5).

## 4. Reviewing the other person's PR

1. Open the link (or https://github.com/JerryHacAm/FrenchDaily/pulls).
2. Read the description (it is their handoff), then the **Files changed** tab.
   Green lines were added, red lines removed.
3. Not sure what something does? Ask Claude: "explain PR #5 to me".
4. Leave a comment, or click **Review changes → Approve**.
5. Merge with **Merge pull request**. A draft PR must first be marked
   **Ready for review** by its author.
6. Afterwards, both people run `/note` (or `git pull` on main) to get the merged work.

## 5. The nightly save (23:59)

Each of us has a scheduled task in the Claude desktop app
(sidebar → **Scheduled**) that runs every night at 23:59. If there is
unsaved or unpushed work, it:

1. Moves the work off `main` onto a feature branch, if needed.
2. Checks that no `.env` file or API key would be uploaded (if it finds one, it stops).
3. Writes or extends today's handoff and updates `TASKS.md`.
4. Commits, pushes, and opens a **draft** PR (or updates the existing one).
5. Sends you a notification with the PR link.

It **never** merges, deletes, force-pushes, or touches someone else's branch.
If anything looks risky (a conflict, a secret, an error) it stops and tells you.

The app must be open, and the computer awake. If the app was closed at 23:59,
the task runs the next time you open it.

## 6. Golden rules

1. Never commit to `main`. Always use a branch.
2. Never commit `.env` or API keys. `.gitignore` blocks `.env`; don't fight it.
3. One person's Claude edits at a time. If you both work alone on the same day,
   pick different tasks (and so, different files).
4. Pull before you start, push before you stop.
5. A human reviews and merges every PR.

## 7. When something goes wrong

| What you see | What to do |
|---|---|
| "rejected … fetch first" on push | Someone pushed to the same branch. Ask Claude: "pull and fix it". |
| "CONFLICT" | Ask Claude: "explain the conflict and help me fix it". Never pick a side blindly. |
| You committed on `main` by accident | Don't push. Ask Claude: "move my commits to a new branch". |
| You pushed a secret | Tell the other person right away and rotate the key in the Anthropic Console. Deleting the commit is not enough. |
| `gh: command not found` | GitHub CLI isn't installed. See section 8. |

## 8. One-time setup on a new computer

Run these in a terminal (in the Claude app: the **Terminal** panel):

```bash
winget install --id GitHub.cli -e
```
Then close and reopen the terminal, and log in (it opens your browser):
```bash
gh auth login
```
Pick: GitHub.com → HTTPS → Yes (use for git) → Login with a web browser.

You also need **write access** to the repo. Jerry adds you under
GitHub → Settings → Collaborators, and you accept the email invite.
