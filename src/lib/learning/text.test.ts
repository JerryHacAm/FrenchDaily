import { describe, expect, it } from "vitest";
import { word } from "@/test/fixtures";
import { containsWord, findWordsUsed, includesFix, normalize, sameSentence, tokenize, wordCount } from "./text";

describe("normalize / tokenize / wordCount", () => {
  it("lowercases, removes accents and splits elisions", () => {
    expect(normalize("J’AIME l'été")).toBe("j'aime l'ete");
    expect(tokenize("J'aime l'eau.")).toEqual(["j", "aime", "l", "eau"]);
    expect(tokenize("Ma sœur")).toEqual(["ma", "soeur"]);
  });

  it("counts words like a learner does", () => {
    expect(wordCount("J'aime les pommes.")).toBe(3);
    expect(wordCount("  Tu viens ?  ")).toBe(2);
  });
});

describe("containsWord", () => {
  it.each([
    ["w006", "Nous mangeons à midi."], // manger, regular -er
    ["w051", "Je vais au marché."], // aller, irregular form from words.json
    ["w051", "Nous allons au cinéma."],
    ["w001", "J'aime les pommes."], // plural noun
    ["w020", "Elle est grande."], // feminine adjective
    ["w003", "Je bois de l'eau."], // elided article
    ["w027", "Ma sœur habite ici."], // œ
    ["w092", "Ce week-end, je dors."], // two-part word
    ["w040", "Nous commençons à huit heures."], // ç
    ["w094", "Ma ville est belle."], // irregular adjective form
  ])("finds %s in %s", (id, sentence) => {
    expect(containsWord(sentence, word(id))).toBe(true);
  });

  it("is lenient with missing accents", () => {
    expect(containsWord("Je bois un cafe.", word("w004"))).toBe(true);
  });

  it("does not match a different longer word", () => {
    expect(containsWord("Je cherche mes clés.", word("w055"))).toBe(false); // cher ≠ chercher
    expect(containsWord("Je mange une banane.", word("w001"))).toBe(false);
  });

  it("finds all known words in a sentence", () => {
    const words = [word("w006"), word("w001"), word("w013"), word("w051")];
    expect(findWordsUsed("Je mange une pomme à la maison.", words).sort()).toEqual(["w001", "w006", "w013"]);
  });
});

describe("sameSentence / includesFix", () => {
  it("ignores case, spaces, apostrophe style and final full stop, but not accents", () => {
    expect(sameSentence("J’aime le café .", "j'aime le café")).toBe(true);
    expect(sameSentence("Tu viens ?", "Tu viens?")).toBe(true);
    expect(sameSentence("J'aime le cafe.", "J'aime le café.")).toBe(false);
  });

  it("finds a fix inside a sentence", () => {
    expect(includesFix("Je mange une pomme.", "une pomme")).toBe(true);
    expect(includesFix("Je mange un pomme.", "une pomme")).toBe(false);
  });
});
