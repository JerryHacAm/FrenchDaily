import type { Pos, Structure } from "@/lib/content/types";
import { shuffle, type Rng } from "./random";

// Picks the 3 sentence structures for one word (README 3.3):
// 2 statements + 1 question, all different, matching the word's part of
// speech and the learner's level, avoiding recently used ones when possible.
// Picked by code, never by AI.

export type PickedTemplates = [Structure, Structure, Structure];

function candidates(
  structures: Structure[],
  type: Structure["type"],
  pos: Pos,
  level: number,
): Structure[][] {
  // Groups in order of preference: exact level, then lower levels (nearest
  // first), then any template of this type at the level (pos ignored).
  const fits = structures.filter((s) => s.type === type && s.fits_pos.includes(pos));
  const groups: Structure[][] = [fits.filter((s) => s.level === level)];
  for (let l = level - 1; l >= 1; l--) groups.push(fits.filter((s) => s.level === l));
  groups.push(structures.filter((s) => s.type === type && s.level <= level));
  return groups;
}

function pick(
  groups: Structure[][],
  count: number,
  recent: Set<string>,
  taken: Set<string>,
  rng: Rng,
): Structure[] {
  const out: Structure[] = [];
  // First pass avoids recent templates; second pass allows them.
  for (const allowRecent of [false, true]) {
    for (const group of groups) {
      for (const s of shuffle(group, rng)) {
        if (out.length === count) return out;
        if (taken.has(s.id) || (!allowRecent && recent.has(s.id))) continue;
        out.push(s);
        taken.add(s.id);
      }
    }
  }
  return out;
}

export function pickTemplates(
  structures: Structure[],
  pos: Pos,
  level: number,
  recentTemplateIds: string[],
  rng: Rng,
): PickedTemplates {
  const recent = new Set(recentTemplateIds);
  const taken = new Set<string>();
  const statements = pick(candidates(structures, "statement", pos, level), 2, recent, taken, rng);
  const questions = pick(candidates(structures, "question", pos, level), 1, recent, taken, rng);
  if (statements.length < 2 || questions.length < 1) {
    throw new Error(`Not enough sentence templates for ${pos} at level ${level}`);
  }
  return [statements[0], statements[1], questions[0]];
}

/** The example sentence to show for this template and part of speech. */
export function exampleFor(s: Structure, pos: Pos): string | null {
  const ex = s.examples[pos] ?? Object.values(s.examples)[0];
  return ex ? ex[1] : null;
}

/** First words of the example, as a "sentence starter" for level 1. */
export function starterFor(s: Structure, pos: Pos): string | null {
  const ex = exampleFor(s, pos);
  if (!ex) return null;
  const words = ex.split(/\s+/);
  return words.slice(0, Math.min(2, words.length - 1)).join(" ") + " …";
}
