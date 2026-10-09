import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
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

// The real database. `user` is a client with the signed-in user's session, so
// row level security limits it to that user's rows. `admin` (service role) is
// only used by the /stats page lists.

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Database error (${what}): ${error?.message ?? "unknown"}`);
}

export class SupabaseStore implements Store {
  readonly kind = "supabase" as const;
  constructor(
    private user: SupabaseClient,
    private admin: () => SupabaseClient,
  ) {}

  async loadState(userId: string) {
    const { data, error } = await this.user
      .from("learner_state")
      .select("state, version")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) fail("load state", error);
    return data ? { state: data.state as LearnerState, version: data.version as number } : null;
  }

  async saveState(userId: string, state: LearnerState, expectedVersion: number | null) {
    if (expectedVersion === null) {
      const { error } = await this.user.from("learner_state").insert({ user_id: userId, state, version: 1 });
      if (error?.code === "23505") throw new ConflictError();
      if (error) fail("create state", error);
      return 1;
    }
    const { data, error } = await this.user
      .from("learner_state")
      .update({ state, version: expectedVersion + 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("version", expectedVersion)
      .select("version");
    if (error) fail("save state", error);
    if (!data || data.length === 0) throw new ConflictError();
    return expectedVersion + 1;
  }

  async addSentence(r: SentenceRecord) {
    const { error } = await this.user.from("sentences").insert({
      id: r.id,
      user_id: r.userId,
      created_at: r.createdAt,
      local_date: r.localDate,
      word_id: r.wordId,
      item_type: r.itemType,
      template_id: r.templateId,
      original: r.original,
      feedback: r.feedback,
    });
    if (error) fail("save sentence", error);
  }

  async listSentences(userId: string, limit: number): Promise<SentenceRecord[]> {
    const { data, error } = await this.user
      .from("sentences")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) fail("list sentences", error);
    return (data ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      createdAt: r.created_at,
      localDate: r.local_date,
      wordId: r.word_id,
      itemType: r.item_type,
      templateId: r.template_id,
      original: r.original,
      feedback: r.feedback,
    }));
  }

  async addReport(r: ReportRecord) {
    const { error } = await this.user.from("reports").insert({
      id: r.id,
      user_id: r.userId,
      created_at: r.createdAt,
      sentence_id: r.sentenceId,
      note: r.note,
      context: r.context,
    });
    if (error) fail("save report", error);
  }

  async logAiCall(r: AiCallRecord) {
    const { error } = await this.user.from("ai_calls").insert({
      id: r.id,
      user_id: r.userId,
      created_at: r.createdAt,
      purpose: r.purpose,
      model: r.model,
      input_tokens: r.inputTokens,
      output_tokens: r.outputTokens,
      cache_write_tokens: r.cacheWriteTokens,
      cache_read_tokens: r.cacheReadTokens,
      cost_usd: r.costUsd,
      latency_ms: r.latencyMs,
      ok: r.ok,
      error: r.error,
    });
    // Logging must never break the learner's flow.
    if (error) console.error("ai_calls insert failed:", error.message);
  }

  async logEvent(r: EventRecord) {
    const { error } = await this.user.from("events").insert({
      id: r.id,
      user_id: r.userId,
      created_at: r.createdAt,
      local_date: r.localDate,
      type: r.type,
      meta: r.meta,
    });
    if (error) console.error("events insert failed:", error.message);
  }

  async listAiCalls(sinceIso: string): Promise<AiCallRecord[]> {
    const { data, error } = await this.admin().from("ai_calls").select("*").gte("created_at", sinceIso);
    if (error) fail("list ai calls", error);
    return (data ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      createdAt: r.created_at,
      purpose: r.purpose,
      model: r.model,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      cacheWriteTokens: r.cache_write_tokens,
      cacheReadTokens: r.cache_read_tokens,
      costUsd: Number(r.cost_usd),
      latencyMs: r.latency_ms,
      ok: r.ok,
      error: r.error,
    }));
  }

  async listEvents(sinceIso: string): Promise<EventRecord[]> {
    const { data, error } = await this.admin().from("events").select("*").gte("created_at", sinceIso);
    if (error) fail("list events", error);
    return (data ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      createdAt: r.created_at,
      localDate: r.local_date,
      type: r.type,
      meta: r.meta,
    }));
  }

  async listUsers(): Promise<UserSummary[]> {
    const { data, error } = await this.admin().from("learner_state").select("user_id, state");
    if (error) fail("list users", error);
    return (data ?? []).map((r) => ({
      userId: r.user_id,
      name: (r.state as LearnerState)?.profile?.name || String(r.user_id).slice(0, 8),
    }));
  }
}
