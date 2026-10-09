import type { AiCallRecord, EventRecord, Store } from "@/lib/store/types";

// Pilot measurement (ROADMAP F1–F3): how long a day of practice really takes,
// how many words, how accurate, and what the AI costs. Used by /stats so
// Jerry and quantrungvu can decide the daily load with real data.

export const ACTIVE_GAP_MINUTES = 5;
export const START_MINUTES = 1;

export type DayStats = {
  date: string;
  minutes: number;
  wordsCompleted: number;
  itemsChecked: number;
  firstTryOkShare: number | null;
  aiCalls: number;
  costUsd: number;
};

export type UserStats = {
  userId: string;
  name: string;
  days: DayStats[];
  activeDays: number;
  avgMinutesPerActiveDay: number;
  minutesPerWord: number | null;
  totalCostUsd: number;
  costPerWordUsd: number | null;
};

/**
 * Active minutes from event times: gaps of up to 5 minutes count as practice,
 * longer gaps mean the learner was away. Each burst adds 1 minute of reading.
 */
export function activeMinutes(times: number[]): number {
  const sorted = [...times].sort((a, b) => a - b);
  let total = 0;
  for (let i = 0; i < sorted.length; i++) {
    const gap = i === 0 ? Infinity : (sorted[i] - sorted[i - 1]) / 60_000;
    total += gap <= ACTIVE_GAP_MINUTES ? gap : START_MINUTES;
  }
  return Math.round(total * 10) / 10;
}

export function computeUserStats(
  userId: string,
  name: string,
  events: EventRecord[],
  calls: AiCallRecord[],
): UserStats {
  const byDate = new Map<string, EventRecord[]>();
  for (const e of events) byDate.set(e.localDate, [...(byDate.get(e.localDate) ?? []), e]);
  const callsByDate = new Map<string, AiCallRecord[]>();
  for (const c of calls) {
    const date = c.createdAt.slice(0, 10);
    callsByDate.set(date, [...(callsByDate.get(date) ?? []), c]);
  }
  const dates = [...new Set([...byDate.keys(), ...callsByDate.keys()])].sort().reverse();
  const days: DayStats[] = dates.map((date) => {
    const list = byDate.get(date) ?? [];
    const checks = list.filter((e) => e.type === "item_checked");
    const firstChecks = checks.filter((e) => e.meta.firstCheck === true);
    const firstOk = firstChecks.filter((e) => e.meta.structureOk === true && e.meta.major !== true);
    const dayCalls = callsByDate.get(date) ?? [];
    return {
      date,
      minutes: activeMinutes(list.map((e) => Date.parse(e.createdAt))),
      wordsCompleted: list.filter((e) => e.type === "word_completed").length,
      itemsChecked: checks.length,
      firstTryOkShare: firstChecks.length ? firstOk.length / firstChecks.length : null,
      aiCalls: dayCalls.length,
      costUsd: dayCalls.reduce((sum, c) => sum + c.costUsd, 0),
    };
  });
  const active = days.filter((d) => d.minutes > 0);
  const minutes = active.reduce((s, d) => s + d.minutes, 0);
  const words = days.reduce((s, d) => s + d.wordsCompleted, 0);
  const cost = days.reduce((s, d) => s + d.costUsd, 0);
  return {
    userId,
    name,
    days,
    activeDays: active.length,
    avgMinutesPerActiveDay: active.length ? Math.round((minutes / active.length) * 10) / 10 : 0,
    minutesPerWord: words ? Math.round((minutes / words) * 10) / 10 : null,
    totalCostUsd: cost,
    costPerWordUsd: words ? cost / words : null,
  };
}

export async function getStats(store: Store, now: Date, days = 14): Promise<UserStats[]> {
  const since = new Date(now.getTime() - days * 86_400_000).toISOString();
  const [events, calls, users] = await Promise.all([store.listEvents(since), store.listAiCalls(since), store.listUsers()]);
  const names = new Map(users.map((u) => [u.userId, u.name]));
  const ids = new Set([...events.map((e) => e.userId), ...calls.map((c) => c.userId), ...users.map((u) => u.userId)]);
  return [...ids].map((id) =>
    computeUserStats(
      id,
      names.get(id) ?? id.slice(0, 8),
      events.filter((e) => e.userId === id),
      calls.filter((c) => c.userId === id),
    ),
  );
}
