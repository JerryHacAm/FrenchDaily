import * as z from "zod";

// The exact JSON shapes the AI must answer with. They are sent to the Claude
// API as "structured outputs", so the answer always parses. Our own product
// rules (max 2 mistakes, known tags…) are enforced after, in code
// (src/lib/learning/feedback.ts).
//
// Note for editors: the API does not support min/max length rules in these
// schemas; keep them simple (objects, strings, booleans, arrays, enums).

export const MistakeSchema = z.object({
  tag: z.string().describe("A grammar rule id from the rule set, or \"other\"."),
  severity: z.enum(["major", "minor"]),
  original: z.string().describe("The wrong part, copied exactly from the learner's sentence."),
  fix: z.string().describe("The corrected version of that part."),
  hint: z.string().describe("A nudge in plain English that does NOT give the answer."),
  short_explanation: z.string().describe("One plain-English sentence."),
  detail: z.string().describe("A longer plain-English explanation, shown only on tap."),
});

export const FeedbackSchema = z.object({
  structure_ok: z.boolean(),
  structure_note: z.string().describe("What to add if structure_ok is false, else empty."),
  is_question: z.boolean(),
  is_correct: z.boolean(),
  corrected_sentence: z.string(),
  corrected_english: z.string().describe("English translation of corrected_sentence."),
  mistakes: z.array(MistakeSchema),
  example_sentences: z.array(z.object({ french: z.string(), english: z.string() })),
  words_used: z.array(z.string()).describe("Base forms of the French words used (infinitives, masculine singular)."),
  encouragement: z.string(),
});

export const CoachNoteSchema = z.object({
  headline: z.string(),
  message: z.string(),
  focus_tag: z.string().describe("One tag from top_mistakes, or empty string."),
  action_label: z.string(),
});

export const WeeklyReportSchema = z.object({
  summary: z.string(),
  wins: z.array(z.string()),
  focus_tag: z.string().describe("One tag from top_mistakes, or empty string."),
  focus_reason: z.string(),
  next_steps: z.array(z.string()),
});

export const RoleplayReplySchema = z.object({
  reply_fr: z.string(),
  reply_en: z.string(),
  should_end: z.boolean(),
});

export const RoleplaySummarySchema = z.object({
  overall: z.string(),
  praise: z.string(),
  corrections: z.array(
    z.object({ original: z.string(), fix: z.string(), explanation: z.string(), tag: z.string() }),
  ),
  words_used: z.array(z.string()),
});

export const AskReplySchema = z.object({
  answer: z.string().describe("The answer for the learner. French words and phrases in **bold**."),
});

export type CoachNoteOut = z.infer<typeof CoachNoteSchema>;
export type WeeklyReportOut = z.infer<typeof WeeklyReportSchema>;
export type RoleplayReplyOut = z.infer<typeof RoleplayReplySchema>;
export type RoleplaySummaryOut = z.infer<typeof RoleplaySummarySchema>;
export type AskReplyOut = z.infer<typeof AskReplySchema>;
