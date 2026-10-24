import type { Feedback, Mistake } from "./state";
import { includesFix, onlyAccentsDiffer, sameSentence } from "./text";

// Makes the AI's answer safe to show (README 6, step 6): never more than 2
// mistakes, exactly 2 examples, known tags only, consistent flags. The AI
// output is already schema-checked; this enforces our product rules.

export const MAX_MISTAKES = 2;
export const OTHER_TAG = "other";
export const ACCENT_TAG = "spelling-accent";

export type RawFeedback = {
  structure_ok: boolean;
  structure_note: string;
  is_question: boolean;
  is_correct: boolean;
  corrected_sentence: string;
  corrected_english: string;
  mistakes: Mistake[];
  example_sentences: { french: string; english: string }[];
  words_used: string[];
  encouragement: string;
};

export function normalizeFeedback(
  raw: RawFeedback,
  input: { sentence: string; itemType: "statement" | "question"; knownTags: Set<string> },
): Feedback {
  const mistakes = raw.mistakes
    .filter((m) => m.original.trim() || m.fix.trim())
    .slice(0, MAX_MISTAKES)
    .map((m) => {
      // A slip that is only accents (a → à) is always minor, whatever the AI
      // said: a major mistake sends the word back to review box 1.
      if (onlyAccentsDiffer(m.original, m.fix)) {
        return { ...m, tag: input.knownTags.has(ACCENT_TAG) ? ACCENT_TAG : OTHER_TAG, severity: "minor" as const };
      }
      return {
        ...m,
        tag: input.knownTags.has(m.tag) ? m.tag : OTHER_TAG,
        severity: m.severity === "minor" ? ("minor" as const) : ("major" as const),
      };
    });

  let structureOk = raw.structure_ok;
  let structureNote = raw.structure_note.trim();
  if (input.itemType === "question" && !raw.is_question) {
    structureOk = false;
    structureNote ||= "This one should be a question.";
  }
  if (input.itemType === "statement" && raw.is_question) {
    structureOk = false;
    structureNote ||= "This one should be a normal sentence, not a question.";
  }
  if (structureOk) structureNote = "";

  let corrected = raw.corrected_sentence.trim() || input.sentence;
  let isCorrect = raw.is_correct && mistakes.length === 0;
  if (mistakes.length === 0) {
    // No mistake listed: treat as correct and keep the learner's sentence
    // unless the AI only changed punctuation or spacing.
    isCorrect = true;
    if (!sameSentence(corrected, input.sentence)) corrected = input.sentence;
  }
  if (sameSentence(corrected, input.sentence) && mistakes.length > 0) {
    // A mistake without any change in the correction is contradictory: keep
    // the mistake but build the correction from the fixes.
    let fixed = input.sentence;
    for (const m of mistakes) if (m.original && fixed.includes(m.original)) fixed = fixed.replace(m.original, m.fix);
    corrected = fixed;
  }

  const examples = raw.example_sentences.filter((e) => e.french.trim()).slice(0, 2);

  return {
    structure_ok: structureOk,
    structure_note: structureNote,
    is_correct: isCorrect,
    corrected_sentence: corrected,
    corrected_english: raw.corrected_english.trim(),
    mistakes,
    example_sentences: examples,
    words_used: raw.words_used.map((w) => w.trim()).filter(Boolean),
    encouragement: raw.encouragement.trim(),
  };
}

export function hasMajorMistake(f: Feedback): boolean {
  return f.mistakes.some((m) => m.severity === "major");
}

/**
 * The fix step: did the learner fix their sentence themselves? Accepted if it
 * matches the correction, or if every fix appears and no original error stays.
 */
export function isSelfFixed(attempt: string, f: Feedback): boolean {
  if (sameSentence(attempt, f.corrected_sentence)) return true;
  if (f.mistakes.length === 0) return false;
  return f.mistakes.every(
    (m) => includesFix(attempt, m.fix) && (!m.original.trim() || !includesFix(attempt, m.original) || includesFix(m.fix, m.original)),
  );
}
