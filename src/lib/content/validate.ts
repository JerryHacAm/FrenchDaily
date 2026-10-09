import { containsWord } from "@/lib/learning/text";
import { POS_LIST, type GrammarRule, type Scenario, type Structure, type Word } from "./types";

// Checks the content files so a typo in /data shows a clear message instead
// of a broken app. Runs when the app loads content and in `npm test`.

export function validateContent(input: {
  words: Word[];
  structures: Structure[];
  grammarRules: GrammarRule[];
  scenarios: Scenario[];
}): string[] {
  const problems: string[] = [];
  const dup = (kind: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) problems.push(`${kind}: duplicate id "${id}"`);
      seen.add(id);
    }
  };
  const text = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  const level = (v: unknown) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5;

  dup("words.json", input.words.map((w) => w.id));
  for (const w of input.words) {
    const at = `words.json ${w.id ?? "?"}`;
    for (const key of ["id", "french", "english", "theme", "example", "example_en"] as const) {
      if (!text(w[key])) problems.push(`${at}: "${key}" is missing`);
    }
    if (!POS_LIST.includes(w.pos)) problems.push(`${at}: pos must be one of ${POS_LIST.join(", ")}`);
    if (!level(w.level)) problems.push(`${at}: level must be 1 to 5`);
    if (typeof w.frequency_rank !== "number") problems.push(`${at}: frequency_rank must be a number`);
    if (w.pos === "noun") {
      if (w.gender !== "m" && w.gender !== "f") problems.push(`${at}: nouns need gender "m" or "f"`);
      if (!["le", "la", "l'", "les"].includes(w.article ?? "")) problems.push(`${at}: nouns need article le, la, l' or les`);
    } else if (w.gender !== null || w.article !== null) {
      problems.push(`${at}: only nouns have gender and article (use null)`);
    }
    if (!w.mini_text || !text(w.mini_text.fr) || !text(w.mini_text.en)) {
      problems.push(`${at}: mini_text needs "fr" and "en"`);
    } else if (!containsWord(w.mini_text.fr, w)) {
      problems.push(`${at}: mini_text.fr does not use the word (add the form to "forms" if it's irregular)`);
    }
    if (text(w.example) && !containsWord(w.example, w)) {
      problems.push(`${at}: example does not use the word (add the form to "forms" if it's irregular)`);
    }
  }

  dup("structures.json", input.structures.map((s) => s.id));
  for (const s of input.structures) {
    const at = `structures.json ${s.id ?? "?"}`;
    if (s.type !== "statement" && s.type !== "question") problems.push(`${at}: type must be statement or question`);
    if (!level(s.level)) problems.push(`${at}: level must be 1 to 5`);
    if (!Array.isArray(s.fits_pos) || s.fits_pos.length === 0 || s.fits_pos.some((p) => !POS_LIST.includes(p))) {
      problems.push(`${at}: fits_pos must list noun/verb/adjective`);
    }
    if (!text(s.pattern)) problems.push(`${at}: pattern is missing`);
    for (const key of Object.keys(s.examples ?? {})) {
      if (!s.fits_pos?.includes(key as Word["pos"])) problems.push(`${at}: example for "${key}" but it's not in fits_pos`);
    }
  }

  dup("grammar_rules.json", input.grammarRules.map((r) => r.id));
  if (!input.grammarRules.some((r) => r.id === "other")) problems.push('grammar_rules.json: needs a rule with id "other"');
  for (const r of input.grammarRules) {
    const at = `grammar_rules.json ${r.id ?? "?"}`;
    for (const key of ["id", "title", "rule"] as const) if (!text(r[key])) problems.push(`${at}: "${key}" is missing`);
    if (!/^[a-z0-9-]+$/.test(r.id ?? "")) problems.push(`${at}: id must be lowercase-with-dashes`);
    if (!level(r.level)) problems.push(`${at}: level must be 1 to 5`);
    if (!Array.isArray(r.focus_pos)) problems.push(`${at}: focus_pos must be a list`);
  }

  dup("roleplay_scenarios.json", input.scenarios.map((s) => s.id));
  for (const s of input.scenarios) {
    const at = `roleplay_scenarios.json ${s.id ?? "?"}`;
    for (const key of ["id", "title", "title_fr", "intro", "setting", "character", "opening_fr", "opening_en"] as const) {
      if (!text(s[key])) problems.push(`${at}: "${key}" is missing`);
    }
    if (!level(s.min_level)) problems.push(`${at}: min_level must be 1 to 5`);
  }
  return problems;
}
