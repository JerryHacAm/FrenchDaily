import type { Content, Word } from "@/lib/content/types";
import { daysBetween } from "./dates";
import { wordsWithTag } from "./mistakes";
import { newWordQuota, recentAccuracy } from "./pacing";
import { shuffle, type Rng } from "./random";
import type { BatchReason, LearnerState } from "./state";
import type { Rules } from "./rules";
import { quietWords } from "./usage";

// Chooses the words for the next practice batch (README 3.1 + ROADMAP C1, C4, C5).
// Order of priority:
//   1. reviews that are due (spaced repetition)
//   2. one quiet word (learned but never used on the learner's own)
//   3. new words; how many depends on recent accuracy (adaptive pace)
//   4. if accuracy is low: weak words (box 1) instead of more new words
//   5. anything left: more new words, then the least recently seen words
// Words are chosen by code, never by AI.

export const TOP_CANDIDATES = 8;

export type PlannedWord = { wordId: string; reason: BatchReason };
export type BatchPlan = {
  words: PlannedWord[];
  theme: { current: string; startedOn: string } | null;
};

/** Keeps a theme for `themeDays`, then moves to the next theme with unseen words. */
export function chooseTheme(
  state: LearnerState,
  content: Content,
  level: number,
  today: string,
  rules: Rules,
): { current: string; startedOn: string } | null {
  const unseenIn = (theme: string) =>
    content.words.some((w) => w.theme === theme && w.level <= level && !state.words[w.id]);
  const current = state.theme;
  if (current && daysBetween(current.startedOn, today) < rules.themeDays && unseenIn(current.current)) {
    return current;
  }
  const order = content.themes;
  const start = current ? order.indexOf(current.current) + 1 : 0;
  for (let i = 0; i < order.length; i++) {
    const theme = order[(start + i) % order.length];
    if (unseenIn(theme)) {
      return theme === current?.current && current ? current : { current: theme, startedOn: today };
    }
  }
  return current;
}

/** Unseen words for this level, preferring the theme, then by frequency. */
export function pickNewWords(
  content: Content,
  state: LearnerState,
  level: number,
  theme: string | null,
  count: number,
  exclude: Set<string>,
  rng: Rng,
): string[] {
  if (count <= 0) return [];
  const unseen = content.words.filter((w) => !state.words[w.id] && !exclude.has(w.id));
  // Level preference: exact level, then lower levels (nearest first), then one level up.
  const levelOrder = [level];
  for (let l = level - 1; l >= 1; l--) levelOrder.push(l);
  levelOrder.push(level + 1);

  const ordered: Word[] = [];
  for (const l of levelOrder) {
    const atLevel = unseen.filter((w) => w.level === l);
    const inTheme = atLevel.filter((w) => w.theme === theme);
    const rest = atLevel.filter((w) => w.theme !== theme);
    for (const group of [inTheme, rest]) {
      const byFreq = [...group].sort((a, b) => a.frequency_rank - b.frequency_rank);
      // Random only inside a controlled pool: shuffle the most frequent few.
      ordered.push(...shuffle(byFreq.slice(0, TOP_CANDIDATES), rng), ...byFreq.slice(TOP_CANDIDATES));
    }
  }

  const chosen: Word[] = [];
  const need = (pos: Word["pos"]) => count >= 2 && !chosen.some((w) => w.pos === pos);
  // Part-of-speech mix: try to include at least one noun and one verb.
  for (const pos of ["noun", "verb"] as const) {
    if (chosen.length < count && need(pos)) {
      const w = ordered.find((x) => x.pos === pos && !chosen.includes(x));
      if (w) chosen.push(w);
    }
  }
  for (const w of ordered) {
    if (chosen.length >= count) break;
    if (!chosen.includes(w)) chosen.push(w);
  }
  return chosen.map((w) => w.id);
}

export function planBatch(
  state: LearnerState,
  content: Content,
  rules: Rules,
  today: string,
  rng: Rng,
  options: { focusTag?: string | null } = {},
): BatchPlan {
  const level = state.profile.level;
  const size = rules.batchSize;
  const theme = chooseTheme(state, content, level, today, rules);
  const picked: PlannedWord[] = [];
  const used = new Set<string>();
  const add = (wordId: string, reason: BatchReason) => {
    if (picked.length < size && !used.has(wordId) && content.wordById.has(wordId)) {
      picked.push({ wordId, reason });
      used.add(wordId);
    }
  };

  // "Practise this" from the coach: words that had this mistake, then new
  // words of a kind that trains the rule.
  if (options.focusTag) {
    for (const id of wordsWithTag(state, options.focusTag)) add(id, "focus");
    const rule = content.ruleById.get(options.focusTag);
    if (picked.length < size && rule) {
      const extra = content.words.filter(
        (w) => !state.words[w.id] && rule.focus_pos.includes(w.pos) && w.level <= level + 1,
      );
      const ids = pickNewWords(
        { ...content, words: extra },
        state,
        level,
        theme?.current ?? null,
        size - picked.length,
        used,
        rng,
      );
      for (const id of ids) add(id, "focus");
    }
    if (picked.length > 0) return { words: picked, theme };
  }

  const seen = Object.values(state.words);

  // 1. Due reviews: most overdue first, then lowest box.
  seen
    .filter((w) => w.dueOn <= today && w.lastSeenOn !== today)
    .sort((a, b) => (a.dueOn === b.dueOn ? a.box - b.box : a.dueOn < b.dueOn ? -1 : 1))
    .forEach((w) => add(w.wordId, "review"));

  // 2. One quiet word.
  const quiet = quietWords(state, today, rules).find((id) => !used.has(id) && state.words[id].lastSeenOn !== today);
  if (quiet) add(quiet, "quiet");

  // 3. New words, as many as the pace allows.
  const accuracy = recentAccuracy(state.recentItems);
  const quota = Math.min(newWordQuota(accuracy, size), size - picked.length);
  for (const id of pickNewWords(content, state, level, theme?.current ?? null, quota, used, rng)) add(id, "new");

  // 4. Low accuracy: practise weak words instead of more new ones.
  if (accuracy !== null && accuracy < 0.85) {
    seen
      .filter((w) => w.box === 1 && w.lastSeenOn !== today)
      .sort((a, b) => (a.lastSeenOn < b.lastSeenOn ? -1 : 1))
      .forEach((w) => add(w.wordId, "weak"));
  }

  // 5. Fill: more new words, then least recently seen words.
  if (picked.length < size) {
    for (const id of pickNewWords(content, state, level, theme?.current ?? null, size - picked.length, used, rng)) {
      add(id, "new");
    }
  }
  if (picked.length < size) {
    seen
      .filter((w) => w.lastSeenOn !== today)
      .sort((a, b) => (a.lastSeenOn < b.lastSeenOn ? -1 : 1))
      .forEach((w) => add(w.wordId, "extra"));
  }
  return { words: picked, theme };
}
