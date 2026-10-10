import type { Content } from "@/lib/content/types";
import { displayWord } from "@/lib/content/types";
import { addDays, weekStart } from "./dates";
import { topMistakes } from "./mistakes";
import { paceLabel, recentAccuracy, type PaceLabel } from "./pacing";
import type { Rules } from "./rules";
import { getDaily, type LearnerState } from "./state";
import { visibleStreak } from "./streak";
import { quietWords, wordsYouCanUse } from "./usage";

// The numbers behind the AI coach (ROADMAP C7). Rule: code counts, AI
// explains. The coach prompt receives exactly this object and nothing else.

export type CoachStats = {
  name: string;
  level: number;
  streak: number;
  freezes: number;
  dailyGoal: number;
  completedToday: number;
  wordsSeen: number;
  wordsYouCanUse: number;
  wordsYouCanUseThisWeek: number;
  accuracyLast7Days: number | null;
  accuracyPrevious7Days: number | null;
  pace: PaceLabel;
  daysPracticedThisWeek: number;
  topMistakes: { tag: string; title: string; rule: string; last14Days: number; previous14Days: number }[];
  quietWords: string[];
};

function accuracyBetween(state: LearnerState, from: string, to: string): number | null {
  const items = state.recentItems.filter((i) => i.date >= from && i.date <= to);
  if (items.length < 3) return null;
  return items.filter((i) => i.firstTryOk).length / items.length;
}

export function coachStats(state: LearnerState, content: Content, today: string, rules: Rules): CoachStats {
  const usable = wordsYouCanUse(state);
  const weekAgo = addDays(today, -6);
  const monday = weekStart(today);
  const daysThisWeek = Object.entries(state.daily).filter(
    ([date, d]) => date >= monday && date <= today && d.itemsAccepted > 0,
  ).length;
  return {
    name: state.profile.name,
    level: state.profile.level,
    streak: visibleStreak(state.streak, today),
    freezes: state.streak.freezes,
    dailyGoal: rules.streakMinWords,
    completedToday: getDaily(state, today).wordsCompleted.length,
    wordsSeen: Object.keys(state.words).length,
    wordsYouCanUse: usable.length,
    wordsYouCanUseThisWeek: usable.filter((id) => (state.words[id].lastSelfUseOn ?? "") >= weekAgo).length,
    accuracyLast7Days: accuracyBetween(state, weekAgo, today),
    accuracyPrevious7Days: accuracyBetween(state, addDays(today, -13), addDays(today, -7)),
    pace: paceLabel(recentAccuracy(state.recentItems)),
    daysPracticedThisWeek: daysThisWeek,
    topMistakes: topMistakes(state, today)
      .filter((t) => t.count > 0)
      .slice(0, 3)
      .map((t) => {
        const rule = content.ruleById.get(t.tag);
        return {
          tag: t.tag,
          title: rule?.title ?? "Other mistakes",
          rule: rule?.rule ?? "",
          last14Days: t.count,
          previous14Days: t.previous,
        };
      }),
    quietWords: quietWords(state, today, rules)
      .slice(0, 5)
      .map((id) => {
        const w = content.wordById.get(id);
        return w ? displayWord(w) : id;
      }),
  };
}

/** A coach note written by code, used when the AI is unavailable or there is no data yet. */
export function fallbackCoachNote(stats: CoachStats): { headline: string; message: string; focusTag: string | null; actionLabel: string } {
  const top = stats.topMistakes[0];
  if (top) {
    return {
      headline: `Focus: ${top.title}`,
      message: `You made this mistake ${top.last14Days} time${top.last14Days === 1 ? "" : "s"} in the last 2 weeks. ${top.rule}`,
      focusTag: top.tag,
      actionLabel: `Practise ${top.title.toLowerCase()}`,
    };
  }
  if (stats.quietWords.length) {
    return {
      headline: "Bring back your quiet words",
      message: `Try using ${stats.quietWords.slice(0, 3).join(", ")} in your next sentences.`,
      focusTag: null,
      actionLabel: "Practise now",
    };
  }
  return {
    headline: "Keep going",
    message: `Finish ${stats.dailyGoal} words today to keep your streak.`,
    focusTag: null,
    actionLabel: "Practise now",
  };
}
