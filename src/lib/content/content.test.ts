import { describe, expect, it } from "vitest";
import { rawContent } from "@/lib/content";
import { validateContent } from "@/lib/content/validate";
import { pickTemplates } from "@/lib/learning/templates";
import { seededRng } from "@/lib/learning/random";
import { REAL_CONTENT, word } from "@/test/fixtures";
import { displayWord, type Word } from "./types";

describe("content files in /data", () => {
  it("have no problems (run this after editing any JSON file)", () => {
    expect(validateContent(rawContent())).toEqual([]);
  });

  it("give every word 2 statement + 1 question templates at every level, made for its part of speech", () => {
    for (const w of REAL_CONTENT.words) {
      for (let level = 1; level <= 5; level++) {
        const t = pickTemplates(REAL_CONTENT.structures, w.pos, level, [], seededRng(1));
        expect(t.map((x) => x.type)).toEqual(["statement", "statement", "question"]);
        expect(t.every((x) => x.fits_pos.includes(w.pos) && x.examples[w.pos]), `${w.id} level ${level}`).toBe(true);
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
    const broken: Word = { ...raw.words[0], id: "w0001", gender: null, mini_text: { fr: "Bonjour.", en: "Hello." } };
    const problems = validateContent({ ...raw, words: [...raw.words, broken] });
    expect(problems).toContain('words.json: duplicate id "w0001"');
    expect(problems.some((p) => p.includes('nouns need gender "m", "f" or "m/f"'))).toBe(true);
    expect(problems.some((p) => p.includes("mini_text.fr does not use the word"))).toBe(true);
  });
});

describe("displayWord", () => {
  it("shows the article, and both forms for m/f words", () => {
    expect(displayWord(word("w0001"))).toBe("la pomme");
    expect(displayWord(word("w0040"))).toBe("le voisin / la voisine");
    expect(displayWord(word("w0131"))).toBe("l'ami / l'amie");
    expect(displayWord(word("w0046"))).toBe("l'enfant"); // same form for both
    expect(displayWord(word("w0221"))).toBe("le médecin / la médecin");
  });

  it("asks m/f nouns for their feminine form", () => {
    const raw = rawContent();
    const broken: Word = { ...word("w0040"), id: "w9999", feminine: null };
    expect(validateContent({ ...raw, words: [...raw.words, broken] })).toContain(
      `words.json w9999: "m/f" nouns need "feminine" and "article_f" (la, l' or les)`,
    );
  });
});
