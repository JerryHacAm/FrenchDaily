import { displayWord, type Scenario } from "@/lib/content/types";
import { addDays, weekStart } from "@/lib/learning/dates";
import { checksLeft, countCheck } from "@/lib/learning/session";
import { applySelfUse } from "@/lib/learning/srs";
import { cloneState, type LearnerState, type RoleplaySession } from "@/lib/learning/state";
import { lemmasToSeenWordIds } from "@/lib/learning/usage";
import type { RoleplayInput } from "@/lib/ai/types";
import { callAi, fail, load, logEvent, ok, save, userMessage, type Deps, type Loaded, type Result } from "./common";

// Weekly role-play (ROADMAP D1): a short chat with the AI using the week's
// words. No corrections during the chat; feedback at the end. Each learner
// message uses one AI check from the daily cap.

export const MAX_MESSAGE_CHARS = 300;

export type RoleplayView = {
  scenarios: (Scenario & { locked: boolean })[];
  session: RoleplaySession | null;
  scenario: Scenario | null;
  learnerTurns: number;
  maxTurns: number;
  checksLeft: number;
  doneThisWeek: boolean;
};

function weekWords(state: LearnerState, deps: Deps, today: string): string[] {
  const since = addDays(today, -6);
  return Object.values(state.words)
    .filter((w) => w.lastSeenOn >= since)
    .sort((a, b) => (a.lastSeenOn > b.lastSeenOn ? -1 : 1))
    .slice(0, 12)
    .map((w) => deps.content.wordById.get(w.wordId))
    .filter((w) => w !== undefined)
    .map((w) => displayWord(w));
}

function buildView(deps: Deps, state: LearnerState, today: string): RoleplayView {
  const session = state.roleplay;
  const monday = weekStart(today);
  return {
    scenarios: deps.content.scenarios.map((s) => ({ ...s, locked: s.min_level > state.profile.level })),
    session,
    scenario: session ? (deps.content.scenarios.find((s) => s.id === session.scenarioId) ?? null) : null,
    learnerTurns: session ? session.messages.filter((m) => m.from === "learner").length : 0,
    maxTurns: deps.rules.roleplayMaxTurns,
    checksLeft: checksLeft(state, today, deps.rules),
    doneThisWeek: (state.lastRoleplayOn ?? "") >= monday,
  };
}

async function run(
  deps: Deps,
  change: (loaded: Loaded) => Promise<{ state: LearnerState; error?: string }>,
): Promise<Result<RoleplayView>> {
  let loaded: Loaded;
  try {
    loaded = await load(deps);
  } catch (err) {
    return fail(userMessage(err));
  }
  try {
    const out = await change(loaded);
    if (out.error) return fail(out.error, buildView(deps, loaded.state, loaded.today));
    await save(deps, loaded, out.state);
    return ok(buildView(deps, out.state, loaded.today));
  } catch (err) {
    return fail(userMessage(err), buildView(deps, loaded.state, loaded.today));
  }
}

export async function getRoleplay(deps: Deps): Promise<RoleplayView> {
  const { state, today } = await load(deps);
  return buildView(deps, state, today);
}

function input(deps: Deps, state: LearnerState, session: RoleplaySession): RoleplayInput {
  const scenario = deps.content.scenarios.find((s) => s.id === session.scenarioId)!;
  return {
    scenario,
    level: state.profile.level,
    weekWords: session.weekWords,
    messages: session.messages,
    maxTurns: deps.rules.roleplayMaxTurns,
  };
}

export function startRoleplay(deps: Deps, scenarioId: string) {
  return run(deps, async ({ state, today }) => {
    const scenario = deps.content.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return { state, error: "Pick a scenario." };
    if (scenario.min_level > state.profile.level) return { state, error: `This one opens at level ${scenario.min_level}.` };
    const next = cloneState(state);
    next.roleplay = {
      id: deps.newId(),
      scenarioId,
      startedOn: today,
      weekWords: weekWords(state, deps, today),
      messages: [{ from: "ai", fr: scenario.opening_fr, en: scenario.opening_en }],
      finished: false,
      summary: null,
    };
    return { state: next };
  });
}

async function finish(deps: Deps, state: LearnerState, today: string): Promise<LearnerState> {
  const session = state.roleplay!;
  const r = await callAi(deps, "roleplay_summary", () => deps.ai.roleplaySummary(input(deps, state, session)));
  const known = new Set(deps.content.grammarRules.map((g) => g.id));
  const corrections = r.data.corrections
    .slice(0, 5)
    .map((c) => ({ ...c, tag: known.has(c.tag) ? c.tag : "other" }));
  let next = cloneState(state);
  next.lastRoleplayOn = today;
  next.roleplay = {
    ...session,
    finished: true,
    summary: { overall: r.data.overall, praise: r.data.praise, corrections, wordsUsed: r.data.words_used },
  };
  // Mistakes count toward the coach's stats; words used count as real use.
  const tags = corrections.map((c) => c.tag);
  if (tags.length) {
    const log = { ...next.mistakeLog };
    for (const tag of tags) log[tag] = { ...(log[tag] ?? {}), [today]: (log[tag]?.[today] ?? 0) + 1 };
    next = { ...next, mistakeLog: log };
  }
  const words = { ...next.words };
  for (const id of lemmasToSeenWordIds(r.data.words_used, next, deps.content)) words[id] = applySelfUse(words[id], today);
  next.words = words;
  await logEvent(deps, "roleplay_finished", today, {
    scenarioId: session.scenarioId,
    turns: session.messages.filter((m) => m.from === "learner").length,
    corrections: corrections.length,
  });
  return next;
}

export function sendRoleplayMessage(deps: Deps, text: string) {
  return run(deps, async ({ state, today }) => {
    const session = state.roleplay;
    if (!session || session.finished) return { state, error: "Start a role-play first." };
    const message = text.replace(/\s+/g, " ").trim();
    if (!message) return { state, error: "Write something in French first." };
    if (message.length > MAX_MESSAGE_CHARS) return { state, error: `Keep it under ${MAX_MESSAGE_CHARS} characters.` };
    const turns = session.messages.filter((m) => m.from === "learner").length;
    if (turns >= deps.rules.roleplayMaxTurns) return { state, error: "This chat is over. See your feedback below." };
    if (checksLeft(state, today, deps.rules) <= 0) return { state, error: "No AI checks left today. Come back tomorrow!" };

    let next = countCheck(cloneState(state), today);
    next.roleplay = { ...session, messages: [...session.messages, { from: "learner", fr: message }] };
    const r = await callAi(deps, "roleplay_turn", () => deps.ai.roleplayTurn(input(deps, next, next.roleplay!)));
    next.roleplay = {
      ...next.roleplay,
      messages: [...next.roleplay.messages, { from: "ai", fr: r.data.reply_fr, en: r.data.reply_en }],
    };
    await logEvent(deps, "roleplay_turn", today, { scenarioId: session.scenarioId });
    if (r.data.should_end || turns + 1 >= deps.rules.roleplayMaxTurns) next = await finish(deps, next, today);
    return { state: next };
  });
}

export function finishRoleplay(deps: Deps) {
  return run(deps, async ({ state, today }) => {
    const session = state.roleplay;
    if (!session || session.finished) return { state, error: "No role-play in progress." };
    if (!session.messages.some((m) => m.from === "learner")) {
      const next = cloneState(state);
      next.roleplay = null;
      return { state: next };
    }
    return { state: await finish(deps, state, today) };
  });
}

export function closeRoleplay(deps: Deps) {
  return run(deps, async ({ state }) => {
    const next = cloneState(state);
    next.roleplay = null;
    return { state: next };
  });
}
