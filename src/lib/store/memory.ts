import type { LearnerState } from "@/lib/learning/state";
import {
  ConflictError,
  type AiCallRecord,
  type EventRecord,
  type ReportRecord,
  type SentenceRecord,
  type Store,
  type UserSummary,
} from "./types";

export type MemoryData = {
  states: Record<string, { state: LearnerState; version: number }>;
  sentences: SentenceRecord[];
  reports: ReportRecord[];
  aiCalls: AiCallRecord[];
  events: EventRecord[];
};

export function emptyData(): MemoryData {
  return { states: {}, sentences: [], reports: [], aiCalls: [], events: [] };
}

/** Keeps everything in memory. Used by tests, and as the base of FileStore. */
export class MemoryStore implements Store {
  readonly kind: Store["kind"] = "memory";
  constructor(protected data: MemoryData = emptyData()) {}

  /**
   * Runs one operation. FileStore overrides this to read the file first,
   * write it after a change, and run one operation at a time.
   */
  protected async run<T>(_mutates: boolean, fn: (data: MemoryData) => T): Promise<T> {
    return fn(this.data);
  }

  loadState(userId: string) {
    return this.run(false, (d) => {
      const row = d.states[userId];
      return row ? { state: structuredClone(row.state), version: row.version } : null;
    });
  }

  saveState(userId: string, state: LearnerState, expectedVersion: number | null) {
    return this.run(true, (d) => {
      const row = d.states[userId];
      const current = row ? row.version : null;
      if (current !== expectedVersion) throw new ConflictError();
      const version = (current ?? 0) + 1;
      d.states[userId] = { state: structuredClone(state), version };
      return version;
    });
  }

  addSentence(record: SentenceRecord) {
    return this.run(true, (d) => void d.sentences.push(structuredClone(record)));
  }

  listSentences(userId: string, limit: number) {
    return this.run(false, (d) =>
      d.sentences
        .filter((s) => s.userId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, limit)
        .map((s) => structuredClone(s)),
    );
  }

  addReport(record: ReportRecord) {
    return this.run(true, (d) => void d.reports.push(structuredClone(record)));
  }

  logAiCall(record: AiCallRecord) {
    return this.run(true, (d) => void d.aiCalls.push({ ...record }));
  }

  logEvent(record: EventRecord) {
    return this.run(true, (d) => void d.events.push(structuredClone(record)));
  }

  listAiCalls(sinceIso: string) {
    return this.run(false, (d) => d.aiCalls.filter((c) => c.createdAt >= sinceIso).map((c) => ({ ...c })));
  }

  listEvents(sinceIso: string) {
    return this.run(false, (d) => d.events.filter((e) => e.createdAt >= sinceIso).map((e) => structuredClone(e)));
  }

  listUsers(): Promise<UserSummary[]> {
    return this.run(false, (d) =>
      Object.entries(d.states).map(([userId, row]) => ({
        userId,
        name: row.state.profile.name || userId,
      })),
    );
  }
}
