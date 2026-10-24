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
    ["w0006", "Nous mangeons à midi."], // manger, regular -er
    ["w0171", "Je vais au marché."], // aller, irregular form from words.json
    ["w0171", "Nous allons au cinéma."],
    ["w0001", "J'aime les pommes."], // plural noun
    ["w0182", "Elle est grande."], // feminine adjective
    ["w0003", "Je bois de l'eau."], // elided article
    ["w0045", "Ma sœur habite ici."], // œ
    ["w0118", "Ce week-end, je dors."], // two-part word
    ["w0121", "Nous commençons à huit heures."], // ç
    ["w0186", "Ma ville est belle."], // irregular adjective form
    ["w0040", "Ma voisine est gentille."], // feminine of an "m/f" noun
    ["w0060", "Je me lève à sept heures."], // reflexive verb, conjugated
    ["w0072", "Elle s'habille vite le matin."], // reflexive verb with s'
  ])("finds %s in %s", (id, sentence) => {
    expect(containsWord(sentence, word(id))).toBe(true);
  });

  it("is lenient with missing accents", () => {
    expect(containsWord("Je bois un cafe.", word("w0004"))).toBe(true);
  });

  it("does not match a different longer word", () => {
    expect(containsWord("Je cherche mes clés.", word("w0155"))).toBe(false); // cher ≠ chercher
    expect(containsWord("Je mange une banane.", word("w0001"))).toBe(false);
  });

  it.each([
    ["w0330", "Il marche vite le matin."], // marcher: "marche" without accent is still the verb
    ["w0288", "J'appelle ma mère le soir."], // appeler: doubled l
    ["w0263", "J'essaie une nouvelle recette."], // essayer: y → i
    ["w0672", "J'ai suivi un cours de cuisine."], // suivre: participle in -i
    ["w0123", "Il attend le bus."], // attendre: no ending
    ["w0173", "Nous pouvons venir demain."], // pouvoir: -oir verb
    ["w0121", "Nous commençons à huit heures."], // commencer: ç
    ["w0607", "Mon fils grandit vite."], // grandir
    ["w0461", "Je suis sûre de moi."], // sûr with its accent
  ])("still finds %s in %s", (id, sentence) => {
    expect(containsWord(sentence, word(id))).toBe(true);
  });

  it("does not count look-alike words (only real verb endings, accents where they change the word)", () => {
    expect(containsWord("Il est dans la cuisine.", word("w0207"))).toBe(false); // dans ≠ danser
    expect(containsWord("Il est dans la cuisine.", word("w0587"))).toBe(false); // cuisine ≠ cuire
    expect(containsWord("Mon frère est très grand.", word("w0607"))).toBe(false); // grand ≠ grandir (not_forms)
    expect(containsWord("Je ne sais pas.", word("w0057"))).toBe(false); // ne ≠ né (naître)
    expect(containsWord("Le livre est sur la table.", word("w0461"))).toBe(false); // sur ≠ sûr
    expect(containsWord("Ta chemise est sale.", word("w0348"))).toBe(false); // sale ≠ salé
    expect(containsWord("Elle marche dans le parc.", word("w0153"))).toBe(false); // marche ≠ marché
  });

  it("finds all known words in a sentence", () => {
    const words = [word("w0006"), word("w0001"), word("w0023"), word("w0171")];
    expect(findWordsUsed("Je mange une pomme à la maison.", words).sort()).toEqual(["w0001", "w0006", "w0023"]);
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
