# Handoff 2026-11-04 (Jerry)

Branch: `feature/chat-teaser-jerryhacam`

## 1. Changes
- `src/components/AskFrench.tsx`: a small speech bubble with a joke pops up
  above the round chat button. It appears 6 s after a page opens, hides by
  itself after 10 s, and shows at most once every 15 min (time remembered in
  the browser's localStorage, key `askTeaserShownAt`). Tapping the joke opens
  the chat; the × hides it; opening the chat also hides it.
- `src/components/askTeasers.ts` (new): the list of 10 jokes and
  `pickTeaser()`. **Claude draft for Jerry**, edit freely.
- `src/components/askTeasers.test.ts` (new): jokes are unique, not empty, and
  at most 70 characters (longer ones would cover too much of a phone screen).
- `TASKS.md`: new review/check tasks, removed lines for PRs already merged
  (#16, #17, #20) and the chat phone test (done).

## 2. What I did
Jerry tested the "Ask about French" chat on the phone: the jokes stay varied,
the bubble doesn't cover the Send button, and the 🔊 voice now sounds French.
Then Jerry wanted the chat button to sometimes pop up a short line, like the
"Can I help you?" bubble on other websites, but as a joke, so learners know
the chat is there to help. The jokes are a fixed list (no AI, so no cost and
no AI checks used). Checked in a phone-size browser: the first version sat to
the left of the button and covered the **Check** button on the practice page,
so it now sits above the chat button instead.

## 3. To do next
- [ ] quantrungvu: review and merge this PR
- [ ] Jerry: after deploy, check the joke bubble on the phone
- [ ] Jerry: edit the jokes in `src/components/askTeasers.ts` if you want
      (keep each under 70 characters, the test checks it)

## 4. Notes
- The bubble covers the right part of the writing box for those 10 s on a
  phone. The × hides it at once.
- To see it again while testing, clear the site data, or open a private window
  (it only shows once per 15 min).
- Timings are named constants at the top of `AskFrench.tsx`
  (`TEASER_DELAY_MS`, `TEASER_SHOW_MS`, `TEASER_GAP_MS`).
- `npm run check` and `npm run build` pass (123 tests).
