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

// Real verb endings after the stem, without accents, so "dans" doesn't count
// as danser, nor "cuisine" as cuire. Irregular forms go in words.json "forms".
const ER_ENDINGS = new Set([
  "e", "es", "ent", "ons", "ez", "ais", "ait", "ions", "iez", "aient", "ant", // present, imparfait (mangé = "e")
  "ee", "ees", "er", "erai", "eras", "era", "erons", "erez", "eront", // participle, infinitive, futur
  "erais", "erait", "erions", "eriez", "eraient",
  "eons", "eais", "eait", "eaient", "eant", // mangeons
]);
const IR_ENDINGS = new Set([
  "is", "it", "issons", "issez", "issent", "issais", "issait", "issions", "issiez", "issaient", "issant", "isse", "isses", // finir
  "s", "t", "e", "es", "ent", "ons", "ez", "ais", "ait", "ions", "iez", "aient", "ant", // partir, courir
  "i", "ie", "ies", "u", "ue", "us", "ues", // participles (fini, venu)
  "ir", "irai", "iras", "ira", "irons", "irez", "iront", "irais", "irait", "irions", "iriez", "iraient",
]);
const RE_ENDINGS = new Set([
  "", "s", "t", "e", "es", "ent", "ons", "ez", "ais", "ait", "ions", "iez", "aient", "ant", // attend, attends
  "u", "ue", "us", "ues", "i", "ie", "is", "ies", "ise", "ises", "it", "ite", "its", "ites", // participles (attendu, suivi, pris, écrit)
  "re", "rai", "ras", "ra", "rons", "rez", "ront", "rais", "rait", "rions", "riez", "raient",
  "vons", "vez", "vent", "vais", "vait", "vaient", "vant", "ve", "ves", // écrivons
  "sons", "sez", "sent", "sais", "sait", "saient", "sant", "se", "ses", // conduisons
]);
const OIR_ENDINGS = new Set([
  "ons", "ez", "ent", "ais", "ait", "ions", "iez", "aient", "ant", "e", "es", "oir", // pouvons, devais
  "u", "ue", "us", "ues", "ra", "rai", "ras", "rons", "rez", "ront", "rais", "rait", "rions", "riez", "raient",
]);

/** Verb stem(s) and the endings allowed after them. */
function verbStems(base: string): Stem[] {
  const [cut, endings] = base.endsWith("oir")
    ? [3, OIR_ENDINGS]
    : base.endsWith("er")
      ? [2, ER_ENDINGS]
      : base.endsWith("ir")
        ? [2, IR_ENDINGS]
        : base.endsWith("re")
          ? [2, RE_ENDINGS]
          : [0, null];
  const stem = base.slice(0, base.length - cut);
  if (!endings || stem.length < 3) return [];
  const stems: Stem[] = [{ stem, maxExtra: 7, endings }];
  if (endings === ER_ENDINGS) {
    // j'appelle, je jette (doubled consonant); j'essaie, j'envoie (y → i)
    if (/[lt]$/.test(stem)) stems.push({ stem: stem + stem.at(-1), maxExtra: 7, endings });
    if (stem.endsWith("y")) stems.push({ stem: stem.slice(0, -1) + "i", maxExtra: 7, endings });
  }
  return stems;
}

// Spellings that are a different common word without their accent (ne / né,
// sur / sûr, a / à, sale / salé…). For these the accent must match; missing
// accents are forgiven everywhere else.
const ACCENT_MATTERS = new Set([
  "a", "ou", "la", "ne", "sur", "des", "du", "mur", "pres", "cote", "tache",
  "sale", "marche", "passe", "ferme", "presse", "porte", "entre", "peche",
]);

/** A word as written (lowercase, accents kept) and without accents. */
type Token = { written: string; plain: string };

function tokenizeKeepingAccents(text: string): Token[] {
  const tokens: Token[] = [];
  for (const piece of text.normalize("NFC").toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    const plain = tokenize(piece);
    if (plain.length === 1) tokens.push({ written: piece, plain: plain[0] });
    else for (const p of plain) tokens.push({ written: p, plain: p });
  }
  return tokens;
}

type Stem = { stem: string; maxExtra: number; endings: Set<string> | null };
type Matcher = {
  exact: Set<string>;
  /** The exact forms with their accents, for the ACCENT_MATTERS spellings. */
  written: Set<string>;
  forms: Set<string>;
  stems: Stem[];
  phrase: string[] | null;
  not: Set<string>;
  verb: boolean;
};

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
  const writtenBase = tokenizeKeepingAccents(word.french).at(-1)?.written ?? base;
  const written = new Set<string>([writtenBase, ...(word.forms ?? []).flatMap((f) => tokenizeKeepingAccents(f).map((t) => t.written))]);
  const stems: Matcher["stems"] = [];
  // Words that look like this one but are a different word (grand for grandir).
  const not = new Set<string>((word.not_forms ?? []).flatMap((f) => tokenize(f)));

  if (baseTokens.length > 1) {
    // Multi-word entries ("pomme de terre") must appear as a phrase.
    return { exact, written, forms, stems, phrase: baseTokens, not, verb: word.pos === "verb" };
  }

  if (word.pos === "verb") {
    stems.push(...verbStems(base));
  } else {
    for (const suffix of ["s", "x", "e", "es"]) {
      exact.add(base + suffix);
      written.add(writtenBase + suffix);
    }
    // Feminine forms the endings below can't guess (voisine, professeure, patronne).
    if (word.feminine) {
      for (const f of [word.feminine, word.feminine + "s"]) {
        exact.add(normalize(f).trim());
        written.add(f.normalize("NFC").toLowerCase().trim());
      }
    }
    const stem = base.endsWith("e") ? base.slice(0, -1) : base;
    if (stem.length >= 4) stems.push({ stem, maxExtra: 3, endings: NOUN_ADJ_ENDINGS });
  }
  return { exact, written, forms, stems, phrase: null, not, verb: word.pos === "verb" };
}

function matcherFor(word: Word): Matcher {
  let m = matcherCache.get(word);
  if (!m) {
    m = buildMatcher(word);
    matcherCache.set(word, m);
  }
  return m;
}

function tokensContainWord(tokens: Token[], word: Word): boolean {
  const m = matcherFor(word);
  const plain = tokens.map((t) => t.plain);
  if (m.phrase) {
    const p = m.phrase;
    for (let i = 0; i + p.length <= plain.length; i++) {
      if (p.every((t, j) => plain[i + j] === t || plain[i + j] === t + "s")) return true;
    }
    // Irregular forms listed in words.json still count.
    return m.forms.size > 0 && plain.some((t) => m.forms.has(t));
  }
  return tokens.some(({ written, plain: t }) => {
    if (m.not.has(t)) return false;
    // "ne" is not "né": with these spellings the accent decides the word.
    const accentClash = ACCENT_MATTERS.has(t) && !m.written.has(written);
    if (m.exact.has(t) && !accentClash) return true;
    // A verb ending can still match ("il marche" = marcher), a noun's can't.
    if (accentClash && !m.verb) return false;
    return m.stems.some(
      ({ stem, maxExtra, endings }) =>
        t.startsWith(stem) && t.length <= stem.length + maxExtra && (endings === null || endings.has(t.slice(stem.length))),
    );
  });
}

/** True if the sentence uses the word in any recognisable form. */
export function containsWord(sentence: string, word: Word): boolean {
  return tokensContainWord(tokenizeKeepingAccents(sentence), word);
}

/** Ids of the given words that appear in the sentence. */
export function findWordsUsed(sentence: string, words: Iterable<Word>): string[] {
  const tokens = tokenizeKeepingAccents(sentence);
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

/** True when two texts differ only in accents: "a l'ecole" vs "à l'école". */
export function onlyAccentsDiffer(a: string, b: string): boolean {
  const sa = simplifyForCompare(a);
  const sb = simplifyForCompare(b);
  return sa !== sb && normalize(sa) === normalize(sb);
}

/** Same as simplifyForCompare but also used to look for a fix inside a sentence. */
export function includesFix(sentence: string, fix: string): boolean {
  const s = simplifyForCompare(sentence);
  const f = simplifyForCompare(fix);
  return f.length > 0 && s.includes(f);
}
