// Shapes of the content files in /data. Content belongs to Jerry; code only
// reads it. src/lib/content/validate.ts checks the files (run by npm test).

export type Pos = "noun" | "verb" | "adjective";
export const POS_LIST: readonly Pos[] = ["noun", "verb", "adjective"];

export type Word = {
  id: string;
  french: string;
  english: string;
  pos: Pos;
  /**
   * "m" or "f" for nouns, null otherwise. "m/f" = a person noun with both
   * forms (le voisin / la voisine): `french`/`article` are the masculine form,
   * `feminine`/`article_f` the feminine one.
   */
  gender: "m" | "f" | "m/f" | null;
  /** "le", "la", "l'" or "les" for nouns, null otherwise. */
  article: string | null;
  /** Feminine form (m/f nouns and adjectives). Same spelling when it doesn't change. */
  feminine?: string | null;
  /** Article of the feminine form (m/f nouns only). */
  article_f?: string | null;
  level: number;
  theme: string;
  /** Smaller = more common. Approximate in the first draft. */
  frequency_rank: number;
  audio: string | null;
  example: string;
  /** Same example for a female learner, only where "je" needs agreement (Je suis fatiguée). */
  example_f?: string | null;
  example_en: string;
  /** Short text (2–3 sentences) shown before writing: read → notice → write. */
  mini_text: { fr: string; en: string };
  /** Irregular forms the simple matching rules can't guess (e.g. "vais" for aller). */
  forms?: string[];
  /** A short tip for the word page (e.g. why "se lever" has "se"). */
  note?: string | null;
  /** Other common meanings (README 3.1). */
  other_meanings?: OtherMeaning[];
};

export type OtherMeaning = {
  /** The separate entry for this meaning, or null when it is an N.B. only. */
  word_id: string | null;
  english: string;
  nb: string;
};

export type Structure = {
  id: string;
  type: "statement" | "question";
  level: number;
  fits_pos: Pos[];
  pattern: string;
  /** For each part of speech: [sample word, example sentence, English translation]. */
  examples: Partial<Record<Pos, [string, string, string]>>;
};

export type GrammarRule = {
  /** Used as the mistake "tag" everywhere (AI output, stats, coach). */
  id: string;
  level: number;
  title: string;
  /** One or two plain-English sentences. */
  rule: string;
  /** major = wrong meaning or core grammar; minor = accents, spelling, punctuation. */
  severity?: "major" | "minor";
  wrong: string;
  right: string;
  /** More examples (the main pair is wrong/right). */
  examples?: { wrong: string[]; right: string[] };
  /** Which kinds of target words are good practice for this rule. */
  focus_pos: Pos[];
};

export type Scenario = {
  id: string;
  title: string;
  title_fr: string;
  min_level: number;
  /** Shown to the learner (English, "you…"). */
  intro: string;
  /** English description of the situation, for the AI. */
  setting: string;
  /** Who the AI plays. */
  character: string;
  opening_fr: string;
  opening_en: string;
};

export type Content = {
  words: Word[];
  wordById: Map<string, Word>;
  structures: Structure[];
  structureById: Map<string, Structure>;
  grammarRules: GrammarRule[];
  ruleById: Map<string, GrammarRule>;
  scenarios: Scenario[];
  /** Theme order: first appearance in words.json. */
  themes: string[];
};

export function buildContent(input: {
  words: Word[];
  structures: Structure[];
  grammarRules: GrammarRule[];
  scenarios: Scenario[];
}): Content {
  const themes: string[] = [];
  for (const w of input.words) if (!themes.includes(w.theme)) themes.push(w.theme);
  return {
    words: input.words,
    wordById: new Map(input.words.map((w) => [w.id, w])),
    structures: input.structures,
    structureById: new Map(input.structures.map((s) => [s.id, s])),
    grammarRules: input.grammarRules,
    ruleById: new Map(input.grammarRules.map((r) => [r.id, r])),
    scenarios: input.scenarios,
    themes,
  };
}

function withArticle(article: string, french: string): string {
  return article.endsWith("'") ? `${article}${french}` : `${article} ${french}`;
}

/** "la pomme", "l'eau", "manger", "le voisin / la voisine", "l'enfant". */
export function displayWord(w: Word): string {
  if (!w.article) return w.french;
  const main = withArticle(w.article, w.french);
  if (w.gender !== "m/f" || !w.feminine || !w.article_f) return main;
  const fem = withArticle(w.article_f, w.feminine);
  return fem === main ? main : `${main} / ${fem}`;
}
