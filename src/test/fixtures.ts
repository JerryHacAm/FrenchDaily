import { MockAi } from "@/lib/ai/mock";
import { rawContent } from "@/lib/content";
import { buildContent, type Content, type Word } from "@/lib/content/types";
import { createInitialState, type LearnerState } from "@/lib/learning/state";
import { seededRng } from "@/lib/learning/random";
import { TEST_RULES, type Rules } from "@/lib/learning/rules";
import { newUserWord } from "@/lib/learning/srs";
import type { Deps } from "@/lib/services/common";
import { MemoryStore } from "@/lib/store/memory";

// Shared helpers for tests.

export const REAL_CONTENT: Content = buildContent(rawContent());

export function word(id: string, content: Content = REAL_CONTENT): Word {
  const w = content.wordById.get(id);
  if (!w) throw new Error(`no word ${id}`);
  return w;
}

export function onboardedState(level = 1, tz = "UTC"): LearnerState {
  const s = createInitialState("2026-10-01T08:00:00.000Z", tz);
  s.profile = { ...s.profile, name: "Test", level, onboarded: true };
  return s;
}

/** A state where the given words were introduced on `introducedOn`. */
export function withWords(
  state: LearnerState,
  ids: string[],
  introducedOn: string,
  patch: Partial<ReturnType<typeof newUserWord>> = {},
): LearnerState {
  const words = { ...state.words };
  for (const id of ids) words[id] = { ...newUserWord(id, introducedOn), completedCount: 1, ...patch };
  return { ...state, words };
}

export class Clock {
  constructor(public current: Date) {}
  now = () => this.current;
  advanceMinutes(n: number) {
    this.current = new Date(this.current.getTime() + n * 60_000);
  }
  advanceDays(n: number) {
    this.current = new Date(this.current.getTime() + n * 86_400_000);
  }
}

export function testDeps(overrides: Partial<Deps> = {}, rules: Rules = TEST_RULES) {
  const store = new MemoryStore();
  const clock = new Clock(new Date("2026-10-10T09:00:00.000Z"));
  let n = 0;
  const deps: Deps = {
    userId: "u1",
    store,
    ai: new MockAi(REAL_CONTENT),
    content: REAL_CONTENT,
    rules,
    now: clock.now,
    rng: seededRng(42),
    newId: () => `id-${++n}`,
    prices: { inputPerMTok: 0.1, outputPerMTok: 0.5 },
    ...overrides,
  };
  return { deps, store, clock };
}
