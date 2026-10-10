import { addDays } from "./dates";
import type { UserWord } from "./state";

// Spaced repetition with simple Leitner boxes (README 3.5).
// Box 1 → review after 1 day, box 5 → after 30 days.
export const BOX_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;
export const MAX_BOX = BOX_INTERVALS_DAYS.length;

export function dueDateFor(box: number, today: string): string {
  const b = Math.min(Math.max(box, 1), MAX_BOX);
  return addDays(today, BOX_INTERVALS_DAYS[b - 1]);
}

export function newUserWord(wordId: string, today: string): UserWord {
  return {
    wordId,
    introducedOn: today,
    box: 1,
    dueOn: dueDateFor(1, today),
    timesSeen: 0,
    lastSeenOn: today,
    completedCount: 0,
    selfUseCount: 0,
    lastSelfUseOn: null,
    lastBoxMoveOn: null,
    tags: {},
  };
}

export function isDue(uw: UserWord, today: string): boolean {
  return uw.dueOn <= today;
}

/**
 * After all 3 items of a word are accepted: no major mistake → move up one
 * box; any major mistake → back to box 1.
 */
export function applyWordCompletion(uw: UserWord, hadMajorMistake: boolean, today: string): UserWord {
  const box = hadMajorMistake ? 1 : Math.min(uw.box + 1, MAX_BOX);
  return {
    ...uw,
    box,
    dueOn: dueDateFor(box, today),
    completedCount: uw.completedCount + 1,
    lastSeenOn: today,
    lastBoxMoveOn: today,
  };
}

/**
 * The learner used this word on their own in a correct sentence. That counts
 * as a review if the word was due (at most one box move per day). If it was
 * not due, it only counts as usage, so spacing stays honest.
 */
export function applySelfUse(uw: UserWord, today: string): UserWord {
  const next: UserWord = { ...uw, selfUseCount: uw.selfUseCount + 1, lastSelfUseOn: today };
  if (isDue(uw, today) && uw.lastBoxMoveOn !== today) {
    const box = Math.min(uw.box + 1, MAX_BOX);
    next.box = box;
    next.dueOn = dueDateFor(box, today);
    next.lastBoxMoveOn = today;
  }
  return next;
}
