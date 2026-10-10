import type { Word } from "@/lib/content/types";
import { displayWord } from "@/lib/content/types";
import type { Rules } from "./rules";
import { containsWord, wordCount } from "./text";

// Cheap code checks before any AI call (README 6, step 2). Bad input never
// reaches the AI, so it never costs money.

export type CodeCheck = { ok: true; sentence: string } | { ok: false; message: string };

export function minWordsFor(level: number, rules: Rules): number {
  return level <= 1 ? rules.minSentenceWordsLevel1 : rules.minSentenceWords;
}

export function codeCheck(
  input: { sentence: string; word: Word; itemType: "statement" | "question"; level: number },
  rules: Rules,
): CodeCheck {
  const sentence = input.sentence.replace(/\s+/g, " ").trim();
  if (!sentence) return { ok: false, message: "Write a sentence first." };
  if (sentence.length > rules.maxSentenceChars) {
    return { ok: false, message: `That's a bit long. Keep it under ${rules.maxSentenceChars} characters.` };
  }
  const min = minWordsFor(input.level, rules);
  const count = wordCount(sentence);
  if (count < min) {
    return { ok: false, message: `Use at least ${min} words (you have ${count}). Add a place, a time or a reason.` };
  }
  if (!containsWord(sentence, input.word)) {
    return { ok: false, message: `Use the word "${displayWord(input.word)}" (any form is fine).` };
  }
  const endsWithQuestion = /\?\s*$/.test(sentence);
  if (input.itemType === "question" && !endsWithQuestion) {
    return { ok: false, message: 'This one is a question, so end it with "?".' };
  }
  if (input.itemType === "statement" && endsWithQuestion) {
    return { ok: false, message: "This one is a normal sentence, not a question." };
  }
  return { ok: true, sentence };
}
