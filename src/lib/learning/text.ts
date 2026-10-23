import type { Word } from "@/lib/content/types";

// Text helpers for French sentences. These are cheap code checks; the AI does
// the real grammar work. They are lenient on purpose: a false "word missing"
// error annoys the learner more than a missed one costs us.

/** Lowercase, no accents, one kind of apostrophe. "J’AIME l'été" → "j'aime l'ete". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘`´]/g, "'")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
}

/** Words as tokens, elisions split: "J'aime l'eau." → ["j", "aime", "l", "eau"]. */
export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Words as a learner counts them: "J'aime les pommes." → 3. */
export function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((chunk) => /\p{L}/u.test(chunk)).length;
}

// Endings a noun or adjective can take for gender and number
// (petit/petite/petits, occupé/occupée, gentil/gentille, bon/bonne…).
const NOUN_ADJ_ENDINGS = new Set(["", "e", "s", "es", "x", "ee", "ees", "le", "les", "ne", "nes", "te", "tes", "se", "ses"]);

type Stem = { stem: string; maxExtra: number; endings: Set<string> | null };
type Matcher = { exact: Set<string>; forms: Set<string>; stems: Stem[]; phrase: string[] | null };

const matcherCache = new WeakMap<Word, Matcher>();

function buildMatcher(word: Word): Matcher {
  let base = normalize(word.french).trim();
  let baseTokens = tokenize(base);
  // Reflexive verbs: "se lever" is written "je me lève", so match the verb part.
  if (word.pos === "verb" && baseTokens.length === 2 && (baseTokens[0] === "se" || baseTokens[0] === "s")) {
    base = baseTokens[1];
    baseTokens = [base];
  }
  const forms = new Set<string>();
  for (const f of word.forms ?? []) for (const t of tokenize(f)) forms.add(t);
  const exact = new Set<string>([base, ...forms]);
  const stems: Matcher["stems"] = [];

  if (baseTokens.length > 1) {
    // Multi-word entries ("pomme de terre") must appear as a phrase.
    return { exact, forms, stems, phrase: baseTokens };
  }

  if (word.pos === "verb") {
    const stem = /(er|ir|re)$/.test(base) ? base.slice(0, -2) : base;
    // Verbs have many endings (mangeons, mangerai…): any short ending is fine.
    if (stem.length >= 3) stems.push({ stem, maxExtra: 6, endings: null });
  } else {
    for (const suffix of ["s", "x", "e", "es"]) exact.add(base + suffix);
    // Feminine forms the endings below can't guess (voisine, professeure, patronne).
    if (word.feminine) for (const f of [word.feminine, word.feminine + "s"]) exact.add(normalize(f).trim());
    const stem = base.endsWith("e") ? base.slice(0, -1) : base;
    if (stem.length >= 4) stems.push({ stem, maxExtra: 3, endings: NOUN_ADJ_ENDINGS });
  }
  return { exact, forms, stems, phrase: null };
}

function matcherFor(word: Word): Matcher {
  let m = matcherCache.get(word);
  if (!m) {
    m = buildMatcher(word);
    matcherCache.set(word, m);
  }
  return m;
}

function tokensContainWord(tokens: string[], word: Word): boolean {
  const m = matcherFor(word);
  if (m.phrase) {
    const p = m.phrase;
    for (let i = 0; i + p.length <= tokens.length; i++) {
      if (p.every((t, j) => tokens[i + j] === t || tokens[i + j] === t + "s")) return true;
    }
    // Irregular forms listed in words.json still count.
    return m.forms.size > 0 && tokens.some((t) => m.forms.has(t));
  }
  return tokens.some(
    (t) =>
      m.exact.has(t) ||
      m.stems.some(
        ({ stem, maxExtra, endings }) =>
          t.startsWith(stem) &&
          t.length <= stem.length + maxExtra &&
          (endings === null || endings.has(t.slice(stem.length))),
      ),
  );
}

/** True if the sentence uses the word in any recognisable form. */
export function containsWord(sentence: string, word: Word): boolean {
  return tokensContainWord(tokenize(sentence), word);
}

/** Ids of the given words that appear in the sentence. */
export function findWordsUsed(sentence: string, words: Iterable<Word>): string[] {
  const tokens = tokenize(sentence);
  const found: string[] = [];
  for (const w of words) if (tokensContainWord(tokens, w)) found.push(w.id);
  return found;
}

/**
 * Compare two sentences for the "fix" and "retype" steps. Ignores case,
 * extra spaces, apostrophe style and spaces around punctuation, but NOT
 * accents (accents are part of learning French).
 */
export function sameSentence(a: string, b: string): boolean {
  return simplifyForCompare(a) === simplifyForCompare(b);
}

export function simplifyForCompare(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[’‘`´]/g, "'")
    .toLowerCase()
    .replace(/\s*([?!.,;:'])\s*/g, "$1")
    .replace(/[.!]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Same as simplifyForCompare but also used to look for a fix inside a sentence. */
export function includesFix(sentence: string, fix: string): boolean {
  const s = simplifyForCompare(sentence);
  const f = simplifyForCompare(fix);
  return f.length > 0 && s.includes(f);
}
