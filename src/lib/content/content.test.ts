import { describe, expect, it } from "vitest";
import { rawContent } from "@/lib/content";
import { validateContent } from "@/lib/content/validate";
import { pickTemplates } from "@/lib/learning/templates";
import { seededRng } from "@/lib/learning/random";
import { REAL_CONTENT } from "@/test/fixtures";
import type { Word } from "./types";

describe("content files in /data", () => {
  it("have no problems (run this after editing any JSON file)", () => {
    expect(validateContent(rawContent())).toEqual([]);
  });

  it("give every word 2 statement + 1 question templates at every level", () => {
    for (const w of REAL_CONTENT.words) {
      for (let level = 1; level <= 5; level++) {
        const t = pickTemplates(REAL_CONTENT.structures, w.pos, level, [], seededRng(1));
        expect(t.map((x) => x.type)).toEqual(["statement", "statement", "question"]);
      }
    }
  });

  it("use known grammar tags in the AI test set", async () => {
    const tests = (await import("../../../tests/sentences.json")).default.items;
    const known = new Set(REAL_CONTENT.grammarRules.map((r) => r.id));
    for (const t of tests) {
      expect(REAL_CONTENT.wordById.has(t.word), t.id).toBe(true);
      for (const group of t.expect.tags) for (const tag of group) expect(known.has(tag), `${t.id} ${tag}`).toBe(true);
    }
  });
});

describe("validateContent", () => {
  it("explains broken entries in plain words", () => {
    const raw = rawContent();
    const broken: Word = { ...raw.words[0], id: "w001", gender: null, mini_text: { fr: "Bonjour.", en: "Hello." } };
    const problems = validateContent({ ...raw, words: [...raw.words, broken] });
    expect(problems).toContain('words.json: duplicate id "w001"');
    expect(problems.some((p) => p.includes('nouns need gender "m" or "f"'))).toBe(true);
    expect(problems.some((p) => p.includes("mini_text.fr does not use the word"))).toBe(true);
  });
});
