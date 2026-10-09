import { addDays, daysBetween } from "./dates";
import type { StreakState } from "./state";

// Forgiving streaks (README 3.6):
// - a streak day = at least STREAK_MIN_WORDS words completed that day
// - earn 1 freeze for every 7-day streak, bank at most 2
// - a freeze is used automatically for a missed day, and the learner is told
export const FREEZE_EVERY_DAYS = 7;
export const MAX_FREEZES = 2;

export type StreakUpdate = { streak: StreakState; notices: string[] };

/**
 * Call whenever the app opens (with the learner's local "today"). Handles the
 * days missed since the last streak day: uses freezes if there are enough,
 * otherwise resets the streak to 0 (and keeps the freezes for later).
 */
export function rollStreak(streak: StreakState, today: string): StreakUpdate {
  const last = streak.lastCompletedDate;
  if (!last || streak.current === 0) return { streak, notices: [] };
  const missed = daysBetween(last, today) - 1;
  if (missed <= 0) return { streak, notices: [] };

  if (streak.freezes >= missed) {
    const frozen: string[] = [];
    for (let i = 1; i <= missed; i++) frozen.push(addDays(last, i));
    const days = missed === 1 ? "a missed day" : `${missed} missed days`;
    return {
      streak: {
        ...streak,
        freezes: streak.freezes - missed,
        lastCompletedDate: addDays(today, -1),
        frozenDates: [...streak.frozenDates, ...frozen].slice(-30),
      },
      notices: [`A streak freeze saved your ${streak.current}-day streak (${days}).`],
    };
  }
  return {
    streak: { ...streak, current: 0 },
    notices: [`Your ${streak.current}-day streak ended. Start a new one today!`],
  };
}

/** Call when today's completed words reach the daily goal. */
export function recordStreakDay(streak: StreakState, today: string): StreakUpdate {
  if (streak.lastCompletedDate === today) return { streak, notices: [] };
  const continues = streak.lastCompletedDate === addDays(today, -1);
  const current = continues ? streak.current + 1 : 1;
  let freezes = streak.freezes;
  const notices: string[] = [];
  if (current % FREEZE_EVERY_DAYS === 0 && freezes < MAX_FREEZES) {
    freezes += 1;
    notices.push(`${current}-day streak! You earned a streak freeze (${freezes}/${MAX_FREEZES}).`);
  }
  return {
    streak: {
      ...streak,
      current,
      longest: Math.max(streak.longest, current),
      freezes,
      lastCompletedDate: today,
    },
    notices,
  };
}

/** The streak to show today (0 if it is already broken but not yet rolled). */
export function visibleStreak(streak: StreakState, today: string): number {
  if (!streak.lastCompletedDate) return 0;
  const gap = daysBetween(streak.lastCompletedDate, today);
  if (gap <= 1) return streak.current;
  return streak.freezes >= gap - 1 ? streak.current : 0;
}
