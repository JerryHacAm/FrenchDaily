import type { Scenario, Word } from "@/lib/content/types";
import type { CoachStats } from "@/lib/learning/coach";
import type { RawFeedback } from "@/lib/learning/feedback";
import type { RoleplayMessage } from "@/lib/learning/state";
import type { CoachNoteOut, RoleplayReplyOut, RoleplaySummaryOut, WeeklyReportOut } from "./schemas";

export type AiPurpose = "check" | "coach" | "weekly" | "roleplay_turn" | "roleplay_summary";

export type Usage = {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
};

export type AiResult<T> = { data: T; usage: Usage | null; model: string; latencyMs: number };

export type CheckInput = {
  level: number;
  /** null = not set: accept both forms when the learner writes about themselves. */
  learnerGender: "male" | "female" | null;
  word: Word;
  itemType: "statement" | "question";
  templatePattern: string;
  templateExample: string | null;
  sentence: string;
  focusTag: string | null;
  recentMistakeTags: string[];
};

export type RoleplayInput = {
  scenario: Scenario;
  level: number;
  weekWords: string[];
  messages: RoleplayMessage[];
  maxTurns: number;
};

export interface AiClient {
  readonly mode: "claude" | "mock";
  checkSentence(input: CheckInput): Promise<AiResult<RawFeedback>>;
  coachNote(stats: CoachStats): Promise<AiResult<CoachNoteOut>>;
  weeklyReport(stats: CoachStats): Promise<AiResult<WeeklyReportOut>>;
  roleplayTurn(input: RoleplayInput): Promise<AiResult<RoleplayReplyOut>>;
  roleplaySummary(input: RoleplayInput): Promise<AiResult<RoleplaySummaryOut>>;
}

/** A failure we can explain to the learner in plain words. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly userMessage: string,
  ) {
    super(message);
  }
}
