import { describe, expect, it } from "vitest";
import { onboardedState, REAL_CONTENT, withWords } from "@/test/fixtures";
import { recordMistakes, topMistakes, wordsWithTag } from "./mistakes";
import { chooseTheme, planBatch } from "./picker";
import { seededRng } from "./random";
import { TEST_RULES } from "./rules";
import { pickTemplates } from "./templates";
import { nbLines } from "./view";
import { lemmasToSeenWordIds, quietWords, wordBank, wordsYouCanUse } from "./usage";

const today = "2026-10-10";

describe("planBatch (word picker)", () => {
  it("gives a new learner a full batch of new words: level 1, first theme, a noun and a verb", () => {
    const plan = planBatch(onboardedState(), REAL_CONTENT, TEST_RULES, today, seededRng(1));
    expect(plan.words).toHaveLength(TEST_RULES.batchSize);
    expect(plan.words.every((p) => p.reason === "new")).toBe(true);
    const words = plan.words.map((p) => REAL_CONTENT.wordById.get(p.wordId)!);
    expect(words.every((w) => w.level === 1)).toBe(true);
    expect(new Set(words.map((w) => w.pos)).has("noun")).toBe(true);
    expect(new Set(words.map((w) => w.pos)).has("verb")).toBe(true);
    expect(plan.theme?.current).toBe("food");
  });

  it("gives level 3, 4 and 5 learners words of their own level, each with templates of that level", () => {
    for (const level of [3, 4, 5]) {
      const plan = planBatch(onboardedState(level), REAL_CONTENT, TEST_RULES, today, seededRng(level));
      expect(plan.words).toHaveLength(TEST_RULES.batchSize);
      const words = plan.words.map((p) => REAL_CONTENT.wordById.get(p.wordId)!);
      expect(words.every((w) => w.level === level)).toBe(true);
      expect(new Set(words.map((w) => w.pos)).has("verb")).toBe(true);
      for (const w of words) {
        const t = pickTemplates(REAL_CONTENT.structures, w.pos, level, [], seededRng(1));
        expect(t.every((s) => s.level === level)).toBe(true);
      }
    }
  });

  it("puts due reviews first", () => {
    let s = withWords(onboardedState(), ["w0023", "w0025"], "2026-10-01", { dueOn: "2026-10-09", lastSeenOn: "2026-10-08" });
    s = withWords(s, ["w0027"], "2026-10-01", { dueOn: "2026-10-20", lastSeenOn: "2026-10-08", selfUseCount: 1 });
    const plan = planBatch(s, REAL_CONTENT, TEST_RULES, today, seededRng(1));
    expect(plan.words.slice(0, 2).map((p) => p.reason)).toEqual(["review", "review"]);
    expect(plan.words.map((p) => p.wordId)).not.toContain("w0027");
  });

  it("brings back one quiet word", () => {
    const s = withWords(onboardedState(), ["w0183"], "2026-10-01", { dueOn: "2026-10-30", lastSeenOn: "2026-10-02" });
    const plan = planBatch(s, REAL_CONTENT, TEST_RULES, today, seededRng(1));
    expect(plan.words.find((p) => p.wordId === "w0183")?.reason).toBe("quiet");
  });

  it("gives fewer new words and practises weak ones when accuracy is low", () => {
    let s = withWords(onboardedState(), ["w0001", "w0002", "w0003"], "2026-10-08", {
      box: 1,
      dueOn: "2026-10-30",
      lastSeenOn: "2026-10-08",
      selfUseCount: 1,
    });
    s = { ...s, recentItems: Array.from({ length: 10 }, (_, i) => ({ date: today, level: 1, firstTryOk: i < 3, major: i >= 3 })) };
    const plan = planBatch(s, REAL_CONTENT, TEST_RULES, today, seededRng(1));
    // accuracy 30% → quota of 1 new word, then 3 weak words, then the batch is filled with 1 more new word
    expect(plan.words.filter((p) => p.reason === "new")).toHaveLength(2);
    expect(plan.words.filter((p) => p.reason === "weak")).toHaveLength(3);
  });

  it("practises a grammar focus with words that had that mistake", () => {
    let s = withWords(onboardedState(), ["w0001", "w0002"], "2026-10-01", { lastSeenOn: "2026-10-05" });
    s = recordMistakes(s, ["article-gender", "article-gender"], "w0002", "2026-10-05");
    s = recordMistakes(s, ["article-gender"], "w0001", "2026-10-05");
    const plan = planBatch(s, REAL_CONTENT, TEST_RULES, today, seededRng(1), { focusTag: "article-gender" });
    expect(plan.words.slice(0, 2).map((p) => p.wordId)).toEqual(["w0002", "w0001"]);
    expect(plan.words.every((p) => p.reason === "focus")).toBe(true);
    expect(plan.words.every((p) => REAL_CONTENT.wordById.get(p.wordId)!.pos === "noun")).toBe(true);
  });

  it("borrows an unseen verb from basics when the theme has none left", () => {
    const foodVerbs = REAL_CONTENT.words.filter((w) => w.theme === "food" && w.level === 1 && w.pos === "verb").map((w) => w.id);
    let s = withWords(onboardedState(), foodVerbs, "2026-10-09", { dueOn: "2027-01-01" });
    s = { ...s, theme: { current: "food", startedOn: today } };
    // A very common verb from another theme must not win over basics.
    const words = REAL_CONTENT.words.map((w) =>
      w.pos === "verb" && w.level === 1 && w.theme === "travel" ? { ...w, frequency_rank: 0 } : w,
    );
    const content = { ...REAL_CONTENT, words };
    for (let seed = 1; seed <= 10; seed++) {
      const plan = planBatch(s, content, TEST_RULES, today, seededRng(seed));
      const verbs = plan.words
        .filter((p) => p.reason === "new")
        .map((p) => REAL_CONTENT.wordById.get(p.wordId)!)
        .filter((w) => w.pos === "verb");
      expect(verbs[0]).toMatchObject({ theme: "basics", level: 1 });
    }
  });

  it("moves to the next theme after themeDays", () => {
    const s = { ...onboardedState(), theme: { current: "food", startedOn: "2026-10-01" } };
    expect(chooseTheme(s, REAL_CONTENT, 1, "2026-10-05", TEST_RULES)?.current).toBe("food");
    expect(chooseTheme(s, REAL_CONTENT, 1, "2026-10-08", TEST_RULES)).toEqual({ current: "home", startedOn: "2026-10-08" });
  });
});

describe("word page N.B. (other meanings)", () => {
  it("always shows an N.B.-only meaning, and a linked one after the other entry was seen", () => {
    const sale = REAL_CONTENT.wordById.get("w0039")!; // N.B. only
    expect(nbLines(sale, onboardedState(), REAL_CONTENT)).toEqual([sale.other_meanings![0].nb]);
    const time = REAL_CONTENT.wordById.get("w0319")!; // temps = time, linked to temps = weather (w0235)
    expect(nbLines(time, onboardedState(), REAL_CONTENT)).toEqual([]);
    const seen = withWords(onboardedState(), ["w0235"], "2026-10-01");
    expect(nbLines(time, seen, REAL_CONTENT)).toEqual(["You learned 'temps' = weather. Here it means time."]);
  });
});

describe("templates", () => {
  it("picks 2 different statements and 1 question that fit the word", () => {
    const t = pickTemplates(REAL_CONTENT.structures, "verb", 2, [], seededRng(3));
    expect(new Set(t.map((x) => x.id)).size).toBe(3);
    expect(t.every((x) => x.fits_pos.includes("verb") && x.level === 2)).toBe(true);
  });

  it("avoids recently used templates when it can", () => {
    const first = pickTemplates(REAL_CONTENT.structures, "noun", 1, [], seededRng(5));
    const second = pickTemplates(REAL_CONTENT.structures, "noun", 1, first.map((x) => x.id), seededRng(5));
    expect(second.some((x) => first.map((f) => f.id).includes(x.id))).toBe(false);
  });

  it("repeats a recent template rather than use one made for another part of speech", () => {
    // Bug: once every level-1 verb template was recent, "manger" got
    // "Subject + être + adjective" (adjective only).
    const verbTemplatesSeen = REAL_CONTENT.structures.filter((s) => s.fits_pos.includes("verb")).map((s) => s.id);
    for (let seed = 1; seed <= 20; seed++) {
      const t = pickTemplates(REAL_CONTENT.structures, "verb", 1, verbTemplatesSeen, seededRng(seed));
      expect(t.every((x) => x.fits_pos.includes("verb"))).toBe(true);
    }
  });
});

describe("word bank, quiet words, words you can use", () => {
  it("shows recent words (not today's), quiet ones first, without the current batch", () => {
    let s = withWords(onboardedState(), ["w0001", "w0002"], "2026-10-09", { selfUseCount: 1 });
    s = withWords(s, ["w0003"], "2026-10-02"); // quiet: old, never used on own
    s = withWords(s, ["w0004"], today);
    const bank = wordBank(s, REAL_CONTENT, today, TEST_RULES, ["w0002"]);
    expect(bank.map((b) => b.id)).toEqual(["w0003", "w0001"]);
    expect(bank[0]).toMatchObject({ french: "l'eau", quiet: true });
  });

  it("finds quiet words and words you can use", () => {
    let s = withWords(onboardedState(), ["w0001"], "2026-10-01", { selfUseCount: 2 });
    s = withWords(s, ["w0002"], "2026-10-01");
    s = withWords(s, ["w0003"], "2026-10-09");
    expect(quietWords(s, today, TEST_RULES)).toEqual(["w0002"]);
    expect(wordsYouCanUse(s)).toEqual(["w0001"]);
  });

  it("maps the AI's base forms to seen words", () => {
    const s = withWords(onboardedState(), ["w0001", "w0006"], "2026-10-01");
    expect(lemmasToSeenWordIds(["manger", "Pomme", "avoir"], s, REAL_CONTENT).sort()).toEqual(["w0001", "w0006"]);
  });
});

describe("mistake counts", () => {
  it("counts per tag and compares with the 2 weeks before", () => {
    let s = withWords(onboardedState(), ["w0001"], "2026-09-01");
    s = recordMistakes(s, ["article-gender"], "w0001", "2026-09-20");
    s = recordMistakes(s, ["article-gender", "elision"], "w0001", "2026-10-09");
    expect(topMistakes(s, today)).toEqual([
      { tag: "article-gender", count: 1, previous: 1 },
      { tag: "elision", count: 1, previous: 0 },
    ]);
    expect(wordsWithTag(s, "elision")).toEqual(["w0001"]);
  });
});
