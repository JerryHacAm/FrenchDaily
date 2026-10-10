import { describe, expect, it } from "vitest";
import { word } from "@/test/fixtures";
import { codeCheck } from "./checks";
import { decideLevel } from "./levels";
import { newWordQuota, recentAccuracy } from "./pacing";
import { TEST_RULES } from "./rules";
import { applySelfUse, applyWordCompletion, dueDateFor, isDue, newUserWord } from "./srs";
import type { ItemResult, StreakState } from "./state";
import { recordStreakDay, rollStreak, visibleStreak } from "./streak";

describe("spaced repetition boxes", () => {
  it("moves up one box without major mistakes, back to box 1 with one", () => {
    let uw = newUserWord("w0001", "2026-10-01");
    expect(uw.dueOn).toBe("2026-10-02");
    uw = applyWordCompletion(uw, false, "2026-10-01");
    expect([uw.box, uw.dueOn]).toEqual([2, "2026-10-04"]);
    uw = applyWordCompletion(uw, false, "2026-10-04");
    expect([uw.box, uw.dueOn]).toEqual([3, "2026-10-11"]);
    uw = applyWordCompletion(uw, true, "2026-10-11");
    expect([uw.box, uw.dueOn]).toEqual([1, "2026-10-12"]);
    expect(uw.completedCount).toBe(3);
  });

  it("never goes above box 5 (30 days)", () => {
    let uw = { ...newUserWord("w0001", "2026-10-01"), box: 5 };
    uw = applyWordCompletion(uw, false, "2026-10-01");
    expect([uw.box, uw.dueOn]).toEqual([5, dueDateFor(5, "2026-10-01")]);
  });

  it("counts using a word on your own as a review only when it is due, once a day", () => {
    const due = { ...newUserWord("w0001", "2026-10-01"), box: 1, dueOn: "2026-10-02" };
    const used = applySelfUse(due, "2026-10-02");
    expect([used.box, used.selfUseCount, used.dueOn]).toEqual([2, 1, "2026-10-05"]);
    const again = applySelfUse(used, "2026-10-02");
    expect([again.box, again.selfUseCount]).toEqual([2, 2]);
    expect(isDue(again, "2026-10-04")).toBe(false);
    expect(applySelfUse(again, "2026-10-04").box).toBe(2); // not due: usage only
  });
});

describe("streaks", () => {
  const empty: StreakState = { current: 0, longest: 0, freezes: 0, lastCompletedDate: null, frozenDates: [] };

  it("grows on consecutive days and restarts after a gap", () => {
    let s = recordStreakDay(empty, "2026-10-01").streak;
    s = recordStreakDay(s, "2026-10-02").streak;
    s = recordStreakDay(s, "2026-10-02").streak; // same day twice: no change
    expect(s.current).toBe(2);
    s = recordStreakDay(s, "2026-10-05").streak;
    expect([s.current, s.longest]).toEqual([1, 2]);
  });

  it("earns a freeze every 7 days, at most 2", () => {
    let s = empty;
    const notices: string[] = [];
    for (let d = 1; d <= 21; d++) {
      const r = recordStreakDay(s, `2026-10-${String(d).padStart(2, "0")}`);
      s = r.streak;
      notices.push(...r.notices);
    }
    expect(s.current).toBe(21);
    expect(s.freezes).toBe(2);
    expect(notices).toHaveLength(2);
  });

  it("uses a freeze for one missed day and tells the learner", () => {
    const s: StreakState = { ...empty, current: 8, longest: 8, freezes: 1, lastCompletedDate: "2026-10-05" };
    const r = rollStreak(s, "2026-10-07"); // missed the 6th
    expect(r.streak.current).toBe(8);
    expect(r.streak.freezes).toBe(0);
    expect(r.streak.frozenDates).toEqual(["2026-10-06"]);
    expect(r.notices[0]).toMatch(/freeze saved your 8-day streak/);
    expect(recordStreakDay(r.streak, "2026-10-07").streak.current).toBe(9);
  });

  it("resets when more days are missed than freezes, and keeps the freezes", () => {
    const s: StreakState = { ...empty, current: 8, freezes: 1, lastCompletedDate: "2026-10-05" };
    const r = rollStreak(s, "2026-10-09");
    expect([r.streak.current, r.streak.freezes]).toEqual([0, 1]);
    expect(visibleStreak(s, "2026-10-09")).toBe(0);
    expect(visibleStreak(s, "2026-10-06")).toBe(8);
  });
});

describe("adaptive pace", () => {
  const items = (ok: boolean[]): ItemResult[] => ok.map((firstTryOk) => ({ date: "2026-10-01", level: 1, firstTryOk, major: !firstTryOk }));

  it("needs a few items before judging", () => {
    expect(recentAccuracy(items([true, true]))).toBeNull();
    expect(newWordQuota(null, 5)).toBe(2);
  });

  it("gives fewer new words when accuracy is low", () => {
    expect(newWordQuota(recentAccuracy(items([false, false, true, false, false, true])), 5)).toBe(1);
    expect(newWordQuota(recentAccuracy(items([true, true, false, true, true, false])), 5)).toBe(2);
    expect(newWordQuota(recentAccuracy(items([true, true, true, true, true, true])), 5)).toBe(5);
  });
});

describe("level gates", () => {
  const items = (n: number, ok: number, level = 1): ItemResult[] =>
    Array.from({ length: n }, (_, i) => ({ date: "2026-10-01", level, firstTryOk: i < ok, major: i >= ok }));

  it("moves up after 30 items at 85%+", () => {
    expect(decideLevel(items(30, 26), 1, "2026-10-20", null).action).toBe("up");
    expect(decideLevel(items(30, 24), 1, "2026-10-20", null).action).toBe("stay");
    expect(decideLevel(items(29, 29), 1, "2026-10-20", null).action).toBe("stay");
  });

  it("moves down after 20 items under 50%, but never below 1", () => {
    expect(decideLevel(items(20, 8, 2), 2, "2026-10-20", null).newLevel).toBe(1);
    expect(decideLevel(items(20, 0, 1), 1, "2026-10-20", null).action).toBe("stay");
  });

  it("waits a week between changes", () => {
    expect(decideLevel(items(30, 30), 1, "2026-10-20", "2026-10-15").action).toBe("stay");
    expect(decideLevel(items(30, 30), 1, "2026-10-22", "2026-10-15").action).toBe("up");
  });
});

describe("code checks before the AI", () => {
  const base = { word: word("w0001"), itemType: "statement" as const, level: 2 };

  it("accepts a good sentence and tidies spaces", () => {
    expect(codeCheck({ ...base, sentence: "  Je mange une pomme   au marché le matin. " }, TEST_RULES)).toEqual({
      ok: true,
      sentence: "Je mange une pomme au marché le matin.",
    });
  });

  it.each([
    ["", "Write a sentence first."],
    ["Je mange une pomme.", "Use at least 6 words"],
    ["Je mange une banane au marché le matin.", 'Use the word "la pomme"'],
    ["Je mange une pomme au marché le matin ?", "normal sentence, not a question"],
  ])("rejects %j", (sentence, message) => {
    const r = codeCheck({ ...base, sentence }, TEST_RULES);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain(message);
  });

  it("asks for a question mark on questions, and needs fewer words at level 1", () => {
    const q = codeCheck({ ...base, level: 1, itemType: "question", sentence: "Tu aimes les pommes" }, TEST_RULES);
    expect(q.ok).toBe(false);
    expect(codeCheck({ ...base, level: 1, itemType: "question", sentence: "Tu aimes les pommes ?" }, TEST_RULES).ok).toBe(true);
  });

  it("rejects very long text", () => {
    const r = codeCheck({ ...base, sentence: "Je mange une pomme " + "très ".repeat(60) }, TEST_RULES);
    expect(r.ok).toBe(false);
  });
});
