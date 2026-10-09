import { addDays } from "./dates";
import type { LearnerState } from "./state";

// Mistake counts per grammar tag (ROADMAP C2). Code counts; the AI coach only
// explains these numbers.

export function recordMistakes(
  state: LearnerState,
  tags: string[],
  wordId: string,
  today: string,
): LearnerState {
  if (tags.length === 0) return state;
  const mistakeLog = { ...state.mistakeLog };
  const words = { ...state.words };
  const uw = words[wordId] ? { ...words[wordId], tags: { ...words[wordId].tags } } : null;
  for (const tag of tags) {
    const byDate = { ...(mistakeLog[tag] ?? {}) };
    byDate[today] = (byDate[today] ?? 0) + 1;
    mistakeLog[tag] = byDate;
    if (uw) uw.tags[tag] = (uw.tags[tag] ?? 0) + 1;
  }
  if (uw) words[wordId] = uw;
  return { ...state, mistakeLog, words };
}

export type TagCount = { tag: string; count: number; previous: number };

/** Mistakes per tag in the last `days` days, compared with the period before. */
export function topMistakes(state: LearnerState, today: string, days = 14): TagCount[] {
  const start = addDays(today, -(days - 1));
  const prevStart = addDays(start, -days);
  const out: TagCount[] = [];
  for (const [tag, byDate] of Object.entries(state.mistakeLog)) {
    let count = 0;
    let previous = 0;
    for (const [date, n] of Object.entries(byDate)) {
      if (date >= start && date <= today) count += n;
      else if (date >= prevStart && date < start) previous += n;
    }
    if (count > 0 || previous > 0) out.push({ tag, count, previous });
  }
  return out.sort((a, b) => b.count - a.count || b.previous - a.previous || a.tag.localeCompare(b.tag));
}

/** Seen words whose sentences had this tag, most mistakes first. */
export function wordsWithTag(state: LearnerState, tag: string): string[] {
  return Object.values(state.words)
    .filter((w) => (w.tags[tag] ?? 0) > 0)
    .sort((a, b) => (b.tags[tag] ?? 0) - (a.tags[tag] ?? 0))
    .map((w) => w.wordId);
}
