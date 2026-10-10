import type { Feedback } from "@/lib/learning/state";
import type { LearnerState } from "@/lib/learning/state";
import type { AiPurpose } from "@/lib/ai/types";

// Where the app keeps data. Three versions with the same interface:
// - MemoryStore: tests
// - FileStore: development on your own computer (.data/store.json)
// - SupabaseStore: the real app (needs the SQL in supabase/migrations applied)

export type SentenceRecord = {
  id: string;
  userId: string;
  createdAt: string;
  localDate: string;
  wordId: string;
  itemType: "statement" | "question";
  templateId: string;
  original: string;
  feedback: Feedback;
};

export type ReportRecord = {
  id: string;
  userId: string;
  createdAt: string;
  sentenceId: string | null;
  note: string;
  context: Record<string, unknown>;
};

export type AiCallRecord = {
  id: string;
  userId: string;
  createdAt: string;
  purpose: AiPurpose;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  costUsd: number;
  latencyMs: number;
  ok: boolean;
  error: string | null;
};

export type EventType =
  | "session_started"
  | "item_checked"
  | "item_accepted"
  | "word_completed"
  | "batch_finished"
  | "roleplay_turn"
  | "roleplay_finished"
  | "report_sent";

export type EventRecord = {
  id: string;
  userId: string;
  createdAt: string;
  localDate: string;
  type: EventType;
  meta: Record<string, unknown>;
};

export type UserSummary = { userId: string; name: string };

export class ConflictError extends Error {
  constructor() {
    super("The data changed in another tab. Please try again.");
  }
}

export interface Store {
  readonly kind: "memory" | "file" | "supabase";
  loadState(userId: string): Promise<{ state: LearnerState; version: number } | null>;
  /** Saves only if nobody saved since `expectedVersion` (null = first save). Returns the new version. */
  saveState(userId: string, state: LearnerState, expectedVersion: number | null): Promise<number>;
  addSentence(record: SentenceRecord): Promise<void>;
  listSentences(userId: string, limit: number): Promise<SentenceRecord[]>;
  addReport(record: ReportRecord): Promise<void>;
  logAiCall(record: AiCallRecord): Promise<void>;
  logEvent(record: EventRecord): Promise<void>;
  /** For the /stats page (pilot measurement). */
  listAiCalls(sinceIso: string): Promise<AiCallRecord[]>;
  listEvents(sinceIso: string): Promise<EventRecord[]>;
  listUsers(): Promise<UserSummary[]>;
}
