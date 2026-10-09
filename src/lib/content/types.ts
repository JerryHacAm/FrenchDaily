// Shapes of the content files in /data. Content belongs to Jerry; code only
// reads it. src/lib/content/validate.ts checks the files (run by npm test).

export type Pos = "noun" | "verb" | "adjective";
export const POS_LIST: readonly Pos[] = ["noun", "verb", "adjective"];

export type Word = {
  id: string;
  french: string;
  english: string;
  pos: Pos;
  /** "m" or "f" for nouns, null otherwise. */
  gender: "m" | "f" | null;
  /** "le", "la", "l'" or "les" for nouns, null otherwise. */
  article: string | null;
  level: number;
  theme: string;
  /** Smaller = more common. Approximate in the first draft. */
  frequency_rank: number;
  audio: string | null;
  example: string;
  example_en: string;
  /** Short text (2–3 sentences) shown before writing: read → notice → write. */
  mini_text: { fr: string; en: string };
  /** Irregular forms the simple matching rules can't guess (e.g. "vais" for aller). */
  forms?: string[];
};

export type Structure = {
  id: string;
  type: "statement" | "question";
  level: number;
  fits_pos: Pos[];
  pattern: string;
  /** For each part of speech: [sample word, example sentence]. */
  examples: Partial<Record<Pos, [string, string]>>;
};

export type GrammarRule = {
  /** Used as the mistake "tag" everywhere (AI output, stats, coach). */
  id: string;
  level: number;
  title: string;
  /** One or two plain-English sentences. */
  rule: string;
  wrong: string;
  right: string;
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

/** "la pomme", "l'eau", "manger". */
export function displayWord(w: Word): string {
  if (!w.article) return w.french;
  return w.article.endsWith("'") ? `${w.article}${w.french}` : `${w.article} ${w.french}`;
}
