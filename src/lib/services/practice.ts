import { codeCheck } from "@/lib/learning/checks";
import { hasMajorMistake, normalizeFeedback } from "@/lib/learning/feedback";
import { topMistakes } from "@/lib/learning/mistakes";
import {
  applyCheck,
  applyFixAttempt,
  applyRetype,
  beginWriting,
  checksLeft,
  clearNotices,
  countCheck,
  currentItem,
  currentWordProgress,
  revealAnswer,
  skipRetype,
  startSession,
} from "@/lib/learning/session";
import { cloneState, getDaily, type LearnerState } from "@/lib/learning/state";
import { sameSentence } from "@/lib/learning/text";
import { buildPracticeView, type PracticeView } from "@/lib/learning/view";
import { callAi, fail, load, logEvent, ok, save, userMessage, type Deps, type Loaded, type Result } from "./common";

// The practice flow behind the buttons (ROADMAP B2–B8, C1–C5).
// Each function: load → change → save → return what the screen shows.

function view(deps: Deps, state: LearnerState, today: string): PracticeView {
  return buildPracticeView(state, deps.content, deps.rules, today);
}

export async function getPractice(deps: Deps, timezone?: string): Promise<Result<PracticeView>> {
  const loaded = await load(deps, timezone);
  // Save only when load() changed something (new learner, streak rolled, time zone).
  if (loaded.changed) await save(deps, loaded, loaded.state);
  return ok(view(deps, loaded.state, loaded.today));
}

async function run(
  deps: Deps,
  timezone: string | undefined,
  change: (loaded: Loaded) => Promise<{ state: LearnerState; message?: string; error?: string }>,
): Promise<Result<PracticeView>> {
  let loaded: Loaded;
  try {
    loaded = await load(deps, timezone);
  } catch (err) {
    return fail(userMessage(err));
  }
  try {
    const out = await change(loaded);
    if (out.error) return fail(out.error, view(deps, loaded.state, loaded.today));
    await save(deps, loaded, out.state);
    return ok(view(deps, out.state, loaded.today), out.message);
  } catch (err) {
    return fail(userMessage(err), view(deps, loaded.state, loaded.today));
  }
}

export function startPractice(deps: Deps, input: { timezone?: string; focusTag?: string | null }) {
  return run(deps, input.timezone, async ({ state, today }) => {
    if (!state.profile.onboarded) return { state, error: "Finish the welcome steps first." };
    if (state.session && !state.session.finished) return { state, message: "Continuing where you left off." };
    const focusTag = input.focusTag && deps.content.ruleById.has(input.focusTag) ? input.focusTag : null;
    const result = startSession(state, deps.content, deps.rules, today, deps.now().toISOString(), deps.rng, {
      focusTag,
      sessionId: deps.newId(),
    });
    if (!result.started) {
      return { state, error: "You've seen every word we have so far. Jerry is adding more!" };
    }
    await logEvent(deps, "session_started", today, {
      words: result.state.session!.words.map((w) => ({ id: w.wordId, reason: w.reason })),
      focusTag,
    });
    return { state: result.state };
  });
}

export function startWriting(deps: Deps) {
  return run(deps, undefined, async ({ state }) => ({ state: beginWriting(state) }));
}

export function submitSentence(deps: Deps, input: { sentence: string }) {
  return run(deps, undefined, async ({ state, today }) => {
    const wp = currentWordProgress(state);
    const item = currentItem(state);
    if (item.stage !== "write") return { state, error: "This sentence was already checked." };
    const word = deps.content.wordById.get(wp.wordId)!;
    const template = deps.content.structureById.get(item.templateId);
    const check = codeCheck(
      { sentence: input.sentence, word, itemType: item.type, level: state.profile.level },
      deps.rules,
    );
    if (!check.ok) return { state, error: check.message };
    if (checksLeft(state, today, deps.rules) <= 0) {
      return { state, error: `You've used all ${deps.rules.maxChecksPerDay} AI checks for today. Come back tomorrow!` };
    }

    const recentTags = topMistakes(state, today, 14)
      .slice(0, 3)
      .map((t) => t.tag);
    const result = await callAi(deps, "check", () =>
      deps.ai.checkSentence({
        level: state.profile.level,
        learnerGender: state.profile.gender ?? null,
        word,
        itemType: item.type,
        templatePattern: template?.pattern ?? "",
        templateExample: template ? (template.examples[word.pos]?.[1] ?? null) : null,
        sentence: check.sentence,
        focusTag: state.session?.focusTag ?? null,
        recentMistakeTags: recentTags,
      }),
    );
    const feedback = normalizeFeedback(result.data, {
      sentence: check.sentence,
      itemType: item.type,
      knownTags: new Set(deps.content.grammarRules.map((r) => r.id)),
    });

    const sentenceId = deps.newId();
    await deps.store.addSentence({
      id: sentenceId,
      userId: deps.userId,
      createdAt: deps.now().toISOString(),
      localDate: today,
      wordId: word.id,
      itemType: item.type,
      templateId: item.templateId,
      original: check.sentence,
      feedback,
    });

    let next = countCheck(state, today);
    const wordsBefore = getDaily(next, today).wordsCompleted.length;
    const applied = applyCheck(next, deps.content, deps.rules, today, check.sentence, feedback, sentenceId);
    next = applied.state;

    await logEvent(deps, "item_checked", today, {
      wordId: word.id,
      firstCheck: item.checks === 0,
      structureOk: feedback.structure_ok,
      correct: feedback.is_correct,
      major: hasMajorMistake(feedback),
      tags: feedback.mistakes.map((m) => m.tag),
      model: result.model,
      latencyMs: result.latencyMs,
    });
    await afterAccept(deps, next, today, wordsBefore, applied.outcome === "accepted");

    const message =
      applied.outcome === "structure_retry"
        ? feedback.structure_note || "Add a little more and try again."
        : applied.outcome === "accepted"
          ? feedback.encouragement || "Correct!"
          : undefined;
    return { state: next, message };
  });
}

async function afterAccept(deps: Deps, state: LearnerState, today: string, wordsBefore: number, accepted: boolean) {
  if (!accepted) return;
  await logEvent(deps, "item_accepted", today, {});
  const after = getDaily(state, today).wordsCompleted.length;
  if (after > wordsBefore) {
    await logEvent(deps, "word_completed", today, { completedToday: after });
  }
  if (state.session?.finished) await logEvent(deps, "batch_finished", today, { words: state.session.words.length });
}

export function submitFix(deps: Deps, input: { attempt: string }) {
  return run(deps, undefined, async ({ state, today }) => {
    if (!input.attempt.trim()) return { state, error: "Write your corrected sentence first." };
    const wordsBefore = getDaily(state, today).wordsCompleted.length;
    const r = applyFixAttempt(state, deps.content, deps.rules, today, input.attempt);
    await afterAccept(deps, r.state, today, wordsBefore, r.outcome === "accepted");
    return {
      state: r.state,
      message: r.outcome === "accepted" ? "You fixed it yourself. Great!" : "Not quite. Here is the answer: retype it.",
    };
  });
}

export function showAnswer(deps: Deps) {
  return run(deps, undefined, async ({ state }) => ({ state: revealAnswer(state) }));
}

export function submitRetype(deps: Deps, input: { text: string }) {
  return run(deps, undefined, async ({ state, today }) => {
    const wordsBefore = getDaily(state, today).wordsCompleted.length;
    const r = applyRetype(state, deps.content, deps.rules, today, input.text, sameSentence);
    await afterAccept(deps, r.state, today, wordsBefore, r.outcome === "accepted");
    if (r.outcome === "try_again") {
      return { state: r.state, error: "Not the same yet. Check accents and small words, then try again." };
    }
    return { state: r.state, message: "Well done!" };
  });
}

export function skipItem(deps: Deps) {
  return run(deps, undefined, async ({ state, today }) => {
    const wordsBefore = getDaily(state, today).wordsCompleted.length;
    const next = skipRetype(state, deps.content, deps.rules, today);
    await afterAccept(deps, next, today, wordsBefore, true);
    return { state: next };
  });
}

export function endPractice(deps: Deps) {
  return run(deps, undefined, async ({ state }) => {
    const next = cloneState(state);
    next.session = null;
    return { state: next };
  });
}

export function dismissNotices(deps: Deps) {
  return run(deps, undefined, async ({ state }) => ({ state: clearNotices(state) }));
}

export async function reportFeedback(
  deps: Deps,
  input: { sentenceId: string | null; note: string; context: Record<string, unknown> },
): Promise<Result<null>> {
  const loaded = await load(deps);
  await deps.store.addReport({
    id: deps.newId(),
    userId: deps.userId,
    createdAt: deps.now().toISOString(),
    sentenceId: input.sentenceId,
    note: input.note.slice(0, 1000),
    context: input.context,
  });
  await logEvent(deps, "report_sent", loaded.today, {});
  return ok(null, "Thanks! Jerry will look at it.");
}
