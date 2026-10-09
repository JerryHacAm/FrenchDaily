import { coachStats, fallbackCoachNote, type CoachStats } from "@/lib/learning/coach";
import { weekStart } from "@/lib/learning/dates";
import { topMistakes } from "@/lib/learning/mistakes";
import type { CoachNote, WeeklyReport } from "@/lib/learning/state";
import { callAi, fail, load, ok, save, userMessage, type Deps, type Result } from "./common";

// The AI coach (ROADMAP C7). Code counts (coachStats), the AI explains.
// One daily note per day and one report per week are cached in the state, so
// opening the home page doesn't cost an AI call every time.

export type ProgressData = {
  stats: CoachStats;
  daily: CoachNote | null;
  weekly: WeeklyReport | null;
  mistakes: { tag: string; title: string; rule: string; wrong: string; right: string; count: number; previous: number }[];
  boxes: number[];
};

function knownFocus(tag: string, stats: CoachStats): string | null {
  return stats.topMistakes.some((m) => m.tag === tag) ? tag : null;
}

/** Today's coach note: cached, or written now (AI when there is data, code otherwise). */
export async function getDailyNote(deps: Deps): Promise<CoachNote | null> {
  const loaded = await load(deps);
  const { state, today } = loaded;
  if (!state.profile.onboarded) return null;
  if (state.coach.daily?.date === today) return state.coach.daily;

  const stats = coachStats(state, deps.content, today, deps.rules);
  let note: CoachNote;
  const hasData = state.recentItems.length >= 3;
  if (hasData) {
    try {
      const r = await callAi(deps, "coach", () => deps.ai.coachNote(stats));
      note = {
        date: today,
        headline: r.data.headline,
        message: r.data.message,
        focusTag: knownFocus(r.data.focus_tag, stats),
        actionLabel: r.data.action_label || "Practise now",
      };
    } catch {
      note = { date: today, ...fallbackCoachNote(stats) };
    }
  } else {
    note = {
      date: today,
      headline: "Welcome to French Daily",
      message: `Write sentences with ${deps.rules.streakMinWords} words today to start your streak. Your coach will spot patterns after a few sentences.`,
      focusTag: null,
      actionLabel: "Start practising",
    };
  }
  try {
    await save(deps, loaded, { ...state, coach: { ...state.coach, daily: note } });
  } catch {
    // Not saving the cached note is harmless; it will be written again.
  }
  return note;
}

export async function getProgress(deps: Deps): Promise<ProgressData> {
  const { state, today } = await load(deps);
  const stats = coachStats(state, deps.content, today, deps.rules);
  const mistakes = topMistakes(state, today, 14)
    .slice(0, 8)
    .map((t) => {
      const rule = deps.content.ruleById.get(t.tag);
      return {
        tag: t.tag,
        title: rule?.title ?? t.tag,
        rule: rule?.rule ?? "",
        wrong: rule?.wrong ?? "",
        right: rule?.right ?? "",
        count: t.count,
        previous: t.previous,
      };
    });
  const boxes = [0, 0, 0, 0, 0];
  for (const w of Object.values(state.words)) if (w.completedCount > 0) boxes[w.box - 1] += 1;
  const week = weekStart(today);
  return {
    stats,
    daily: state.coach.daily?.date === today ? state.coach.daily : null,
    weekly: state.coach.weekly?.weekStart === week ? state.coach.weekly : null,
    mistakes,
    boxes,
  };
}

/** This week's report, written by the AI from the numbers (once per week). */
export async function writeWeeklyReport(deps: Deps): Promise<Result<WeeklyReport>> {
  try {
    const loaded = await load(deps);
    const { state, today } = loaded;
    const week = weekStart(today);
    if (state.coach.weekly?.weekStart === week) return ok(state.coach.weekly);
    if (state.recentItems.length < 3) return fail("Practise a little first: the report needs a few sentences.");
    const stats = coachStats(state, deps.content, today, deps.rules);
    const r = await callAi(deps, "weekly", () => deps.ai.weeklyReport(stats));
    const report: WeeklyReport = {
      weekStart: week,
      summary: r.data.summary,
      wins: r.data.wins.slice(0, 3),
      focusTag: knownFocus(r.data.focus_tag, stats),
      focusReason: r.data.focus_reason,
      nextSteps: r.data.next_steps.slice(0, 3),
    };
    await save(deps, loaded, { ...state, coach: { ...state.coach, weekly: report } });
    return ok(report);
  } catch (err) {
    return fail(userMessage(err));
  }
}
