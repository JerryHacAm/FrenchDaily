# Handoff 2026-11-02 (Jerry)

Branch: `feature/template-fit-jerryhacam`

## 1. Changes
- `src/lib/learning/templates.ts`: the template picker no longer falls back to
  templates made for another part of speech. If all fitting templates are
  recent, it repeats one. Removed `starterFor()`.
- `src/lib/learning/view.ts`, `src/app/practice/PracticeClient.tsx`: removed
  the level-1 "Start like this" line from the practice screen.
- `src/lib/learning/picker.test.ts`: regression test (verb with all verb
  templates recent must still get verb templates). Fails on the old code.
- `src/lib/content/content.test.ts`: every word at every level must get
  templates whose `fits_pos` includes its part of speech, with an example.
- `DECISIONS.md`: new entry, no "Start like this" starter.
- `TASKS.md`: done line for these fixes.

## 2. What I did
Fixed two bugs Jerry found on the phone. (1) "Start like this" copied the first
words of the template's example, which is about a sample word, so *boire*
showed "Je mange …". Jerry chose to remove it. (2) Words sometimes got a
structure made for another word type (*manger* got "Subject + être + adjective",
and "vouloir + noun"). Cause: the app remembers the last 20 templates, a verb
has only 5 level-1 statement templates, and avoiding "recent" ones was ranked
above matching the word type. Now matching the word type always wins.

## 3. To do next
- [ ] quantrungvu: review and merge this PR
- [ ] Jerry: after deploy, do a full batch at level 1 on the phone and check
      every structure fits the word (words already in an open batch keep
      their old templates)
- [ ] Decide whether to add a reports list to the Pilot stats page (reports
      are only visible in Supabase → Table Editor → `reports` for now)

## 4. Notes
- Feedback reports ("Report it") are saved in the Supabase `reports` table:
  note, `context` (sentence + full AI feedback), date, `status` = `new`.
  Nothing in the app reads them yet. Locally (STORAGE=file) they are in
  `.data/store.json`.
- The picker can still pick a lower-level template (same word type) to avoid
  repeats. That was already the design and is unchanged.
- `npm run check` and `npm run build` pass (121 tests).
