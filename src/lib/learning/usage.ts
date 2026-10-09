import type { Content } from "@/lib/content/types";
import { displayWord } from "@/lib/content/types";
import { addDays } from "./dates";
import type { LearnerState } from "./state";
import type { Rules } from "./rules";

// "Words you can really use", quiet words and the word bank
// (ROADMAP C3, C4 — Jerry's and quantrungvu's AI ideas).

/** Words the learner has used correctly on their own at least once. */
export function wordsYouCanUse(state: LearnerState): string[] {
  return Object.values(state.words)
    .filter((w) => w.selfUseCount > 0)
    .map((w) => w.wordId);
}

/**
 * Quiet words: learned at least `quietAfterDays` ago but never used on the
 * learner's own. Oldest first. These come back as target words and are
 * highlighted in the word bank.
 */
export function quietWords(state: LearnerState, today: string, rules: Rules): string[] {
  const cutoff = addDays(today, -rules.quietAfterDays);
  return Object.values(state.words)
    .filter((w) => w.introducedOn <= cutoff && w.selfUseCount === 0 && w.completedCount > 0)
    .sort((a, b) => (a.introducedOn < b.introducedOn ? -1 : a.introducedOn > b.introducedOn ? 1 : 0))
    .map((w) => w.wordId);
}

export type WordBankEntry = {
  id: string;
  french: string;
  english: string;
  quiet: boolean;
};

/**
 * Recent words to keep on screen while writing. French shown, meaning hidden
 * until tapped (the UI does that). Quiet words first, so they get used.
 */
export function wordBank(
  state: LearnerState,
  content: Content,
  today: string,
  rules: Rules,
  excludeIds: string[] = [],
): WordBankEntry[] {
  const exclude = new Set(excludeIds);
  const quiet = new Set(quietWords(state, today, rules));
  const since = addDays(today, -rules.wordBankDays);
  const recent = Object.values(state.words)
    .filter((w) => w.introducedOn >= since && w.introducedOn < today)
    .sort((a, b) => (a.introducedOn > b.introducedOn ? -1 : 1))
    .map((w) => w.wordId);
  const ids = [...quiet, ...recent.filter((id) => !quiet.has(id))].filter((id) => !exclude.has(id));
  const out: WordBankEntry[] = [];
  for (const id of ids) {
    const w = content.wordById.get(id);
    if (!w) continue;
    out.push({ id, french: displayWord(w), english: w.english, quiet: quiet.has(id) });
    if (out.length >= rules.wordBankMax) break;
  }
  return out;
}

/** Map AI lemmas ("manger", "pomme") to word ids the learner has seen. */
export function lemmasToSeenWordIds(lemmas: string[], state: LearnerState, content: Content): string[] {
  const norm = (s: string) => s.trim().toLowerCase().normalize("NFC");
  const wanted = new Set(lemmas.map(norm));
  const out: string[] = [];
  for (const id of Object.keys(state.words)) {
    const w = content.wordById.get(id);
    if (w && wanted.has(norm(w.french))) out.push(id);
  }
  return out;
}
