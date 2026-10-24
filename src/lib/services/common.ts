import type { AiClient, AiPurpose, AiResult } from "@/lib/ai/types";
import { AiError } from "@/lib/ai/types";
import { estimateCostUsd } from "@/lib/ai/cost";
import type { Content } from "@/lib/content/types";
import { isValidTimeZone, localDate } from "@/lib/learning/dates";
import type { Rng } from "@/lib/learning/random";
import type { Rules } from "@/lib/learning/rules";
import { FlowError } from "@/lib/learning/session";
import { createInitialState, type LearnerState } from "@/lib/learning/state";
import { rollStreak } from "@/lib/learning/streak";
import { ConflictError, type EventType, type Store } from "@/lib/store/types";

// Everything a service needs, passed in (not imported), so tests can run the
// real flows with MemoryStore + MockAi and a fixed clock.
export type Deps = {
  userId: string;
  store: Store;
  ai: AiClient;
  content: Content;
  rules: Rules;
  now: () => Date;
  rng: Rng;
  newId: () => string;
  prices: { inputPerMTok: number; outputPerMTok: number };
  /** TEST_BYPASS_CODE for this user (admins and invited emails), or null when off. */
  bypassCode?: string | null;
};

/** True when the learner typed the test code: skip every check and the AI. */
export function isBypass(deps: Deps, text: string): boolean {
  return !!deps.bypassCode && text.trim().toLowerCase() === deps.bypassCode.toLowerCase();
}

/** What every server action returns to the browser. */
export type Result<T> = { ok: true; data: T; message?: string } | { ok: false; error: string; data?: T };

export function ok<T>(data: T, message?: string): Result<T> {
  return message ? { ok: true, data, message } : { ok: true, data };
}

export function fail<T>(error: string, data?: T): Result<T> {
  return data === undefined ? { ok: false, error } : { ok: false, error, data };
}

/** Turns known errors into plain messages; unknown errors are re-thrown. */
export function userMessage(err: unknown): string {
  if (err instanceof AiError) return err.userMessage;
  if (err instanceof FlowError) return err.message;
  if (err instanceof ConflictError) return "Your progress changed in another tab. Reload the page and try again.";
  throw err;
}

export type Loaded = { state: LearnerState; version: number | null; today: string; changed: boolean };

/** Loads the learner (or creates a new one) and settles the streak for today. */
export async function load(deps: Deps, timezone?: string): Promise<Loaded> {
  const row = await deps.store.loadState(deps.userId);
  const tz = timezone && isValidTimeZone(timezone) ? timezone : undefined;
  let state = row?.state ?? createInitialState(deps.now().toISOString(), tz ?? "UTC");
  let changed = !row;
  if (tz && state.profile.timezone !== tz) {
    state = { ...state, profile: { ...state.profile, timezone: tz } };
    changed = true;
  }
  const today = localDate(state.profile.timezone, deps.now());
  const rolled = rollStreak(state.streak, today);
  if (rolled.streak !== state.streak) {
    state = { ...state, streak: rolled.streak, notices: [...state.notices, ...rolled.notices] };
    changed = true;
  }
  return { state, version: row?.version ?? null, today, changed };
}

export async function save(deps: Deps, loaded: Loaded, state: LearnerState): Promise<number> {
  return deps.store.saveState(deps.userId, state, loaded.version);
}

export async function logEvent(deps: Deps, type: EventType, today: string, meta: Record<string, unknown> = {}) {
  await deps.store.logEvent({
    id: deps.newId(),
    userId: deps.userId,
    createdAt: deps.now().toISOString(),
    localDate: today,
    type,
    meta,
  });
}

/** Calls the AI and logs the call (tokens, cost, time, errors). */
export async function callAi<T>(deps: Deps, purpose: AiPurpose, fn: () => Promise<AiResult<T>>): Promise<AiResult<T>> {
  const started = Date.now();
  try {
    const result = await fn();
    if (result.usage) {
      await deps.store.logAiCall({
        id: deps.newId(),
        userId: deps.userId,
        createdAt: deps.now().toISOString(),
        purpose,
        model: result.model,
        ...result.usage,
        costUsd: estimateCostUsd(result.usage, deps.prices.inputPerMTok, deps.prices.outputPerMTok),
        latencyMs: result.latencyMs,
        ok: true,
        error: null,
      });
    }
    return result;
  } catch (err) {
    if (deps.ai.mode === "claude") {
      await deps.store.logAiCall({
        id: deps.newId(),
        userId: deps.userId,
        createdAt: deps.now().toISOString(),
        purpose,
        model: "",
        inputTokens: 0,
        outputTokens: 0,
        cacheWriteTokens: 0,
        cacheReadTokens: 0,
        costUsd: 0,
        latencyMs: Date.now() - started,
        ok: false,
        error: err instanceof Error ? err.message.slice(0, 300) : String(err),
      });
    }
    throw err;
  }
}
