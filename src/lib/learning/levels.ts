import { daysBetween } from "./dates";
import type { ItemResult } from "./state";

// Level gates (ROADMAP C6). Move up on proven accuracy at the current level,
// move down when the level is clearly too hard. Never more often than once a
// week, so one bad day doesn't bounce the learner around.
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;
export const UP_WINDOW = 30;
export const UP_ACCURACY = 0.85;
export const DOWN_WINDOW = 20;
export const DOWN_ACCURACY = 0.5;
export const MIN_DAYS_BETWEEN_CHANGES = 7;

export type LevelDecision = { action: "up" | "down" | "stay"; newLevel: number; message: string | null };

export function decideLevel(
  items: ItemResult[],
  level: number,
  today: string,
  levelChangedOn: string | null,
): LevelDecision {
  const stay: LevelDecision = { action: "stay", newLevel: level, message: null };
  if (levelChangedOn && daysBetween(levelChangedOn, today) < MIN_DAYS_BETWEEN_CHANGES) return stay;

  const atLevel = items.filter((i) => i.level === level);
  const share = (list: ItemResult[]) => list.filter((i) => i.firstTryOk).length / list.length;

  if (level < MAX_LEVEL && atLevel.length >= UP_WINDOW) {
    const acc = share(atLevel.slice(-UP_WINDOW));
    if (acc >= UP_ACCURACY) {
      return {
        action: "up",
        newLevel: level + 1,
        message: `Great work: ${Math.round(acc * 100)}% of your last ${UP_WINDOW} sentences were right first time. You moved up to level ${level + 1}!`,
      };
    }
  }
  if (level > MIN_LEVEL && atLevel.length >= DOWN_WINDOW) {
    const acc = share(atLevel.slice(-DOWN_WINDOW));
    if (acc < DOWN_ACCURACY) {
      return {
        action: "down",
        newLevel: level - 1,
        message: `Level ${level} was a big jump, so we moved you to level ${level - 1} for now. You'll move up again when it feels easy.`,
      };
    }
  }
  return stay;
}
